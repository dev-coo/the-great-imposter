import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Great Imposter",
  description: "사진을 올리면 임포스터가 몰래 숨어듭니다.",
  openGraph: {
    title: "The Great Imposter",
    description: "사진 속 임포스터를 찾아보세요.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
