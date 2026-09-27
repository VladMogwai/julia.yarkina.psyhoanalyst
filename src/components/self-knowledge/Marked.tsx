import type { CSSProperties } from "react";

/** Julia's portrait beside her notes, cropped to her face (128×128). */
const NOTE_PORTRAIT = "/images/julia-note.jpg";

/** The same text with its marks dropped, for while the marks are switched off. */
export const unmarked = (text: string) => text.replaceAll("==", "");

/**
 * Text with ==marked== phrases rendered as marker highlights: each becomes <mark> with a hue for its
 * colour; the highlight itself is drawn on the inner <span>, so it wraps across lines. With a `note`,
 * the mark also carries Julia's note: her small portrait and the note's text, in the paragraph's
 * margin. The fill comes with scrolling, see `mark` in globals.css.
 */
export function Marked({ text, hue, author, note }: { text: string; hue: number; author: string; note?: string }) {
  const parts = text.split(/==(.+?)==/);
  return parts.map((part, index) =>
    index % 2 ? (
      <mark key={index} data-author={author} style={{ "--hue": hue } as CSSProperties}>
        <span>{part}</span>
        {note && (
          <span className="mark-note" role="note">
            {/* eslint-disable-next-line @next/next/no-img-element -- a 3 KB static portrait in a static export */}
            <img className="mark-note__author" src={NOTE_PORTRAIT} alt={author} width={32} height={32} />
            <span className="mark-note__text">{note}</span>
          </span>
        )}
      </mark>
    ) : (
      part
    ),
  );
}
