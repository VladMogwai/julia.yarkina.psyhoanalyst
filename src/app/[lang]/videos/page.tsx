import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { EmptyState, PageIntro } from "@/components/PageIntro";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { contacts } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getVideos } from "@/lib/content/videos";
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
  const videos = await getVideos();

  return (
    <>
      <PageIntro title={dict.title} intro={dict.intro} />

      {videos.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: videos.map((video, index) => ({
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

      {videos.length === 0 && <EmptyState text={dict.empty} />}

      {videos.length > 0 && (
        <ul className="container-page grid gap-x-8 gap-y-12 md:grid-cols-2">
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
              <h2 className="mt-1 font-serif text-2xl leading-snug font-medium">{video.title}</h2>
            </li>
          ))}
        </ul>
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
