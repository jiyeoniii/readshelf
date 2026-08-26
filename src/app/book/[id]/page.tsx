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
  useHydrated,
  useShelf,
} from "@/lib/storage";
import { bookProgress, lastReadDate, toDateKey } from "@/lib/stats";
import { GENRES, type Genre } from "@/lib/types";

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
    <div className="space-y-8">
      <Link href="/" className="inline-block text-sm text-muted hover:text-ink">
        ← 책장
      </Link>

      {/* 기본 정보 */}
      <section className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row">
        <BookArtwork book={book} progress={progress} />

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <input
              value={book.title}
              onChange={(e) => updateBook(book.id, { title: e.target.value })}
              className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
              <input
                value={book.author}
                onChange={(e) => updateBook(book.id, { author: e.target.value })}
                placeholder="저자"
                className="bg-transparent outline-none"
                size={10}
              />
              <span>·</span>
              <input
                value={book.publisher}
                onChange={(e) => updateBook(book.id, { publisher: e.target.value })}
                placeholder="출판사"
                className="bg-transparent outline-none"
                size={8}
              />
              <span>·</span>
              <select
                value={book.genre}
                onChange={(e) =>
                  updateBook(book.id, { genre: e.target.value as Genre })
                }
                className="rounded-md border border-line bg-bg px-2 py-0.5 text-xs outline-none"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <span>·</span>
              <label className="flex items-center gap-1 text-xs">
                총
                <input
                  value={book.totalPages || ""}
                  onChange={(e) =>
                    updateBook(book.id, {
                      totalPages: Number(e.target.value.replace(/\D/g, "")) || 0,
                    })
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className="w-12 rounded-md border border-line bg-bg px-1.5 py-0.5 text-center outline-none"
                />
                쪽
              </label>
            </div>
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
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />

          {/* 진행률 */}
          <div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>독서 진행률</span>
              <span>
                {progress}%
                {book.totalPages > 0 &&
                  furthest > 0 &&
                  ` · ${furthest}/${book.totalPages}쪽`}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-all"
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
        <h2 className="text-sm font-semibold text-muted">
          나의 기록 {myRecords.length > 0 && `(${myRecords.length})`}
        </h2>
        {myRecords.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            아직 기록이 없어요. 오늘 읽은 페이지를 남겨보세요.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {myRecords.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs text-muted">
                    {r.date} · {r.startPage}–{r.endPage}쪽 ({r.pagesRead}쪽)
                  </div>
                  <button
                    onClick={() => removeRecord(r.id)}
                    className="text-xs text-muted hover:text-red-500"
                  >
                    삭제
                  </button>
                </div>
                {r.quote && (
                  <blockquote className="mt-3 border-l-2 border-accent pl-3 text-sm italic leading-relaxed">
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
            ))}
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
        className="text-xs text-muted underline hover:text-red-500"
      >
        책 삭제
      </button>
    </div>
  );
}

function RecordForm({
  bookId,
  totalPages,
  lastEnd,
}: {
  bookId: string;
  totalPages: number;
  lastEnd: number;
}) {
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [startPage, setStartPage] = useState(String(lastEnd ? lastEnd + 1 : ""));
  const [endPage, setEndPage] = useState("");
  const [quote, setQuote] = useState("");
  const [quotePage, setQuotePage] = useState("");
  const [memo, setMemo] = useState("");

  const start = Number(startPage) || 0;
  const end = Number(endPage) || 0;
  const pagesRead = end >= start && start > 0 ? end - start + 1 : 0;
  const valid = pagesRead > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    addRecord({
      id: newId(),
      bookId,
      date,
      startPage: start,
      endPage: end,
      pagesRead,
      quote: quote.trim(),
      quotePage: quotePage ? Number(quotePage) : null,
      memo: memo.trim(),
    });
    setStartPage(String(end + 1));
    setEndPage("");
    setQuote("");
    setQuotePage("");
    setMemo("");
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold">오늘의 독서 기록</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-2 block">
          <span className="mb-1.5 block text-xs text-muted">날짜</span>
          <input
            type="date"
            value={date}
            max={toDateKey(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">시작 페이지</span>
          <input
            value={startPage}
            onChange={(e) => setStartPage(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="1"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">끝 페이지</span>
          <input
            value={endPage}
            onChange={(e) => setEndPage(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder={totalPages ? String(totalPages) : "30"}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
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
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-muted">문장 페이지</span>
          <input
            value={quotePage}
            onChange={(e) => setQuotePage(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="p."
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
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
          className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted">
          {valid ? `${pagesRead}쪽 읽음` : "페이지 범위를 입력하세요"}
        </span>
        <button
          type="submit"
          disabled={!valid}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          기록 남기기
        </button>
      </div>
    </form>
  );
}
