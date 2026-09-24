"use client";

import { useState } from "react";

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  playLabel: string;
}

/**
 * Shows only the thumbnail until the visitor clicks play: the YouTube iframe weighs
 * ~1 MB of scripts, so loading it for every video would ruin page speed.
 */
export function YouTubePlayer({ videoId, title, thumbnailUrl, playLabel }: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-2xl"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      aria-label={`${playLabel}: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-ink"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail, static export */}
      <img
        src={thumbnailUrl}
        alt=""
        loading="lazy"
        className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-cream/90 text-accent shadow-lg transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="ml-1 size-6" aria-hidden="true">
          <path d="M8 5v14l11-7z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
