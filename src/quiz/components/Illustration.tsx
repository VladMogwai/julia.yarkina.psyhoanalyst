import type { IllustrationName } from "../content/types";

/**
 * Botanical-atlas style drawings made of overlapping translucent flat shapes,
 * which reads as watercolor without gradients.
 */
const drawings: Record<IllustrationName, (accent: string) => React.ReactNode> = {
  moon: (accent) => (
    <>
      <circle cx="50" cy="46" r="26" fill={accent} opacity=".35" />
      <circle cx="44" cy="42" r="22" fill={accent} opacity=".55" />
      <circle cx="58" cy="36" r="20" fill="#FBF6EE" />
      <path d="M22 78c10-6 18-6 28 0s18 6 28 0" fill="none" stroke="#0F1C17" strokeWidth="1.2" opacity=".6" />
    </>
  ),
  leaf: (accent) => (
    <>
      <path d="M50 88C24 70 22 36 50 12c28 24 26 58 0 76Z" fill={accent} opacity=".3" />
      <path d="M50 84C32 66 32 40 50 20c18 20 18 46 0 64Z" fill={accent} opacity=".5" />
      <path d="M50 92V22M50 46l-12-10M50 60l13-11M50 72l-10-8" fill="none" stroke="#0F1C17" strokeWidth="1.2" opacity=".7" />
    </>
  ),
  flower: (accent) => (
    <>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="50" cy="30" rx="11" ry="18" fill={accent} opacity=".4" transform={`rotate(${angle} 50 46)`} />
      ))}
      <circle cx="50" cy="46" r="8" fill="#0F1C17" opacity=".75" />
      <path d="M50 64v30" stroke="#0F1C17" strokeWidth="1.2" opacity=".6" />
    </>
  ),
  sprout: (accent) => (
    <>
      <ellipse cx="50" cy="84" rx="30" ry="7" fill={accent} opacity=".25" />
      <path d="M50 84V44" stroke="#0F1C17" strokeWidth="1.4" opacity=".75" />
      <path d="M50 56C36 56 26 46 24 32c14 0 24 8 26 24Z" fill={accent} opacity=".55" />
      <path d="M50 46c2-16 12-26 28-26-2 16-12 26-28 26Z" fill={accent} opacity=".4" />
    </>
  ),
  seed: (accent) => (
    <>
      <circle cx="50" cy="50" r="30" fill={accent} opacity=".2" />
      <path d="M50 24c14 10 18 34 0 52-18-18-14-42 0-52Z" fill={accent} opacity=".55" />
      <path d="M50 30v40" stroke="#0F1C17" strokeWidth="1.2" opacity=".6" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#0F1C17" strokeWidth="1" opacity=".35" />
    </>
  ),
};

export function Illustration({ name, accent }: { name: IllustrationName; accent: string }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      {drawings[name](accent)}
    </svg>
  );
}
