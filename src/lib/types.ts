export const GENRES = [
  "에세이",
  "소설",
  "자기계발",
  "인문",
  "과학",
  "경제/경영",
  "역사",
  "예술",
  "시",
  "기타",
] as const;

export type Genre = (typeof GENRES)[number];

/** 책등에 쓰이는 대표 색상 팔레트 */
export const SPINE_COLORS = [
  "#7C3AED",
  "#2563EB",
  "#0D9488",
  "#16A34A",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#DB2777",
  "#475569",
  "#78350F",
] as const;

export interface Book {
  id: string;
  title: string;
  author: string;
  /** 출판사 — 책등 하단에 표시 */
  publisher: string;
  /** 대표 색상 (hex). 책등 템플릿의 배경색이 된다 */
  spineColor: string;
  /** 직접 찍은 책등 사진 (data URL). 있으면 템플릿 대신 이 사진을 쓴다 */
  spineImage: string | null;
  /** 책등 사진의 가로/세로 비율. 사진이 잘리지 않게 책등 폭을 이 비율로 맞춘다 */
  spineAspect: number | null;
  /** 앞표지 — 알라딘 검색으로 받은 URL 또는 직접 올린 data URL */
  coverImage: string | null;
  /** 직접 올린 표지의 가로/세로 비율. 검색으로 받은 URL은 치수를 몰라 null이다 */
  coverAspect: number | null;
  genre: Genre;
  totalPages: number;
  /** 0~5, 0이면 아직 평가하지 않음 */
  rating: number;
  review: string;
  createdAt: string;
}

export interface ReadingRecord {
  id: string;
  bookId: string;
  /** YYYY-MM-DD */
  date: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  memo: string;
  quote: string;
  /** 인상 깊은 문장의 페이지 번호 */
  quotePage: number | null;
}

/** AI가 추천한 다음 책 — 알라딘에서 실재 여부를 확인한 것만 남는다 */
export interface Recommendation {
  title: string;
  author: string;
  /** 이 책을 왜 추천하는지 */
  reason: string;
  coverUrl: string | null;
  isbn: string | null;
}

export interface AIReport {
  preferredGenres: string;
  keywords: string[];
  readingHabit: string;
  ratingPattern: string;
  summary: string;
  /** 이전 버전 리포트에는 없을 수 있다 */
  recommendations?: Recommendation[];
  generatedAt: string;
}

export interface ShelfData {
  books: Book[];
  records: ReadingRecord[];
  report: AIReport | null;
}
