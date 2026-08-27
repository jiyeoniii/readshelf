"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "책장", en: "SHELF" },
  { href: "/tracker", label: "트래커", en: "TRACKER" },
  { href: "/report", label: "리포트", en: "REPORT" },
];

/**
 * 넓은 화면에서는 가운데 세리프 워드마크를 두고 왼쪽에 메뉴를 놓는다.
 *
 * 좁은 화면에서는 가운데 정렬한 워드마크가 메뉴를 덮어 버튼을 누를 수 없다.
 * 그래서 모바일에서는 절대 정렬을 풀고 워드마크를 위, 메뉴를 아래로 쌓는다.
 */
export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line-soft bg-bg/90 backdrop-blur-sm">
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:justify-between sm:gap-0 sm:px-8 sm:py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-serif)] text-[24px] leading-none tracking-[0.02em] text-ink sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:text-[26px]"
        >
          ReadShelf
        </Link>

        <nav className="flex items-center gap-7 sm:gap-9">
          {TABS.map((tab) => {
            const active =
              tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {tab.en}
                <span
                  aria-hidden
                  className={`mt-1.5 block h-px origin-left transition-transform duration-300 ${
                    active ? "scale-x-100 bg-accent" : "scale-x-0 bg-transparent"
                  }`}
                />
                <span className="sr-only">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 넓은 화면에서 워드마크를 정확히 가운데 두기 위한 균형추 */}
        <span aria-hidden className="hidden w-px sm:block" />
      </div>
    </header>
  );
}
