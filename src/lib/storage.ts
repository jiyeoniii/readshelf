"use client";

import { useSyncExternalStore } from "react";
import { SPINE_COLORS } from "./types";
import type { AIReport, Book, ReadingRecord, ShelfData } from "./types";

const KEY = "readshelf:v1";

const EMPTY: ShelfData = { books: [], records: [], report: null };

let cache: ShelfData = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): ShelfData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ShelfData>;
    return {
      // 이전 버전에 저장된 책에는 publisher/spineImage가 없다
      // 이전 버전에는 publisher/사진 필드가 없었고, 색상 필드는 cover였다
      books: (parsed.books ?? []).map((b) => {
        const legacy = b as Partial<Book> & { cover?: string };
        return {
          ...legacy,
          publisher: legacy.publisher ?? "",
          spineColor: legacy.spineColor ?? legacy.cover ?? SPINE_COLORS[0],
          spineImage: legacy.spineImage ?? null,
          spineAspect: legacy.spineAspect ?? null,
          coverImage: legacy.coverImage ?? null,
          coverAspect: legacy.coverAspect ?? null,
        } as Book;
      }),
      records: parsed.records ?? [],
      report: parsed.report ?? null,
    };
  } catch {
    return EMPTY;
  }
}

class QuotaError extends Error {
  constructor() {
    super(
      "저장 공간이 가득 찼어요. 책등 사진을 몇 장 지우고 다시 시도해주세요.",
    );
    this.name = "QuotaError";
  }
}

function write(next: ShelfData) {
  const prev = cache;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    // 용량 초과는 사진 업로드에서 실제로 일어난다 — 조용히 잃어버리지 않는다
    cache = prev;
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new QuotaError();
    }
    throw e;
  }
  cache = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // 다른 탭에서의 변경도 반영
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): ShelfData {
  if (!loaded) {
    cache = read();
    loaded = true;
  }
  return cache;
}

function getServerSnapshot(): ShelfData {
  return EMPTY;
}

/** 하이드레이션 안전한 localStorage 구독 */
export function useShelf(): ShelfData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 첫 렌더(서버/하이드레이션) 이후인지 여부 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function mutate(fn: (data: ShelfData) => ShelfData) {
  write(fn(getSnapshot()));
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function addBook(book: Book) {
  mutate((d) => ({ ...d, books: [book, ...d.books] }));
}

export function updateBook(id: string, patch: Partial<Book>) {
  mutate((d) => ({
    ...d,
    books: d.books.map((b) => (b.id === id ? { ...b, ...patch } : b)),
  }));
}

export function removeBook(id: string) {
  mutate((d) => ({
    ...d,
    books: d.books.filter((b) => b.id !== id),
    records: d.records.filter((r) => r.bookId !== id),
  }));
}

export function addRecord(record: ReadingRecord) {
  mutate((d) => ({ ...d, records: [record, ...d.records] }));
}

export function removeRecord(id: string) {
  mutate((d) => ({ ...d, records: d.records.filter((r) => r.id !== id) }));
}

export function saveReport(report: AIReport | null) {
  mutate((d) => ({ ...d, report }));
}
