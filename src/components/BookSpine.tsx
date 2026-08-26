"use client";

import Link from "next/link";
import type { Book } from "@/lib/types";

/**
 * 책등의 두께와 높이를 정한다.
 *
 * 실제 책등은 세로:가로가 8~10:1 정도다. 템플릿도 그 비율을 따라야
 * 사진을 올린 책과 나란히 놓았을 때 두께가 크게 어긋나지 않는다.
 * (템플릿만 1:5로 두껍게 그리면 진짜 비율인 사진 책등이 유독 얇아 보인다.)
 */
export function spineSize(totalPages: number, aspect?: number | null) {
  const p = Math.max(80, Math.min(900, totalPages || 250));
  const height = Math.round(300 + (p / 900) * 70); // 300~370px
  const templateWidth = Math.round(30 + (p / 900) * 18); // 30~48px

  if (aspect && aspect > 0) {
    // 사진은 자기 비율대로 그려야 잘리지 않는다. 다만 같은 페이지 수의
    // 템플릿과 두께가 지나치게 벌어지지 않도록 위아래로 묶어둔다.
    const width = Math.round(
      Math.max(
        templateWidth * 0.6,
        Math.min(templateWidth * 1.8, height * aspect),
      ),
    );
    return { width, height };
  }

  return { width: templateWidth, height };
}

/** 배경색이 밝으면 어두운 글자를 쓴다 */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // sRGB 상대 휘도
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) > 0.45;
}

/**
 * 제목이 길수록 글자를 줄여 책등 안에 담는다 — 실제 책도 같은 방식이다.
 * 세로쓰기라 한 글자가 대략 1em씩 내려가므로,
 * 저자·출판사가 차지할 자리를 뺀 나머지를 제목에 나눠준다.
 */
function titleFontSize(
  title: string,
  author: string,
  publisher: string,
  width: number,
  height: number,
) {
  // 저자는 제목의 0.52배, 출판사는 0.42배 크기로 그려진다 (아래 렌더 참조)
  const reserved =
    author.length * 8 + (publisher ? publisher.length * 6 : 0) + 34;
  const available = Math.max(60, height - reserved);
  const byLength = available / Math.max(1, title.length);
  const byWidth = width * 0.55;
  return Math.max(8, Math.min(byWidth, byLength, 22));
}

/** 책등의 원통형 곡면을 흉내내는 음영 */
const CURVE =
  "linear-gradient(90deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,.10) 6%, rgba(255,255,255,.16) 22%, rgba(255,255,255,.03) 44%, rgba(0,0,0,.08) 72%, rgba(0,0,0,.34) 100%)";

export default function BookSpine({
  book,
  progress,
  scale = 1,
}: {
  book: Book;
  progress: number;
  /** 상세 페이지처럼 크게 보여줘야 할 때 키운다 */
  scale?: number;
}) {
  const base = spineSize(book.totalPages, book.spineAspect);
  const width = Math.round(base.width * scale);
  const height = Math.round(base.height * scale);

  return (
    <Link
      href={`/book/${book.id}`}
      title={`${book.title} — ${book.author}`}
      style={{ width, height }}
      className="group relative block shrink-0 overflow-hidden rounded-[2px] shadow-[3px_2px_8px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-2.5"
    >
      <SpineFace book={book} width={width} height={height} />

      {/* 곡면 음영 — 사진에는 이미 실제 명암이 있으니 연하게 덮는다 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: CURVE, opacity: book.spineImage ? 0.4 : 1 }}
      />

      {/* 진행률 — 아래 끝에 얇게 */}
      {progress > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-black/20"
        >
          <span
            className="block h-full bg-white/55"
            style={{ width: `${progress}%` }}
          />
        </span>
      )}
    </Link>
  );
}

/** 책등 앞면 — 업로드한 사진이 있으면 사진, 없으면 타이포 템플릿 */
export function SpineFace({
  book,
  width,
  height,
}: {
  book: Book;
  width: number;
  height: number;
}) {
  if (book.spineImage) {
    return (
      // 슬롯을 사진 비율에 맞춰뒀으므로 보통은 잘리는 부분이 없다.
      // 사용자가 올린 data URL이라 next/image 최적화 대상은 아니다.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.spineImage}
        alt={`${book.title} 책등`}
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  const light = isLight(book.spineColor);
  const fg = light ? "rgba(28,24,20,.92)" : "rgba(255,255,255,.95)";
  const dim = light ? "rgba(28,24,20,.62)" : "rgba(255,255,255,.7)";
  const rule = light ? "rgba(28,24,20,.25)" : "rgba(255,255,255,.35)";
  const size = titleFontSize(
    book.title,
    book.author,
    book.publisher,
    width,
    height,
  );

  return (
    <span
      className="absolute inset-0 flex flex-col items-center justify-between py-2.5"
      style={{ backgroundColor: book.spineColor }}
    >
      {/* 상단 장식선 */}
      <span className="h-px w-[60%]" style={{ backgroundColor: rule }} />

      {/* 제목 — 글자를 세워 쌓는다 */}
      <span
        className="spine-upright min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap py-2 font-semibold leading-none tracking-[0.02em]"
        style={{ fontSize: size, color: fg }}
      >
        {book.title}
      </span>

      <span className="flex flex-col items-center gap-2 pb-0.5">
        {/* 저자 */}
        <span
          className="spine-upright max-h-[70px] overflow-hidden text-ellipsis whitespace-nowrap leading-none"
          style={{ fontSize: Math.max(7, size * 0.52), color: dim }}
        >
          {book.author}
        </span>

        {/* 출판사 — 맨 아래에 작게 */}
        {book.publisher && (
          <span
            className="spine-upright max-h-[52px] overflow-hidden text-ellipsis whitespace-nowrap leading-none"
            style={{ fontSize: Math.max(6, size * 0.42), color: dim }}
          >
            {book.publisher}
          </span>
        )}
      </span>
    </span>
  );
}
