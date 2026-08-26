"use client";

import { useRef, useState } from "react";
import BookSpine from "@/components/BookSpine";
import { fileToCoverPhoto, fileToSpinePhoto } from "@/lib/image";
import { updateBook } from "@/lib/storage";
import type { Book } from "@/lib/types";

/** 상세 페이지에서 책등은 목록보다 조금 크게 보여준다 */
const SPINE_SCALE = 1.15;

/**
 * 상세 페이지 좌측 — 앞표지와 책등을 나란히 보여주고,
 * 둘 다 사진으로 바꿀 수 있게 한다.
 */
export default function BookArtwork({
  book,
  progress,
}: {
  book: Book;
  progress: number;
}) {
  const coverInput = useRef<HTMLInputElement>(null);
  const spineInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"cover" | "spine" | null>(null);

  async function pick(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "cover" | "spine",
  ) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 이벤트가 오게 한다
    if (!file) return;

    setBusy(kind);
    setError(null);
    try {
      if (kind === "cover") {
        const photo = await fileToCoverPhoto(file);
        updateBook(book.id, {
          coverImage: photo.dataUrl,
          coverAspect: photo.aspect,
        });
      } else {
        const photo = await fileToSpinePhoto(file);
        updateBook(book.id, {
          spineImage: photo.dataUrl,
          spineAspect: photo.aspect,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진을 저장하지 못했어요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="shrink-0">
      <div className="flex items-start gap-4">
        {/* 앞표지 */}
        <div className="flex flex-col items-center gap-2">
          {book.coverImage ? (
            // 알라딘 CDN URL 또는 사용자가 올린 data URL이라 next/image 대상은 아니다
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverImage}
              alt={`${book.title} 표지`}
              className="w-[150px] rounded-lg shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
            />
          ) : (
            <div className="flex h-[214px] w-[150px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line p-4 text-center">
              <span className="text-2xl">📕</span>
              <span className="text-[11px] leading-relaxed text-muted">
                표지가 없어요
              </span>
            </div>
          )}

          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => coverInput.current?.click()}
              disabled={busy !== null}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-ink disabled:opacity-50"
            >
              {busy === "cover"
                ? "처리 중…"
                : book.coverImage
                  ? "표지 바꾸기"
                  : "표지 올리기"}
            </button>
            {book.coverImage && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  updateBook(book.id, { coverImage: null, coverAspect: null });
                }}
                className="text-[11px] text-muted underline hover:text-red-500"
              >
                표지 지우기
              </button>
            )}
          </div>
        </div>

        {/* 책등 */}
        <div className="flex flex-col items-center gap-2">
          <BookSpine book={book} progress={progress} scale={SPINE_SCALE} />

          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => spineInput.current?.click()}
              disabled={busy !== null}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-ink disabled:opacity-50"
            >
              {busy === "spine"
                ? "처리 중…"
                : book.spineImage
                  ? "책등 바꾸기"
                  : "책등 올리기"}
            </button>
            {book.spineImage && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  updateBook(book.id, { spineImage: null, spineAspect: null });
                }}
                className="text-[11px] text-muted underline hover:text-red-500"
              >
                템플릿으로
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={coverInput}
        type="file"
        accept="image/*"
        onChange={(e) => pick(e, "cover")}
        className="hidden"
      />
      <input
        ref={spineInput}
        type="file"
        accept="image/*"
        onChange={(e) => pick(e, "spine")}
        className="hidden"
      />

      {error && (
        <p className="mt-2 max-w-[300px] text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}
