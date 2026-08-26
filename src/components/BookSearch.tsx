"use client";

import { useRef, useState } from "react";
import type { BookSearchResult } from "@/app/api/books/search/route";

/**
 * 제목으로 알라딘을 검색해 표지·저자·출판사·페이지 수를 한 번에 채운다.
 * 검색이 안 되는 책(절판·독립출판물 등)은 직접 입력하면 되므로,
 * 실패해도 흐름이 막히지 않게 안내만 하고 넘어간다.
 */
export default function BookSearch({
  query,
  onQueryChange,
  onPick,
}: {
  query: string;
  onQueryChange: (next: string) => void;
  onPick: (result: BookSearchResult, totalPages: number | null) => void;
}) {
  const [results, setResults] = useState<BookSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 결과를 고른 뒤 같은 목록이 다시 뜨지 않게 요청을 세어 최신 것만 반영한다
  const requestId = useRef(0);

  async function search() {
    const q = query.trim();
    if (!q) return;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (id !== requestId.current) return; // 더 최신 검색이 있으면 버린다
      if (!res.ok) {
        setError(data.error ?? "검색에 실패했어요.");
        setResults(null);
        return;
      }
      setResults(data.results ?? []);
    } catch {
      if (id === requestId.current) setError("네트워크 오류가 발생했어요.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  /**
   * 총 페이지 수는 검색 API가 주지 않고 상세조회에서만 온다.
   * 그래서 고른 한 권에 대해서만 한 번 더 물어본다.
   * 실패해도 진행에 지장이 없으므로 페이지 수만 비워둔다.
   */
  async function pick(r: BookSearchResult) {
    setPicking(r.isbn ?? r.title);
    let totalPages: number | null = null;
    if (r.isbn) {
      try {
        const res = await fetch(
          `/api/books/lookup?isbn=${encodeURIComponent(r.isbn)}`,
        );
        if (res.ok) totalPages = (await res.json()).totalPages ?? null;
      } catch {
        // 페이지 수는 직접 입력하면 되므로 조용히 넘어간다
      }
    }
    onPick(r, totalPages);
    setResults(null);
    setPicking(null);
    requestId.current++; // 진행 중인 검색 결과가 덮어쓰지 않게
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-muted">제목</span>

      <div className="flex gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            // 폼 전체가 제출되지 않고 검색만 되게 한다
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
          placeholder="예) 불편한 편의점"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading || !query.trim()}
          className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:text-ink disabled:opacity-40"
        >
          {loading ? "검색 중…" : "표지 검색"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {results?.length === 0 && (
        <p className="mt-2 text-xs text-muted">
          검색 결과가 없어요. 아래에 직접 입력하고 표지는 사진으로 올려주세요.
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-lg border border-line bg-bg p-1">
          {results.map((r, i) => (
            <li key={`${r.isbn ?? r.title}-${i}`}>
              <button
                type="button"
                disabled={picking !== null}
                onClick={() => void pick(r)}
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-accent-soft disabled:opacity-50"
              >
                {r.coverUrl ? (
                  // 알라딘 CDN 이미지라 next/image 최적화 대상은 아니다
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.coverUrl}
                    alt=""
                    className="h-14 w-10 shrink-0 rounded-sm object-cover shadow-sm"
                  />
                ) : (
                  <span className="h-14 w-10 shrink-0 rounded-sm bg-line" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {r.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {[r.author, r.publisher].filter(Boolean).join(" · ")}
                    {picking === (r.isbn ?? r.title) && " · 불러오는 중…"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
