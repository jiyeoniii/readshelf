"use client";

import { useRef, useState } from "react";
import { fileToCoverPhoto, fileToSpinePhoto } from "@/lib/image";
import { updateBook } from "@/lib/storage";
import type { Book } from "@/lib/types";

/**
 * 상세 페이지 좌측 — 앞표지를 보여주고 사진을 바꿀 수 있게 한다.
 *
 * 책등은 책장에서만 보여주므로 여기서는 그리지 않는다.
 * 다만 책등 사진을 나중에 바꿀 통로가 없어지면 안 되므로,
 * 표지 아래에 작은 링크로만 남겨둔다.
 */
export default function BookArtwork({ book }: { book: Book }) {
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
    <div className="flex w-[180px] shrink-0 flex-col items-center gap-3">
      {book.coverImage ? (
        // 알라딘 CDN URL 또는 사용자가 올린 data URL이라 next/image 대상은 아니다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.coverImage}
          alt={`${book.title} 표지`}
          className="w-full rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.24)]"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line p-4 text-center">
          <span className="text-2xl">📕</span>
          <span className="text-[11px] leading-relaxed text-muted">
            표지가 없어요
          </span>
        </div>
      )}

      <div className="flex flex-col items-center gap-1">
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

      {/* 책등 사진 — 책장에서 쓰인다. 여기서는 통로만 남긴다 */}
      <div className="flex flex-col items-center gap-1 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => spineInput.current?.click()}
          disabled={busy !== null}
          className="text-[11px] text-muted underline hover:text-ink disabled:opacity-50"
        >
          {busy === "spine"
            ? "처리 중…"
            : book.spineImage
              ? "책등 사진 바꾸기"
              : "책등 사진 올리기"}
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
            책등 템플릿으로
          </button>
        )}
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

      {error && <p className="text-center text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
