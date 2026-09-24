import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Админка",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
