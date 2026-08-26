import type { Book, ReadingRecord } from "./types";

/** Date -> 'YYYY-MM-DD' (로컬 기준) */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** 날짜별 총 독서 페이지 수 */
export function pagesByDate(records: ReadingRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.date, (map.get(r.date) ?? 0) + r.pagesRead);
  }
  return map;
}

/** GitHub 잔디 단계 (0~4) */
export function level(pages: number): 0 | 1 | 2 | 3 {
  if (pages <= 0) return 0;
  if (pages <= 10) return 1;
  if (pages <= 30) return 2;
  return 3;
}

/** 오늘 기준 연속 독서일 */
export function currentStreak(records: ReadingRecord[], today = new Date()): number {
  const map = pagesByDate(records);
  let streak = 0;
  let cursor = new Date(today);

  // 오늘 아직 안 읽었다면 어제부터 세어 연속 기록을 유지시킨다
  if (!map.get(toDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while ((map.get(toDateKey(cursor)) ?? 0) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(records: ReadingRecord[]): number {
  const days = [...new Set(records.map((r) => r.date))].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of days) {
    const d = fromDateKey(key);
    if (prev && toDateKey(addDays(prev, 1)) === key) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** 이번 달 독서량 */
export function monthlyStats(records: ReadingRecord[], today = new Date()) {
  const prefix = toDateKey(today).slice(0, 7);
  const inMonth = records.filter((r) => r.date.startsWith(prefix));
  const pages = inMonth.reduce((sum, r) => sum + r.pagesRead, 0);
  const days = new Set(inMonth.map((r) => r.date)).size;
  return { pages, days, month: prefix };
}

export function totalPages(records: ReadingRecord[]): number {
  return records.reduce((sum, r) => sum + r.pagesRead, 0);
}

/** 책의 진행률 (%) — 기록된 가장 큰 endPage 기준 */
export function bookProgress(book: Book, records: ReadingRecord[]): number {
  if (!book.totalPages) return 0;
  const mine = records.filter((r) => r.bookId === book.id);
  if (mine.length === 0) return 0;
  const furthest = Math.max(...mine.map((r) => r.endPage));
  return Math.min(100, Math.round((furthest / book.totalPages) * 100));
}

export function lastReadDate(bookId: string, records: ReadingRecord[]): string | null {
  const mine = records.filter((r) => r.bookId === bookId).map((r) => r.date).sort();
  return mine.length ? mine[mine.length - 1] : null;
}

/**
 * 히트맵용 주 단위 그리드.
 * 오늘이 포함된 주의 토요일에서 끝나고, weeks 주 만큼 거슬러 올라간다.
 */
export function heatmapWeeks(records: ReadingRecord[], weeks = 26, today = new Date()) {
  const map = pagesByDate(records);
  const end = addDays(today, 6 - today.getDay()); // 이번 주 토요일
  const start = addDays(end, -(weeks * 7 - 1));

  const grid: { key: string; pages: number; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; pages: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const key = toDateKey(date);
      col.push({
        key,
        pages: map.get(key) ?? 0,
        future: date > today,
      });
    }
    grid.push(col);
  }
  return grid;
}
