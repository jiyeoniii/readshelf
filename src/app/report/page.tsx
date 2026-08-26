"use client";

import Link from "next/link";
import { useState } from "react";
import { saveReport, useHydrated, useShelf } from "@/lib/storage";
import { currentStreak, monthlyStats, totalPages } from "@/lib/stats";
import type { AIReport } from "@/lib/types";

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI 독서 리포트</h1>
          <p className="mt-1 text-sm text-muted">
            내가 남긴 기록을 근거로, 나는 어떤 책을 좋아하는 사람인지 알려드려요.
          </p>
        </div>
        {ready && (
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "분석 중…" : report ? "다시 분석하기" : "리포트 생성하기"}
          </button>
        )}
      </div>

      {/* 분석에 쓰이는 데이터 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="분석 대상 책" value={`${books.length}권`} />
        <Stat label="독서 기록" value={`${records.length}건`} />
        <Stat label="총 독서량" value={`${totalPages(records).toLocaleString()}쪽`} />
        <Stat
          label="이번 달"
          value={`${month.days}일 · ${month.pages.toLocaleString()}쪽`}
        />
      </section>

      {!ready && (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-3xl">🌱</p>
          <p className="mt-3 font-medium">분석할 기록이 아직 부족해요</p>
          <p className="mt-1 text-sm text-muted">
            책을 추가하고 읽은 페이지와 문장을 남기면, 그 데이터를 바탕으로 AI가
            분석해드려요.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
          >
            책장으로 가기
          </Link>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {loading && !report && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-line bg-surface"
            />
          ))}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-accent-soft p-6">
            <p className="text-xs font-medium text-accent">AI 한줄 분석</p>
            <p className="mt-2 text-lg font-semibold leading-relaxed tracking-tight">
              {report.summary}
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card icon="📚" title="선호 장르" body={report.preferredGenres} />
            <Card icon="🗓️" title="독서 습관" body={report.readingHabit} />
            <Card icon="⭐" title="높은 평점의 공통점" body={report.ratingPattern} />
            <section className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-xs font-medium text-muted">🔖 주요 관심 주제</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-accent-soft px-3 py-1 text-sm text-accent"
                  >
                    #{k}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted">
              생성 시각 {new Date(report.generatedAt).toLocaleString("ko-KR")}
            </p>
            <button
              onClick={() => saveReport(null)}
              className="text-xs text-muted underline hover:text-ink"
            >
              리포트 지우기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs font-medium text-muted">
        {icon} {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
