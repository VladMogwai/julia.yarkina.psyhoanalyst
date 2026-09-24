import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { EmptyState, PageIntro } from "@/components/PageIntro";
import { ShortsShelf } from "@/components/ShortsShelf";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { contacts } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getChannelVideos } from "@/lib/content/videos";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/videos">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { videos } = getDictionary(lang);
  return pageMetadata({
    locale: lang,
    path: "/videos",
    title: videos.metaTitle,
    description: videos.metaDescription,
  });
}

export default async function VideosPage({ params }: PageProps<"/[lang]/videos">) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = getDictionary(locale).videos;
  const { shorts, videos } = await getChannelVideos();
  const allVideos = [...shorts, ...videos];

  return (
    <>
      <PageIntro title={dict.title} intro={dict.intro} />

      {allVideos.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: allVideos.map((video, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "VideoObject",
                name: video.title,
                description: video.description || video.title,
                thumbnailUrl: video.thumbnailUrl,
                uploadDate: video.publishedAt,
                embedUrl: `https://www.youtube.com/embed/${video.id}`,
                url: `https://www.youtube.com/watch?v=${video.id}`,
              },
            })),
          }}
        />
      )}

      {allVideos.length === 0 && <EmptyState text={dict.empty} />}

      {shorts.length > 0 && (
        <section className="container-page">
          <h2 className="mb-6 flex items-center gap-3 font-serif text-3xl font-medium">
            <svg viewBox="0 0 24 24" className="size-7 text-accent" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17.8 10.1 15.6 9l2.2-1.2a3.4 3.4 0 0 0-3.2-6l-8.4 4.5a3.4 3.4 0 0 0 .1 6l2.2 1.1-2.2 1.2a3.4 3.4 0 0 0 3.2 6l8.4-4.5a3.4 3.4 0 0 0-.1-6ZM10 15V9l5 3-5 3Z"
              />
            </svg>
            {dict.shortsTitle}
          </h2>
          <ShortsShelf shorts={shorts} labels={{ play: dict.play, previous: dict.previous, next: dict.next }} />
        </section>
      )}

      {videos.length > 0 && (
        <section className="container-page mt-16">
          {shorts.length > 0 && <h2 className="mb-8 font-serif text-3xl font-medium">{dict.videosTitle}</h2>}
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            {videos.map((video) => (
              <li key={video.id}>
                <YouTubePlayer
                  videoId={video.id}
                  title={video.title}
                  thumbnailUrl={video.thumbnailUrl}
                  playLabel={dict.play}
                />
                <time dateTime={video.publishedAt} className="mt-4 block text-sm text-muted">
                  {formatDate(video.publishedAt, locale)}
                </time>
                <h3 className="mt-1 font-serif text-2xl leading-snug font-medium">{video.title}</h3>
              </li>
            ))}
          </ul>
        </section>
      )}

      {contacts.youtube && (
        <p className="container-page mt-14 text-center">
          <a href={contacts.youtube} target="_blank" rel="noopener noreferrer" className="link-underline font-semibold">
            {dict.channelLink}
          </a>
        </p>
      )}
    </>
  );
}
