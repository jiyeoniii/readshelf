import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { aladinFetch } from "@/lib/aladin";
import {
  bookProgress,
  currentStreak,
  longestStreak,
  monthlyStats,
  totalPages,
} from "@/lib/stats";
import type { Book, ReadingRecord, Recommendation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 모델에 강제할 응답 형태 */
const REPORT_SCHEMA = {
  type: "object",
  properties: {
    preferredGenres: {
      type: "string",
      description: "가장 많이 읽은 장르와 그 경향을 설명하는 1~2문장",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "후기와 인상 깊은 문장에서 반복되는 관심 주제 키워드 3~5개",
    },
    readingHabit: {
      type: "string",
      description: "독서 빈도와 독서량을 실제 수치를 들어 설명하는 1~2문장",
    },
    ratingPattern: {
      type: "string",
      description: "높은 별점을 준 책들의 공통점을 설명하는 1~2문장",
    },
    summary: {
      type: "string",
      description: "이 사람은 어떤 독자인지 한 문장으로 요약한 AI 한줄 분석",
    },
    recommendations: {
      type: "array",
      description: "이 사람이 다음에 읽으면 좋을 책 3권",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "정확한 책 제목" },
          author: { type: "string", description: "저자명" },
          reason: {
            type: "string",
            description:
              "이 사람의 기록과 연결해 추천 이유를 설명하는 1~2문장",
          },
        },
        required: ["title", "author", "reason"],
      },
    },
  },
  required: [
    "preferredGenres",
    "keywords",
    "readingHabit",
    "ratingPattern",
    "summary",
    "recommendations",
  ],
} as const;

/** 모델이 스키마를 어겨도 화면이 깨지지 않게 한 번 더 검증한다 */
const ReportSchema = z.object({
  preferredGenres: z.string(),
  keywords: z.array(z.string()),
  readingHabit: z.string(),
  ratingPattern: z.string(),
  summary: z.string(),
  recommendations: z
    .array(
      z.object({
        title: z.string(),
        author: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
});

const SYSTEM = `당신은 독서 기록을 분석해 개인의 독서 취향과 습관을 알려주는 큐레이터입니다.

규칙:
- 사용자가 실제로 입력한 데이터에만 근거해서 분석하세요. 데이터에 없는 책, 장르, 문장을 지어내지 마세요.
- 수치(권수, 페이지 수, 기록한 날짜 수, 별점)를 인용해 근거를 보여주세요.
- 데이터가 적으면 단정하지 말고 "아직 ~한 경향이 보여요" 처럼 조심스럽게 표현하세요.
- 한국어 존댓말로, 따뜻하고 담백하게 씁니다. 과장하거나 칭찬을 남발하지 마세요.
- 각 항목은 1~2문장으로 짧게 씁니다.

추천(recommendations) 규칙:
- 실제로 존재하는 책만 추천하세요. 제목과 저자를 정확하게 쓰세요.
- 한국에서 쉽게 구할 수 있는 책을 고르세요. 번역서라면 한국어판 제목을 쓰세요.
- 이미 읽은 책(아래 목록에 있는 책)은 추천하지 마세요.
- 추천 이유는 이 사람이 남긴 후기·문장·장르와 연결해서 씁니다.`;

/** 공개 엔드포인트라 한 번에 처리할 양을 제한한다 */
const MAX_BOOKS = 200;
const MAX_RECORDS = 2000;

interface Payload {
  books: Book[];
  records: ReadingRecord[];
}

/** 모델에 넘길 독서 데이터 요약을 만든다 */
function buildDigest({ books, records }: Payload): string {
  const month = monthlyStats(records);
  const genreCount = new Map<string, number>();
  for (const b of books) {
    genreCount.set(b.genre, (genreCount.get(b.genre) ?? 0) + 1);
  }

  const genreLine = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g, n]) => `${g} ${n}권`)
    .join(", ");

  const bookLines = books.map((b) => {
    const mine = records.filter((r) => r.bookId === b.id);
    const pages = mine.reduce((s, r) => s + r.pagesRead, 0);
    const quotes = mine
      .filter((r) => r.quote)
      .map((r) => `    · 인상 깊은 문장: "${r.quote}"`);
    const memos = mine
      .filter((r) => r.memo)
      .map((r) => `    · 메모: ${r.memo}`);

    return [
      `- 《${b.title}》 / ${b.author} / 장르 ${b.genre} / 별점 ${
        b.rating > 0 ? `${b.rating}점` : "미평가"
      } / 진행률 ${bookProgress(b, records)}% / 읽은 분량 ${pages}쪽`,
      b.review ? `    · 한줄 후기: ${b.review}` : null,
      ...quotes,
      ...memos,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const readDays = new Set(records.map((r) => r.date));
  const dailyLines = [...readDays]
    .sort()
    .slice(-30)
    .map((d) => {
      const pages = records
        .filter((r) => r.date === d)
        .reduce((s, r) => s + r.pagesRead, 0);
      return `${d}: ${pages}쪽`;
    });

  return `[전체 통계]
- 책장에 꽂힌 책: ${books.length}권
- 장르 분포: ${genreLine || "없음"}
- 총 독서량: ${totalPages(records)}쪽 (기록한 날 ${readDays.size}일)
- 이번 달(${month.month}): ${month.days}일 동안 ${month.pages}쪽
- 현재 연속 독서일: ${currentStreak(records)}일 / 최장 ${longestStreak(records)}일

[책별 기록]
${bookLines.join("\n") || "없음"}

[최근 날짜별 독서량 (최대 30일)]
${dailyLines.join("\n") || "없음"}`;
}

/**
 * 앞에서부터 순서대로 시도하고, 과부하(503)면 다음 모델로 넘어간다.
 *
 * 순서는 실제로 재보고 정했다. 최신인 gemini-3.7-flash는 평균 50초에
 * 세 번 중 한 번은 503이 떠서, 짧은 리포트 한 장 뽑는 데 쓰기엔 느리고 불안정하다.
 * 이 작업은 기록을 다섯 문장으로 요약하는 정도라 3.5-flash로 충분하다.
 */
const MODELS = [
  "gemini-3.5-flash", // 평균 2초, 3/3 성공
  "gemini-3-flash-preview", // 평균 9초, 3/3 성공
  "gemini-3.6-flash", // 평균 13초, 3/3 성공
];

async function generate(
  ai: GoogleGenAI,
  prompt: string,
): Promise<string | undefined> {
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
          responseSchema: REPORT_SCHEMA,
        },
      });
      return res.text;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      // 과부하일 때만 다음 모델로 넘긴다. 키 오류 같은 건 바로 던진다
      if (!message.includes("503") && !message.includes("UNAVAILABLE")) {
        throw error;
      }
    }
  }

  throw lastError;
}

/** 제목 비교용 — 띄어쓰기·괄호·기호를 걷어낸다 */
function normalize(title: string): string {
  return title
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/[\s·:,-]/g, "")
    .toLowerCase();
}

/**
 * AI가 추천한 책이 실제로 존재하는지 알라딘에서 확인한다.
 *
 * 생성 모델은 그럴듯한 가짜 제목을 지어낼 수 있어서, 검색으로 실물을 찾은
 * 것만 남긴다. 덤으로 진짜 표지와 정확한 저자명도 얻는다.
 * 알라딘 키가 없거나 검색이 실패하면 확인을 건너뛰고 그대로 보여준다.
 */
async function verifyRecommendations(
  raw: { title: string; author: string; reason: string }[],
  shelf: Book[],
): Promise<Recommendation[]> {
  const owned = new Set(shelf.map((b) => normalize(b.title)));

  const checked = await Promise.all(
    raw.slice(0, 3).map(async (rec): Promise<Recommendation | null> => {
      // 모델이 규칙을 어기고 이미 읽은 책을 추천하면 걸러낸다
      if (owned.has(normalize(rec.title))) return null;

      const found = await aladinFetch("ItemSearch.aspx", {
        Query: rec.title,
        QueryType: "Title",
        SearchTarget: "Book",
        MaxResults: "5",
        start: "1",
        Cover: "Big",
      });

      if ("error" in found) {
        // 알라딘을 못 쓰는 상황이면 검증 없이 통과시킨다
        return { ...rec, coverUrl: null, isbn: null };
      }

      // 제목만 맞추면 동명이서를 잘못 집는다.
      // (예: 「끌림」은 이병률의 여행 에세이와 세라 워터스의 소설이 둘 다 있다)
      // 그래서 저자까지 맞는 것만 인정하고, 없으면 지어낸 것으로 보고 버린다.
      const wanted = normalize(rec.author);
      const match = found.items.find((item) => {
        const title = normalize(item.title ?? "");
        const titleHit =
          title === normalize(rec.title) ||
          title.startsWith(normalize(rec.title));
        if (!titleHit) return false;

        const actual = normalize(item.author ?? "");
        return actual.includes(wanted) || wanted.includes(actual.slice(0, 4));
      });

      if (!match) return null; // 실물을 못 찾으면 지어낸 책으로 보고 버린다
      if (owned.has(normalize(match.title ?? ""))) return null;

      return {
        title: (match.title ?? rec.title).trim(),
        author: (match.author ?? rec.author).split(",")[0].replace(/\s*\([^)]*\)\s*/g, "").trim(),
        reason: rec.reason,
        coverUrl: match.cover ? match.cover.replace(/^http:\/\//i, "https://") : null,
        isbn: match.isbn13 ?? match.isbn ?? null,
      };
    }),
  );

  return checked.filter((r): r is Recommendation => r !== null);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경 변수에 추가해주세요.",
      },
      { status: 500 },
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const books = (payload.books ?? []).slice(0, MAX_BOOKS);
  const records = (payload.records ?? []).slice(0, MAX_RECORDS);

  if (books.length === 0 || records.length === 0) {
    return NextResponse.json(
      { error: "분석할 독서 기록이 아직 없어요. 책과 독서 기록을 먼저 남겨주세요." },
      { status: 400 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `아래는 제 독서 기록입니다. 분석해주세요.\n\n${buildDigest({
    books,
    records,
  })}`;

  try {
    const text = await generate(ai, prompt);
    if (!text) {
      return NextResponse.json(
        { error: "AI가 응답을 반환하지 않았습니다. 다시 시도해주세요." },
        { status: 502 },
      );
    }

    const parsed = ReportSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      console.error("[report] 스키마 불일치", parsed.error);
      return NextResponse.json(
        { error: "AI 응답을 해석하지 못했습니다. 다시 시도해주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ...parsed.data,
      recommendations: await verifyRecommendations(
        parsed.data.recommendations,
        books,
      ),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // 무료 티어 한도를 넘으면 429가 온다 — 과금이 아니라 실패다
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "요청이 몰렸어요. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }
    if (message.includes("503") || message.includes("UNAVAILABLE")) {
      return NextResponse.json(
        { error: "AI 서버가 혼잡해요. 잠시 후 다시 시도해주세요." },
        { status: 503 },
      );
    }
    if (message.includes("401") || message.includes("API key")) {
      return NextResponse.json(
        { error: "API 키가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    console.error("[report] 분석 실패", error);
    return NextResponse.json(
      { error: "리포트 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
