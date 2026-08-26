"use client";

import Link from "next/link";
import Heatmap from "@/components/Heatmap";
import { useHydrated, useShelf } from "@/lib/storage";
import {
  currentStreak,
  longestStreak,
  monthlyStats,
  totalPages,
} from "@/lib/stats";

export default function TrackerPage() {
  const { books, records } = useShelf();
  const hydrated = useHydrated();

  if (!hydrated) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  const month = monthlyStats(records);
  const total = totalPages(records);
  const streak = currentStreak(records);
  const best = longestStreak(records);

  const recent = [...records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div>
      <header>
        <p className="label">Reading Tracker</p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-[42px] leading-none tracking-tight">
          독서 트래커
        </h1>
        <p className="mt-4 text-sm text-muted">
          하루에 읽은 페이지가 진해질수록 나의 독서 습관이 보입니다.
        </p>
      </header>

      {/* 숫자 — 카드 대신 세로 구분선으로 나눈다 */}
      <section className="mt-14 grid grid-cols-2 gap-y-10 border-y border-line-soft py-10 sm:grid-cols-4 sm:gap-0">
        <Figure label="Streak" value={`${streak}일`} hint={`최장 ${best}일`} />
        <Figure
          label="This month"
          value={`${month.pages.toLocaleString()}쪽`}
          hint={`${month.days}일 기록`}
        />
        <Figure label="Total pages" value={`${total.toLocaleString()}쪽`} />
        <Figure label="Books" value={`${books.length}권`} last />
      </section>

      <section className="mt-16">
        <p className="label">Last 6 months</p>
        <div className="mt-6">
          <Heatmap records={records} />
        </div>
      </section>

      <section className="mt-20">
        <p className="label border-b border-line-soft pb-3">Recent records</p>
        {recent.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">
            아직 기록이 없어요.{" "}
            <Link href="/" className="text-accent underline underline-offset-4">
              책장
            </Link>
            에서 책을 골라 오늘 읽은 페이지를 남겨보세요.
          </p>
        ) : (
          <ul>
            {recent.map((r) => {
              const book = books.find((b) => b.id === r.bookId);
              return (
                <li key={r.id} className="border-b border-line-soft">
                  <Link
                    href={book ? `/book/${book.id}` : "/"}
                    className="group flex items-center gap-5 py-4"
                  >
                    {book?.coverImage ? (
                      // 알라딘 CDN URL 또는 사용자가 올린 data URL
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverImage}
                        alt=""
                        className="h-14 w-10 shrink-0 object-cover"
                      />
                    ) : (
                      <span
                        className="h-14 w-10 shrink-0"
                        style={{
                          backgroundColor: book?.spineColor ?? "var(--line)",
                        }}
                      />
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] transition-colors group-hover:text-accent">
                        {book?.title ?? "삭제된 책"}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {r.date} · {r.startPage}–{r.endPage}쪽
                      </span>
                    </span>

                    <span className="font-[family-name:var(--font-serif)] text-lg text-muted">
                      {r.pagesRead}
                      <span className="text-xs">쪽</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {total > 0 && (
        <Link
          href="/report"
          className="group mt-20 flex items-center justify-between border-t border-ink/25 pt-8"
        >
          <span>
            <span className="label">Next</span>
            <span className="mt-2 block font-[family-name:var(--font-serif)] text-2xl transition-colors group-hover:text-accent">
              쌓인 기록으로 AI 리포트 만들기
            </span>
            <span className="mt-2 block text-xs text-muted">
              지금까지의 기록을 분석해 나의 독서 취향과 습관을 알려드려요.
            </span>
          </span>
          <span className="text-2xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent">
            →
          </span>
        </Link>
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  hint,
  last,
}: {
  label: string;
  value: string;
  hint?: string;
  last?: boolean;
}) {
  return (
    <div className={`sm:px-8 ${last ? "" : "sm:border-r sm:border-line-soft"}`}>
      <p className="label">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-serif)] text-[32px] leading-none">
        {value}
      </p>
      {hint && <p className="mt-2 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
