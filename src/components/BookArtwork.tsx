"use client";

import { useState } from "react";
import AddBookDialog from "@/components/AddBookDialog";
import type { Book } from "@/lib/types";

/**
 * 상세 페이지 좌측 — 앞표지와 수정 버튼.
 *
 * 표지·책등 사진과 책 정보는 모두 수정 다이얼로그 한 곳에서 고친다.
 * 여기저기 버튼을 두면 어디서 뭘 고치는지 흩어지기 때문이다.
 */
export default function BookArtwork({ book }: { book: Book }) {
  const [editing, setEditing] = useState(false);

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

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-ink"
      >
        수정하기
      </button>

      {editing && (
        <AddBookDialog book={book} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
