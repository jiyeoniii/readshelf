import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  bookProgress,
  currentStreak,
  longestStreak,
  monthlyStats,
  totalPages,
} from "@/lib/stats";
import type { Book, ReadingRecord } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ReportSchema = z.object({
  preferredGenres: z
    .string()
    .describe("가장 많이 읽은 장르와 그 경향을 설명하는 1~2문장"),
  keywords: z
    .array(z.string())
    .describe("후기와 인상 깊은 문장에서 반복되는 관심 주제 키워드 3~5개"),
  readingHabit: z
    .string()
    .describe("독서 빈도와 독서량을 실제 수치를 들어 설명하는 1~2문장"),
  ratingPattern: z
    .string()
    .describe("높은 별점을 준 책들의 공통점을 설명하는 1~2문장"),
  summary: z
    .string()
    .describe("이 사람은 어떤 독자인지 한 문장으로 요약한 AI 한줄 분석"),
});

const SYSTEM = `당신은 독서 기록을 분석해 개인의 독서 취향과 습관을 알려주는 큐레이터입니다.

규칙:
- 사용자가 실제로 입력한 데이터에만 근거해서 분석하세요. 데이터에 없는 책, 장르, 문장을 지어내지 마세요.
- 수치(권수, 페이지 수, 기록한 날짜 수, 별점)를 인용해 근거를 보여주세요.
- 데이터가 적으면 단정하지 말고 "아직 ~한 경향이 보여요" 처럼 조심스럽게 표현하세요.
- 한국어 존댓말로, 따뜻하고 담백하게 씁니다. 과장하거나 칭찬을 남발하지 마세요.
- 각 항목은 1~2문장으로 짧게 씁니다.`;

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

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경 변수에 추가해주세요.",
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

  const books = payload.books ?? [];
  const records = payload.records ?? [];

  if (books.length === 0 || records.length === 0) {
    return NextResponse.json(
      { error: "분석할 독서 기록이 아직 없어요. 책과 독서 기록을 먼저 남겨주세요." },
      { status: 400 },
    );
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: zodOutputFormat(ReportSchema),
      },
      messages: [
        {
          role: "user",
          content: `아래는 제 독서 기록입니다. 분석해주세요.\n\n${buildDigest({
            books,
            records,
          })}`,
        },
      ],
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "AI 응답을 해석하지 못했습니다. 다시 시도해주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ...response.parsed_output,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "요청이 몰렸어요. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "API 키가 올바르지 않습니다." },
        { status: 401 },
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        { error: "AI 서버에 연결하지 못했습니다. 네트워크를 확인해주세요." },
        { status: 503 },
      );
    }

    console.error("[report] 분석 실패", error);
    return NextResponse.json(
      { error: "리포트 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
