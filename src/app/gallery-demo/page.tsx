import type { CSSProperties, ReactNode } from "react";
import { ScrollGalleries } from "@/scroll-gallery/ScrollGalleries";

// Placeholder photos from Pexels until the real ones are chosen.
const PHOTOS = [
  3965534, 1333742, 15128321, 37423357, 16550173, 4787231, 27990818, 8869381, 2563810, 30520816, 35485859,
  28830006, 13061431, 6186376, 11197155, 2158504, 2268519, 2158400, 2486900, 32368621, 14146745, 2157881,
  36379320, 2158455,
];

const photo = (index: number, width = 800) => {
  const id = PHOTOS[index % PHOTOS.length];
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
};

const bg = (index: number, width?: number): CSSProperties => ({ backgroundImage: `url(${photo(index, width)})` });

function Intro({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "0 6vw" }}>
      <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.6 }}>{number}</p>
      <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(28px, 4vw, 44px)", margin: "12px 0" }}>
        {title}
      </h2>
      <p style={{ lineHeight: 1.6, opacity: 0.75 }}>{children}</p>
    </section>
  );
}

function Items({ count, from = 0, inner = false, width }: { count: number; from?: number; inner?: boolean; width?: number }) {
  return Array.from({ length: count }, (_, index) =>
    inner ? (
      <div key={index} className="gallery__item">
        <div className="gallery__item-inner" style={bg(from + index, width)} />
      </div>
    ) : (
      <div key={index} className="gallery__item" style={bg(from + index, width)} />
    ),
  );
}

export default function GalleryDemoPage() {
  return (
    <ScrollGalleries>
      <header style={{ minHeight: "80vh", display: "grid", placeContent: "center", textAlign: "center", padding: "0 6vw" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(40px, 7vw, 96px)", margin: 0 }}>
          Галереи на скролле
        </h1>
        <p style={{ opacity: 0.7 }}>Девять эффектов. Прокручивайте вниз.</p>
      </header>

      <Intro number="01" title="Ряд → фото на весь экран">
        Семь карточек по размеру S-M-L-XL-L-M-S; центральная раскрывается на весь экран.
      </Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--row" data-flip='{"absoluteOnLeave":true,"scale":false}'>
          <Items count={3} />
          <div className="gallery__item" style={bg(3, 1920)} />
          <Items count={3} from={4} />
          <div className="caption caption--bottom">Место, где можно говорить о главном</div>
        </div>
      </div>

      <Intro number="02" title="Сетка 3×3 → мозаика на весь экран">
        Промежутки исчезают, карточки вырастают, картинки внутри «отъезжают» со scale 2 до 1.
      </Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--grid9">
          <Items count={9} from={5} inner width={1600} />
          <div className="caption caption--bottom">Встреча с собой</div>
        </div>
      </div>

      <Intro number="03" title="Разбросанные фото → одна стопка">
        Шестнадцать фото по сетке 10×4 по очереди ложатся в одну карточку в центре.
      </Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--scatter" data-flip='{"absolute":true,"scale":false,"end":"+=900%","stagger":0.05}'>
          <Items count={16} from={2} />
          <div className="caption caption--title">Истории</div>
        </div>
      </div>

      <Intro number="04" title="Ряд карточек → колода с затемнением">
        Карточки собираются веером; каждая следующая темнее.
      </Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--deck gallery--deck-dark">
          <Items count={6} from={10} />
          <div className="caption">Слой за слоем</div>
        </div>
      </div>

      <Intro number="05" title="Колода из стекла">То же, но карточки полупрозрачные и просвечивают друг через друга.</Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--deck gallery--deck-glass">
          <Items count={6} from={15} />
          <div className="caption">Прозрачность</div>
        </div>
      </div>

      <Intro number="06" title="Колода с глубиной">Как 04, плюс каждая следующая карточка чуть меньше.</Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--deck gallery--deck-depth">
          <Items count={6} from={18} />
          <div className="caption">Глубина</div>
        </div>
      </div>

      <Intro number="07" title="Огромная сетка → отъезд назад">
        80 обесцвеченных миниатюр; по мере скролла камера отъезжает, и возвращается цвет.
      </Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--wall">
          <Items count={80} width={400} />
          <div className="caption caption--title">Целое</div>
        </div>
      </div>

      <Intro number="08" title="Бенто → увеличение с разлётом">Сетка «раздувается», в кадре остаётся увеличенный фрагмент.</Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--bento" data-flip='{"scale":false}'>
          <Items count={8} from={4} width={1600} />
          <div className="caption caption--title">Детали</div>
        </div>
      </div>

      <Intro number="09" title="Зум из детали">Одна картинка: от крупного фрагмента к целому, цвет возвращается.</Intro>
      <div className="gallery-wrap">
        <div className="gallery gallery--zoom">
          <div className="gallery__item" style={bg(6, 1920)} />
          <div className="caption caption--title">Финал</div>
        </div>
      </div>

      <footer style={{ minHeight: "60vh", display: "grid", placeContent: "center", opacity: 0.6 }}>Конец демо</footer>
    </ScrollGalleries>
  );
}
