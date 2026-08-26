import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

/** 워드마크와 큰 숫자에만 쓰는 세리프 */
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReadShelf — 나의 독서 분석",
  description:
    "책을 읽고 기록할수록 AI가 나의 독서 습관과 취향을 발견해주는 독서 분석 도구",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={serif.variable}>
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-6 pb-32 pt-14 sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
