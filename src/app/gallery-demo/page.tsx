import type { ReactNode } from "react";
import { GalleryEffect, type GalleryEffectName } from "@/scroll-gallery/GalleryEffect";
import { ScrollGalleries } from "@/scroll-gallery/ScrollGalleries";
import { pexelsPhoto } from "@/scroll-gallery/placeholder-photos";

const DEMOS: { effect: GalleryEffectName; title: string; text: string; caption: string; offset: number }[] = [
  { effect: "row", title: "Ряд → фото на весь экран", text: "Семь карточек по размеру S-M-L-XL-L-M-S; центральная раскрывается на весь экран.", caption: "Место, где можно говорить о главном", offset: 0 },
  { effect: "grid", title: "Сетка 3×3 → мозаика на весь экран", text: "Промежутки исчезают, карточки вырастают, картинки внутри «отъезжают» со scale 2 до 1.", caption: "Встреча с собой", offset: 5 },
  { effect: "scatter", title: "Разбросанные фото → одна стопка", text: "Шестнадцать фото по сетке 10×4 по очереди ложатся в одну карточку в центре.", caption: "Истории", offset: 2 },
  { effect: "deck", title: "Ряд карточек → колода с затемнением", text: "Карточки собираются веером; каждая следующая темнее.", caption: "Слой за слоем", offset: 10 },
  { effect: "glass", title: "Колода из стекла", text: "То же, но карточки полупрозрачные и просвечивают друг через друга.", caption: "Прозрачность", offset: 15 },
  { effect: "depth", title: "Колода с глубиной", text: "Как 04, плюс каждая следующая карточка чуть меньше.", caption: "Глубина", offset: 18 },
  { effect: "wall", title: "Огромная сетка → отъезд назад", text: "80 обесцвеченных миниатюр; камера отъезжает, и возвращается цвет.", caption: "Целое", offset: 0 },
  { effect: "bento", title: "Бенто → увеличение с разлётом", text: "Сетка «раздувается», в кадре остаётся увеличенный фрагмент.", caption: "Детали", offset: 4 },
  { effect: "zoom", title: "Зум из детали", text: "Одна картинка: от крупного фрагмента к целому, цвет возвращается.", caption: "Финал", offset: 6 },
];

function Intro({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "0 6vw" }}>
      <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.6 }}>{number}</p>
      <h2 style={{ fontWeight: 400, fontSize: "clamp(28px, 4vw, 44px)", margin: "12px 0" }}>
        {title}
      </h2>
      <p style={{ lineHeight: 1.6, opacity: 0.75 }}>{children}</p>
    </section>
  );
}

export default function GalleryDemoPage() {
  return (
    <ScrollGalleries>
      <header style={{ minHeight: "80vh", display: "grid", placeContent: "center", textAlign: "center", padding: "0 6vw" }}>
        <h1 style={{ fontWeight: 400, fontSize: "clamp(40px, 7vw, 96px)", margin: 0 }}>
          Галереи на скролле
        </h1>
        <p style={{ opacity: 0.7 }}>Девять эффектов. Прокручивайте вниз.</p>
      </header>

      {DEMOS.map((demo, index) => (
        <div key={demo.effect}>
          <Intro number={String(index + 1).padStart(2, "0")} title={demo.title}>
            {demo.text}
          </Intro>
          <GalleryEffect
            effect={demo.effect}
            caption={demo.caption}
            photo={(item, width) => pexelsPhoto(item + demo.offset, width)}
          />
        </div>
      ))}

      <footer style={{ minHeight: "60vh", display: "grid", placeContent: "center", opacity: 0.6 }}>Конец демо</footer>
    </ScrollGalleries>
  );
}
