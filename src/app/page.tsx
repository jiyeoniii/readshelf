"use client";

import Link from "next/link";
import { useState } from "react";
import AddBookDialog from "@/components/AddBookDialog";
import BookSpine, { spineSize } from "@/components/BookSpine";
import { useHydrated, useShelf } from "@/lib/storage";
import { bookProgress, currentStreak, totalPages } from "@/lib/stats";
import type { Book, ReadingRecord } from "@/lib/types";

/**
 * 한 선반에 들어가는 폭(px)과 책 사이 간격.
 * 본문 최대 폭 1024px에서 안쪽 여백을 때 값이다.
 */
const SHELF_WIDTH = 952;
const SPINE_GAP = 3;

/**
 * 책을 선반에 나눈다.
 *
 * 권수로 끊으면 엉성하게 빈다 — 책등은 페이지 수마다 두께가 달라서
 * 어떤 9권은 선반의 절반도 못 채우고 어떤 9권은 넘친다.
 * 그래서 실제 두께를 더해가며 선반이 차면 다음 줄로 넘긴다.
 * 보통 두께라면 한 줄에 20~25권이 들어간다.
 */
function packShelves(books: Book[]): Book[][] {
  const rows: Book[][] = [];
  let row: Book[] = [];
  let used = 0;

  for (const book of books) {
    const width = spineSize(book.totalPages, book.spineAspect).width;
    const next = row.length === 0 ? width : used + SPINE_GAP + width;

    if (row.length > 0 && next > SHELF_WIDTH) {
      rows.push(row);
      row = [book];
      used = width;
    } else {
      row.push(book);
      used = next;
    }
  }

  if (row.length > 0) rows.push(row);
  return rows.length > 0 ? rows : [[]];
}

export default function ShelfPage() {
  const { books, records } = useShelf();
  const hydrated = useHydrated();
  const [adding, setAdding] = useState(false);

  const rows = packShelves(books);
  const empty = !hydrated || books.length === 0;

  return (
    <div>
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
    <div>
      <div className="flex min-h-[385px] items-end gap-[3px] overflow-x-auto px-1 pb-0">
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
      </div>
      {/* 선반 널 — 윗면·앞면·윤곽선으로 두께를 만든다 */}
      <div className="relative">
        {/* 책이 닿는 윗면 — 위 모서리에 윤곽선 */}
        <div className="h-[4px] border-t border-[var(--shelf-edge)] bg-[var(--shelf-top)]" />
        {/* 널의 앞면 */}
        <div className="h-[14px] bg-[var(--shelf-face)]" />
        {/* 아래 모서리와 바닥 그림자 */}
        <div className="h-px bg-[var(--shelf-edge)]" />
        <div className="h-4 bg-gradient-to-b from-ink/14 to-transparent" />
      </div>
    </div>
  );
}
