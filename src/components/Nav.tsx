"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "책장", en: "SHELF" },
  { href: "/tracker", label: "트래커", en: "TRACKER" },
  { href: "/report", label: "리포트", en: "REPORT" },
];

/**
 * 참조한 부티크 사이트들처럼, 가운데 세리프 워드마크를 두고
 * 좌우에 대문자 자간 넓은 메뉴를 놓는다. 테두리는 헤어라인 하나뿐.
 */
export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line-soft bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 sm:px-8">
        <nav className="flex items-center gap-6 sm:gap-9">
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

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-[family-name:var(--font-serif)] text-[26px] leading-none tracking-[0.02em] text-ink"
        >
          ReadShelf
        </Link>

        {/* 워드마크를 정확히 가운데 두기 위한 균형추 */}
        <span aria-hidden className="w-[1px]" />
      </div>
    </header>
  );
}
