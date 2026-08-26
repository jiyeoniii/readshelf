"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import RatingStars from "@/components/RatingStars";
import BookArtwork from "@/components/BookArtwork";
import {
  addRecord,
  newId,
  removeBook,
  removeRecord,
  updateBook,
  updateRecord,
  useHydrated,
  useShelf,
} from "@/lib/storage";
import { bookProgress, lastReadDate, toDateKey } from "@/lib/stats";
import type { ReadingRecord } from "@/lib/types";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { books, records } = useShelf();
  const hydrated = useHydrated();

  const book = books.find((b) => b.id === id);
  const myRecords = useMemo(
    () =>
      records
        .filter((r) => r.bookId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records, id],
  );

  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [review, setReview] = useState("");
  const bookReview = book?.review;
  useEffect(() => {
    setReview(bookReview ?? "");
  }, [bookReview]);

  if (!hydrated) {
    return <p className="text-sm text-muted">불러오는 중…</p>;
  }

  if (!book) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center">
        <p className="font-medium">책을 찾을 수 없어요</p>
        <Link href="/" className="mt-3 inline-block text-sm text-accent underline">
          책장으로 돌아가기
        </Link>
      </div>
    );
  }

  const progress = bookProgress(book, records);
  const last = lastReadDate(book.id, records);
  const readPages = myRecords.reduce((s, r) => s + r.pagesRead, 0);
  const furthest = myRecords.length
    ? Math.max(...myRecords.map((r) => r.endPage))
    : 0;

  return (
    <div className="space-y-14">
      <Link
        href="/"
        className="inline-block text-[11px] uppercase tracking-[0.14em] text-muted transition hover:text-accent"
      >
        ← Back to shelf
      </Link>

      {/* 기본 정보 */}
      <section className="flex flex-col gap-10 sm:flex-row">
        <BookArtwork book={book} />

        <div className="min-w-0 flex-1 space-y-4">
          {/* 책 정보는 '수정하기' 다이얼로그에서 고친다 */}
          <div>
            <h1 className="font-[family-name:var(--font-serif)] text-[34px] leading-tight tracking-tight">
              {book.title}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span>{book.author}</span>
              {book.publisher && (
                <>
                  <span aria-hidden>·</span>
                  <span>{book.publisher}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span className="text-xs tracking-wider text-accent">
                {book.genre}
              </span>
              {book.totalPages > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-xs">총 {book.totalPages}쪽</span>
                </>
              )}
            </p>
          </div>

          <RatingStars
            value={book.rating}
            onChange={(rating) => updateBook(book.id, { rating })}
          />

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            onBlur={() => updateBook(book.id, { review: review.trim() })}
            rows={2}
            placeholder="한줄 후기를 남겨보세요. AI 분석의 재료가 됩니다."
            className="w-full resize-none border-b border-line bg-transparent pb-2 text-sm leading-relaxed outline-none transition focus:border-accent"
          />

          {/* 진행률 */}
          <div>
            <div className="flex items-center justify-between">
              <span className="label">Progress</span>
              <span className="text-xs text-muted">
                <span className="font-[family-name:var(--font-serif)] text-lg text-ink">
                  {progress}%
                </span>
                {book.totalPages > 0 &&
                  furthest > 0 &&
                  ` · ${furthest}/${book.totalPages}쪽`}
              </span>
            </div>
            <div className="mt-3 h-px w-full bg-line">
              <div
                className="h-px bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              읽은 분량 {readPages.toLocaleString()}쪽
              {last && ` · 마지막으로 읽은 날 ${last}`}
            </p>
          </div>
        </div>
      </section>

      {/* 독서 기록 입력 */}
      <RecordForm
        bookId={book.id}
        totalPages={book.totalPages}
        lastEnd={furthest}
      />

      {/* 기록 목록 */}
      <section>
        <p className="label border-b border-line-soft pb-3">
          My records {myRecords.length > 0 && `(${myRecords.length})`}
        </p>
        {myRecords.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            아직 기록이 없어요. 오늘 읽은 페이지를 남겨보세요.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {myRecords.map((r) =>
              editingRecord === r.id ? (
                <li key={r.id}>
                  <RecordForm
                    bookId={book.id}
                    totalPages={book.totalPages}
                    lastEnd={furthest}
                    record={r}
                    onDone={() => setEditingRecord(null)}
                  />
                </li>
              ) : (
              <li key={r.id} className="border-b border-line-soft py-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs text-muted">
                    {r.date} · {r.startPage}–{r.endPage}쪽 ({r.pagesRead}쪽)
                  </div>
                  <div className="flex shrink-0 gap-2 text-xs">
                    <button
                      onClick={() => setEditingRecord(r.id)}
                      className="text-muted hover:text-accent"
                    >
                      수정
                    </button>
                    <span aria-hidden className="text-line">
                      |
                    </span>
                    <button
                      onClick={() => removeRecord(r.id)}
                      className="text-muted hover:text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {r.quote && (
                  <blockquote className="mt-4 border-l border-accent pl-4 font-[family-name:var(--font-serif)] text-lg leading-relaxed">
                    &ldquo;{r.quote}&rdquo;
                    {r.quotePage != null && (
                      <span className="ml-1 not-italic text-xs text-muted">
                        p.{r.quotePage}
                      </span>
                    )}
                  </blockquote>
                )}
                {r.memo && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                    {r.memo}
                  </p>
                )}
              </li>
              ),
            )}
          </ul>
        )}
      </section>

      <button
        onClick={() => {
          if (confirm("이 책과 관련된 모든 기록이 삭제됩니다. 계속할까요?")) {
            removeBook(book.id);
            router.push("/");
          }
        }}
        className="text-[11px] uppercase tracking-[0.14em] text-muted underline underline-offset-4 hover:text-accent"
      >
        Delete book
      </button>
    </div>
  );
}

/**
 * 독서 기록 입력 폼 — 새로 남길 때와 기존 기록을 고칠 때 같이 쓴다.
 * record를 넘기면 그 기록을 고치는 모드로 열린다.
 */
function RecordForm({
  bookId,
  totalPages,
  lastEnd,
  record,
  onDone,
}: {
  bookId: string;
  totalPages: number;
  lastEnd: number;
  record?: ReadingRecord;
  onDone?: () => void;
}) {
  const editing = record !== undefined;

  const [date, setDate] = useState(record?.date ?? toDateKey(new Date()));
  const [startPage, setStartPage] = useState(
    record ? String(record.startPage) : String(lastEnd ? lastEnd + 1 : ""),
  );
  const [endPage, setEndPage] = useState(record ? String(record.endPage) : "");
  const [quote, setQuote] = useState(record?.quote ?? "");
  const [quotePage, setQuotePage] = useState(
    record?.quotePage != null ? String(record.quotePage) : "",
  );
  const [memo, setMemo] = useState(record?.memo ?? "");

  const start = Number(startPage) || 0;
  const end = Number(endPage) || 0;
  const pagesRead = end >= start && start > 0 ? end - start + 1 : 0;
  const valid = pagesRead > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;

    const fields = {
      date,
      startPage: start,
      endPage: end,
      pagesRead,
      quote: quote.trim(),
      quotePage: quotePage ? Number(quotePage) : null,
      memo: memo.trim(),
    };

    if (record) {
      updateRecord(record.id, fields);
      onDone?.();
      return;
    }

    addRecord({ id: newId(), bookId, ...fields });
    // 이어서 기록하기 좋게 다음 시작 페이지만 남기고 비운다
    setStartPage(String(end + 1));
    setEndPage("");
    setQuote("");
    setQuotePage("");
    setMemo("");
  }

  return (
    <form
      onSubmit={submit}
      className={`border-t pt-8 ${editing ? "border-accent" : "border-line-soft"}`}
    >
      <p className="label">{editing ? "Edit record" : "New record"}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2 block">
          <span className="mb-1.5 block text-xs text-muted">날짜</span>
          <input
            type="date"
            value={date}
            max={toDateKey(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border-b border-line bg-transparent pb-2 text-sm outline-none transition focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">시작 페이지</span>
          <input
            value={startPage}
            onChange={(e) => setStartPage(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="1"
            className="w-full border-b border-line bg-transparent pb-2 text-sm outline-none transition focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">끝 페이지</span>
          <input
            value={endPage}
            onChange={(e) => setEndPage(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder={totalPages ? String(totalPages) : "30"}
            className="w-full border-b border-line bg-transparent pb-2 text-sm outline-none transition focus:border-accent"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px]">
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">인상 깊은 문장</span>
          <input
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="마음에 남은 문장을 옮겨 적어보세요"
            className="w-full border-b border-line bg-transparent pb-2 text-sm outline-none transition focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">문장 페이지</span>
          <input
            value={quotePage}
            onChange={(e) => setQuotePage(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="p."
            className="w-full border-b border-line bg-transparent pb-2 text-sm outline-none transition focus:border-accent"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs text-muted">메모</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="읽으면서 든 생각을 자유롭게 남겨보세요"
          className="w-full resize-none border-b border-line bg-transparent pb-2 text-sm leading-relaxed outline-none transition focus:border-accent"
        />
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {valid ? `${pagesRead}쪽 읽음` : "페이지 범위를 입력하세요"}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {editing && (
            <button
              type="button"
              onClick={onDone}
              className="px-2 text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!valid}
            className="rounded-full bg-ink px-6 py-2.5 text-[11px] uppercase tracking-[0.14em] text-bg transition hover:bg-accent disabled:opacity-30"
          >
            {editing ? "Save" : "Add record"}
          </button>
        </div>
      </div>
    </form>
  );
}
