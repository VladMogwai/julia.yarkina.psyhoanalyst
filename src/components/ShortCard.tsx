"use client";

import { useEffect, useRef, useState } from "react";

interface ShortCardProps {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  playLabel: string;
}

/** Delay before a hovered card starts its muted preview, so passing the cursor over the row doesn't load every video. */
const PREVIEW_DELAY_MS = 400;

type Mode = "idle" | "preview" | "playing";

function embedUrl(videoId: string, mode: Exclude<Mode, "idle">): string {
  const params = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0" });
  if (mode === "preview") {
    // Muted is the only way browsers allow autoplay; loop needs the playlist param.
    params.set("mute", "1");
    params.set("controls", "0");
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

/** Vertical YouTube Short: muted preview on hover, plays with sound on click. */
export function ShortCard({ videoId, title, thumbnailUrl, playLabel }: ShortCardProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  function handlePointerEnter(event: React.PointerEvent) {
    if (event.pointerType !== "mouse" || mode !== "idle") return;
    // Functional update: a click may have started playback before the timer fires.
    hoverTimer.current = setTimeout(
      () => setMode((current) => (current === "idle" ? "preview" : current)),
      PREVIEW_DELAY_MS,
    );
  }

  function handlePointerLeave() {
    clearTimeout(hoverTimer.current);
    setMode((current) => (current === "preview" ? "idle" : current));
  }

  return (
    <div
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink"
    >
      {mode === "playing" ? (
        <iframe
          src={embedUrl(videoId, "playing")}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            clearTimeout(hoverTimer.current);
            setMode("playing");
          }}
          aria-label={`${playLabel}: ${title}`}
          className="group absolute inset-0 size-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail, static export */}
          <img src={thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
          {mode === "preview" && (
            <iframe
              src={embedUrl(videoId, "preview")}
              title=""
              tabIndex={-1}
              allow="autoplay; encrypted-media"
              className="pointer-events-none absolute inset-0 size-full"
            />
          )}
          <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent" />
        </button>
      )}
    </div>
  );
}
