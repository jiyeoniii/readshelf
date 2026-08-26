"use client";

import Link from "next/link";
import { useState } from "react";
import AddBookDialog from "@/components/AddBookDialog";
import BookSpine from "@/components/BookSpine";
import { BookStack, FlowerVase, Rabbits } from "@/components/ShelfDecor";
import ShelfFrame from "@/components/ShelfFrame";
import { useHydrated, useShelf } from "@/lib/storage";
import { bookProgress, currentStreak, totalPages } from "@/lib/stats";
import type { Book, ReadingRecord } from "@/lib/types";

const PER_SHELF = 9;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows.length ? rows : [[]];
}

export default function ShelfPage() {
  const { books, records } = useShelf();
  const hydrated = useHydrated();
  const [adding, setAdding] = useState(false);

  const rows = chunk(books, PER_SHELF);
  const empty = !hydrated || books.length === 0;

  return (
    <div>
      <ShelfFrame>
      {/* 헤더 — 세리프 제목과 얇은 숫자 요약 */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-ko">나의 책장</p>
          <h1 className="display mt-2">
            MY SHELF
          </h1>
        </div>

        {hydrated && books.length > 0 && (
          <dl className="flex items-end gap-8">
            <Figure label="Books" value={books.length} unit="권" />
            <Figure label="Pages" value={totalPages(records)} unit="쪽" />
            <Figure label="Streak" value={currentStreak(records)} unit="일" />
          </dl>
        )}
      </header>

      {/* 책장 */}
      <section className="mt-16">
        <div className="space-y-2">
          {rows.map((row, i) => (
            <Shelf key={i} books={row} records={records} empty={empty} />
          ))}
        </div>
      </section>

      {hydrated && books.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="font-[family-name:var(--font-serif)] text-2xl">
            아직 책장이 비어 있어요
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            첫 책을 추가하고 독서 기록을 남겨보세요. 기록이 쌓이면 AI가 나의 독서
            취향을 분석해줍니다.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-8 rounded-full bg-ink px-7 py-3 text-[11px] uppercase tracking-[0.16em] text-bg transition hover:bg-accent"
          >
            Add your first book
          </button>
        </div>
      ) : (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setAdding(true)}
            className="rounded-full border border-line px-7 py-3 text-[11px] uppercase tracking-[0.16em] text-muted transition hover:border-accent hover:text-accent"
          >
            + Add book
          </button>
        </div>
      )}
      </ShelfFrame>

      {/* 목록 */}
      {hydrated && books.length > 0 && (
        <section className="mt-24">
          <p className="label border-b border-line-soft pb-3">All books</p>
          <ul>
            {books.map((b) => (
              <li key={b.id} className="border-b border-line-soft">
                <Link
                  href={`/book/${b.id}`}
                  className="group flex items-center gap-5 py-4 transition-colors"
                >
                  {b.coverImage ? (
                    // 알라딘 CDN URL 또는 사용자가 올린 data URL
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.coverImage}
                      alt=""
                      className="h-14 w-10 shrink-0 object-cover"
                    />
                  ) : (
                    <span
                      className="h-14 w-10 shrink-0"
                      style={{ backgroundColor: b.spineColor }}
                    />
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] transition-colors group-hover:text-accent">
                      {b.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {b.author} · {b.genre}
                    </span>
                  </span>

                  <span className="font-[family-name:var(--font-serif)] text-lg text-muted">
                    {bookProgress(b, records)}
                    <span className="text-xs">%</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {adding && <AddBookDialog onClose={() => setAdding(false)} />}
    </div>
  );
}

/** 헤더 우측의 숫자 요약 — 라벨은 작게, 숫자는 세리프로 */
function Figure({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="text-right">
      <dt className="label">{label}</dt>
      <dd className="mt-1 font-[family-name:var(--font-serif)] text-[28px] leading-none">
        {value.toLocaleString()}
        <span className="ml-0.5 text-xs text-muted">{unit}</span>
      </dd>
    </div>
  );
}

function Shelf({
  books,
  records,
  empty,
}: {
  books: Book[];
  records: ReadingRecord[];
  empty: boolean;
}) {
  return (
    <div className="relative">
      <div className="relative flex min-h-[385px] items-end gap-[3px] px-1 pb-0">
        {empty
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{ width: 36, height: 290 + i * 16 }}
                className="shrink-0 border-x border-t border-dashed border-line"
              />
            ))
          : books.map((b) => (
              <BookSpine key={b.id} book={b} progress={bookProgress(b, records)} />
            ))}

        {/* 소품은 선반 오른쪽 끝에 모아 세운다 */}
        <span className="pointer-events-none ml-auto hidden shrink-0 items-end gap-5 text-accent/45 sm:flex">
          <BookStack />
          <FlowerVase />
          <span className="text-accent/50">
            <Rabbits />
          </span>
        </span>
      </div>

      {/* 선반 널 — 두께가 있는 판처럼 겹선으로 */}
      <div className="h-[3px] rounded-full bg-accent/45" />
      <div className="mx-3 h-px bg-accent/25" />

      {/* 선반을 받치는 브래킷 */}
      <div className="mt-px flex justify-between px-6">
        <Bracket />
        <Bracket className="-scale-x-100" />
      </div>
    </div>
  );
}

/** 선반 아래를 받치는 작은 소용돌이 받침 */
function Bracket({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 46 26"
      width="46"
      height="26"
      aria-hidden
      className={`text-accent/30 ${className ?? ""}`}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
      >
        <path d="M2 1c0 12 8 22 20 24" />
        <path d="M10 1c0 9 5 16 13 19" />
        <path d="M23 25c8-2 13-8 13-14 0-4-3-6-6-5s-3 5 0 6" />
        <circle cx="31" cy="9" r="1.2" />
      </g>
    </svg>
  );
}
