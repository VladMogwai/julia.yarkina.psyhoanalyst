import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Галереи — демо эффектов",
  robots: { index: false, follow: false },
};

/** Standalone root layout: the demo shares nothing with the main site. */
export default function GalleryDemoLayout({ children }: LayoutProps<"/gallery-demo">) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, background: "#131417", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
