import { NextResponse } from "next/server";
import { aladinFetch } from "@/lib/aladin";

export const runtime = "nodejs";

/** 검색 결과 한 건 — 화면에서 필요한 것만 추린다 */
export interface BookSearchResult {
  title: string;
  author: string;
  publisher: string;
  coverUrl: string | null;
  isbn: string | null;
}

/**
 * 알라딘은 "저자 (지은이), 옮긴이 (옮긴이)" 처럼 역할까지 붙여서 준다.
 * 책등과 목록에는 첫 번째 지은이만 있으면 충분하다.
 */
function cleanAuthor(raw: string): string {
  const first = raw.split(",")[0] ?? raw;
  return first.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

/** 표지 URL이 http면 https 페이지에서 차단되므로 올려준다 */
function toHttps(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  // 총 페이지 수는 여기서 오지 않는다 — 상세조회(/api/books/lookup)에서만 온다
  const result = await aladinFetch("ItemSearch.aspx", {
    Query: query,
    QueryType: "Title",
    SearchTarget: "Book",
    MaxResults: "10",
    start: "1",
    Cover: "Big",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const results: BookSearchResult[] = result.items.map((item) => ({
    title: (item.title ?? "").trim(),
    author: cleanAuthor(item.author ?? ""),
    publisher: (item.publisher ?? "").trim(),
    coverUrl: item.cover ? toHttps(item.cover) : null,
    isbn: item.isbn13 ?? item.isbn ?? null,
  }));

  return NextResponse.json({ results });
}
