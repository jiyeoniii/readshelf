"use client";

import Link from "next/link";
import { useState } from "react";
import { addBook, newId, saveReport, useHydrated, useShelf } from "@/lib/storage";
import { currentStreak, monthlyStats, totalPages } from "@/lib/stats";
import {
  SPINE_COLORS,
  type AIReport,
  type Recommendation,
} from "@/lib/types";

export default function ReportPage() {
  const { books, records, report } = useShelf();
  const hydrated = useHydrated();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = books.length > 0 && records.length > 0;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ books, records }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "리포트 생성에 실패했습니다.");
        return;
      }
      saveReport(data as AIReport);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  const month = monthlyStats(records);

  /** 추천받은 책이 이미 책장에 있는지 */
  function onShelf(rec: Recommendation) {
    return books.some((b) => b.title.trim() === rec.title.trim());
  }

  /** 추천 책을 바로 책장에 꽂는다. 장르·페이지 수는 나중에 수정하면 된다 */
  function addRecommendation(rec: Recommendation) {
    addBook({
      id: newId(),
      title: rec.title,
      author: rec.author || "저자 미상",
      publisher: "",
      genre: "기타",
      spineColor: SPINE_COLORS[books.length % SPINE_COLORS.length],
      spineImage: null,
      spineAspect: null,
      coverImage: rec.coverUrl,
      coverAspect: null,
      totalPages: 0,
      rating: 0,
      review: "",
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-ko">AI 독서 리포트</p>
          <h1 className="display mt-2">
            AI REPORT
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            내가 남긴 기록을 근거로, 나는 어떤 책을 좋아하는 사람인지 알려드려요.
          </p>
        </div>
        {ready && (
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-full bg-ink px-7 py-3 text-[11px] uppercase tracking-[0.16em] text-bg transition hover:bg-accent disabled:opacity-40"
          >
            {loading ? "Analyzing…" : report ? "Regenerate" : "Generate report"}
          </button>
        )}
      </header>

      {/* 분석에 쓰이는 데이터 */}
      <section className="mt-14 grid grid-cols-2 gap-y-10 border-y border-line-soft py-10 sm:grid-cols-4 sm:gap-0">
        <Stat label="Books" value={`${books.length}권`} />
        <Stat label="Records" value={`${records.length}건`} />
        <Stat label="Total pages" value={`${totalPages(records).toLocaleString()}쪽`} />
        <Stat
          label="This month"
          value={`${month.days}일 · ${month.pages.toLocaleString()}쪽`}
          last
        />
      </section>

      {!ready && (
        <div className="mt-20 text-center">
          <p className="font-[family-name:var(--font-serif)] text-2xl">
            분석할 기록이 아직 부족해요
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            책을 추가하고 읽은 페이지와 문장을 남기면, 그 데이터를 바탕으로 AI가
            분석해드려요.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-full border border-line px-7 py-3 text-[11px] uppercase tracking-[0.16em] text-muted transition hover:border-accent hover:text-accent"
          >
            Go to shelf
          </Link>
        </div>
      )}

      {error && (
        <p className="mt-8 border-l-2 border-accent bg-accent-soft px-4 py-3 text-sm text-accent-ink">
          {error}
        </p>
      )}

      {loading && !report && (
        <div className="mt-14 space-y-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse border-b border-line-soft"
            />
          ))}
        </div>
      )}

      {report && (
        <div className="mt-14">
          {/* 한줄 분석 — 이 페이지의 주인공 */}
          <section className="border-b border-ink/20 pb-14 text-center">
            <p className="label">In one line</p>
            <p className="mx-auto mt-5 max-w-2xl font-[family-name:var(--font-serif)] text-[30px] leading-[1.45] tracking-tight">
              {report.summary}
            </p>
          </section>

          <div className="mt-16 grid gap-5 sm:grid-cols-2">
            <Block label="Genre" title="선호 장르" body={report.preferredGenres} />
            <Block label="Habit" title="독서 습관" body={report.readingHabit} />
            <Block
              label="Ratings"
              title="높은 평점의 공통점"
              body={report.ratingPattern}
            />
            <div className="rounded-2xl bg-surface p-7 shadow-[0_2px_18px_rgba(26,23,20,0.05)]">
              <p className="label">Themes</p>
              <p className="mt-2 text-[15px]">주요 관심 주제</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {report.keywords.map((k) => (
                  <span
                    key={k}
                    className="font-[family-name:var(--font-serif)] text-xl text-accent"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {report.recommendations && report.recommendations.length > 0 && (
            <section className="mt-20">
              <p className="label border-b border-line-soft pb-3">
                Next reads — 다음에 읽으면 좋을 책
              </p>

              <ul>
                {report.recommendations.map((rec) => (
                  <li
                    key={rec.isbn ?? rec.title}
                    className="flex gap-6 border-b border-line-soft py-7"
                  >
                    {rec.coverUrl ? (
                      // 알라딘 CDN 이미지라 next/image 대상은 아니다
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rec.coverUrl}
                        alt=""
                        className="h-[104px] w-[72px] shrink-0 object-cover"
                      />
                    ) : (
                      <span className="h-[104px] w-[72px] shrink-0 border border-dashed border-line" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[15px]">{rec.title}</p>
                      <p className="mt-1 text-xs text-muted">{rec.author}</p>
                      <p className="mt-3 text-sm leading-relaxed text-ink/80">
                        {rec.reason}
                      </p>
                      <button
                        onClick={() => addRecommendation(rec)}
                        disabled={onShelf(rec)}
                        className="mt-4 text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition hover:text-accent disabled:no-underline disabled:opacity-40"
                      >
                        {onShelf(rec) ? "On your shelf" : "+ Add to shelf"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-[11px] leading-relaxed text-muted">
                추천받은 책은 알라딘에서 실제로 있는지 확인한 것만 보여드려요.
              </p>
            </section>
          )}

          <div className="mt-16 flex items-center justify-between border-t border-line-soft pt-6">
            <p className="text-[11px] text-muted">
              {new Date(report.generatedAt).toLocaleString("ko-KR")}
            </p>
            <button
              onClick={() => saveReport(null)}
              className="text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-accent"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 리포트 항목 하나 — 카드 대신 라벨과 여백으로 구분한다 */
function Block({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-7 shadow-[0_2px_18px_rgba(26,23,20,0.05)]">
      <p className="label">{label}</p>
      <p className="mt-2 text-[15px]">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{body}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`sm:px-8 ${last ? "" : "sm:border-r sm:border-line-soft"}`}>
      <p className="label">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-serif)] text-[28px] leading-none">
        {value}
      </p>
    </div>
  );
}
