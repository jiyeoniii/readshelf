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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">독서 트래커</h1>
        <p className="mt-1 text-sm text-muted">
          하루에 읽은 페이지가 진해질수록 나의 독서 습관이 보입니다.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="연속 독서일" value={`${streak}일`} hint={`최장 ${best}일`} />
        <Stat
          label="이번 달"
          value={`${month.pages.toLocaleString()}쪽`}
          hint={`${month.days}일 기록`}
        />
        <Stat label="총 독서 페이지" value={`${total.toLocaleString()}쪽`} />
        <Stat label="책장의 책" value={`${books.length}권`} />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold">지난 6개월</h2>
        <Heatmap records={records} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted">최근 기록</h2>
        {recent.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            아직 기록이 없어요.{" "}
            <Link href="/" className="text-accent underline">
              책장
            </Link>
            에서 책을 골라 오늘 읽은 페이지를 남겨보세요.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {recent.map((r) => {
              const book = books.find((b) => b.id === r.bookId);
              return (
                <li key={r.id}>
                  <Link
                    href={book ? `/book/${book.id}` : "/"}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent-soft/50"
                  >
                    <span
                      className="h-7 w-1.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: book?.spineColor ?? "var(--border)" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {book?.title ?? "삭제된 책"}
                      </span>
                      <span className="block text-xs text-muted">
                        {r.date} · {r.startPage}–{r.endPage}쪽
                      </span>
                    </span>
                    <span className="text-xs font-medium text-accent">
                      {r.pagesRead}쪽
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
          className="block rounded-2xl border border-line bg-accent-soft p-5 transition hover:opacity-90"
        >
          <p className="text-sm font-semibold text-accent">
            🤖 쌓인 기록으로 AI 리포트 만들기 →
          </p>
          <p className="mt-1 text-xs text-muted">
            지금까지의 기록을 분석해 나의 독서 취향과 습관을 알려드려요.
          </p>
        </Link>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
