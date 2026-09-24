"use client";

import { useRef } from "react";
import type { Video } from "@/lib/content/videos";
import { ShortCard } from "./ShortCard";

interface ShortsShelfProps {
  shorts: Video[];
  labels: { play: string; previous: string; next: string };
}

/** Horizontal row of Shorts, swiped on touch screens and paged with arrows on desktop. */
export function ShortsShelf({ shorts, labels }: ShortsShelfProps) {
  const listRef = useRef<HTMLUListElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const list = listRef.current;
    if (list) list.scrollBy({ left: direction * list.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={listRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shorts.map((short) => (
          <li
            key={short.id}
            className="w-[42%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)]"
          >
            <ShortCard
              videoId={short.id}
              title={short.title}
              thumbnailUrl={short.thumbnailUrl}
              playLabel={labels.play}
            />
            <h3 className="mt-3 line-clamp-2 text-sm leading-snug font-semibold">{short.title}</h3>
          </li>
        ))}
      </ul>

      {(
        [
          [-1, labels.previous, "left-0 -translate-x-1/2", "M12.5 4 6.5 10l6 6"],
          [1, labels.next, "right-0 translate-x-1/2", "m7.5 4 6 6-6 6"],
        ] as const
      ).map(([direction, label, position, path]) => (
        <button
          key={direction}
          type="button"
          onClick={() => scrollByPage(direction)}
          aria-label={label}
          className={`absolute top-[calc(50%-2rem)] hidden size-11 items-center justify-center rounded-full border border-line bg-cream text-ink shadow-md transition-colors hover:bg-sand md:flex ${position}`}
        >
          <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
            <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
