"use client";

import Link from "next/link";
import { useState } from "react";
import AddBookDialog from "@/components/AddBookDialog";
import BookSpine from "@/components/BookSpine";
import { useHydrated, useShelf } from "@/lib/storage";
import { bookProgress, currentStreak, totalPages } from "@/lib/stats";
import type { Book } from "@/lib/types";

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

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">나의 책장</h1>
          <p className="mt-1 text-sm text-muted">
            {hydrated && books.length > 0
              ? `${books.length}권 · 총 ${totalPages(records).toLocaleString()}쪽 · 연속 ${currentStreak(records)}일`
              : "책을 추가하면 여기에 한 권씩 쌓입니다."}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
        >
          + 책 추가
        </button>
      </div>

      <div className="mt-8 space-y-1">
        {rows.map((row, i) => (
          <Shelf key={i} books={row} records={records} empty={!hydrated || books.length === 0} />
        ))}
      </div>

      {hydrated && books.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-3xl">📖</p>
          <p className="mt-3 font-medium">아직 책장이 비어 있어요</p>
          <p className="mt-1 text-sm text-muted">
            첫 책을 추가하고 독서 기록을 남겨보세요. 기록이 쌓이면 AI가 나의 독서
            취향을 분석해줍니다.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-5 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
          >
            첫 책 추가하기
          </button>
        </div>
      )}

      {hydrated && books.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-muted">목록으로 보기</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {books.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/book/${b.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent-soft/50"
                >
                  {b.coverImage ? (
                    // 알라딘 CDN URL 또는 사용자가 올린 data URL
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.coverImage}
                      alt=""
                      className="h-11 w-8 shrink-0 rounded-sm object-cover shadow-sm"
                    />
                  ) : (
                    <span
                      className="h-11 w-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: b.spineColor }}
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{b.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {b.author} · {b.genre}
                    </span>
                  </span>
                  <span className="text-xs text-muted">
                    {bookProgress(b, records)}%
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

function Shelf({
  books,
  records,
  empty,
}: {
  books: Book[];
  records: ReturnType<typeof useShelf>["records"];
  empty: boolean;
}) {
  return (
    <div>
      <div className="flex min-h-[385px] items-end gap-[3px] overflow-x-auto px-4 pb-0">
        {empty
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{ width: 36, height: 290 + i * 16 }}
                className="shrink-0 rounded-t-[3px] border border-dashed border-line bg-line/20"
              />
            ))
          : books.map((b) => (
              <BookSpine key={b.id} book={b} progress={bookProgress(b, records)} />
            ))}
      </div>
      <div className="shelf-board h-3 rounded-sm shadow-[0_3px_6px_rgba(0,0,0,0.25)]" />
    </div>
  );
}
