import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "스트릿린디파이터",
  description: "스윙댄스 대회 참가 시스템",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
