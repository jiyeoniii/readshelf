import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

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
    <html lang="ko">
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">{children}</main>
      </body>
    </html>
  );
}
