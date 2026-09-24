import Link from "next/link";

interface SectionTileProps {
  href: string;
  label: string;
  imageSrc: string;
  imageSrcSet?: string;
  isExternal?: boolean;
  /** Show the whole photo at the left edge on white instead of cropping it (for portraits). */
  showWholeImage?: boolean;
}

/** Full-bleed photo with a serif caption, linking to a section of the site. */
export function SectionTile({
  href,
  label,
  imageSrc,
  imageSrcSet,
  isExternal = false,
  showWholeImage = false,
}: SectionTileProps) {
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN image, static export */}
      <img
        src={imageSrc}
        srcSet={imageSrcSet}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt=""
        loading="lazy"
        className={`absolute inset-0 size-full transition-transform duration-700 ease-out group-hover:scale-[1.04] ${showWholeImage ? "origin-left object-contain object-left" : "object-cover"}`}
      />
      <span
        className="absolute inset-0 bg-gradient-to-l from-ink/60 via-ink/20 to-transparent"
        aria-hidden="true"
      />
      <span className="relative font-serif text-3xl font-medium text-cream drop-shadow-sm sm:text-4xl">
        {label}
      </span>
    </>
  );

  const className = `group relative flex aspect-[16/9] items-center justify-end overflow-hidden px-8 text-right sm:px-12 ${showWholeImage ? "bg-white" : "bg-sand"}`;

  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
