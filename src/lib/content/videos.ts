export interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
}

interface PlaylistItemsResponse {
  nextPageToken?: string;
  items: {
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      resourceId: { videoId: string };
      thumbnails: Record<string, { url: string } | undefined>;
    };
    contentDetails: { videoPublishedAt?: string };
  }[];
}

interface VideosResponse {
  items: { id: string; contentDetails: { duration: string } }[];
}

const MAX_PAGES = 10;
const PAGE_SIZE = 50;

/** YouTube Shorts are at most 3 minutes long; anything that short is shown as a Short. */
const MAX_SHORTS_SECONDS = 180;

async function youtubeApi<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY! });
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${query}`);
  if (!response.ok) {
    throw new Error(`YouTube API error ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

/** ISO 8601 duration from the API, e.g. "PT1H2M3S" → 3723. */
function durationToSeconds(duration: string): number {
  const [, hours = "0", minutes = "0", seconds = "0"] =
    /^P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration) ?? [];
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

async function getDurations(ids: string[]): Promise<Map<string, number>> {
  const durations = new Map<string, number>();
  for (let start = 0; start < ids.length; start += PAGE_SIZE) {
    const data = await youtubeApi<VideosResponse>("videos", {
      part: "contentDetails",
      id: ids.slice(start, start + PAGE_SIZE).join(","),
    });
    for (const item of data.items) durations.set(item.id, durationToSeconds(item.contentDetails.duration));
  }
  return durations;
}

export interface ChannelVideos {
  shorts: Video[];
  videos: Video[];
}

/**
 * Public uploads of the YouTube channel split into Shorts and regular videos, newest first.
 * Runs at build time; returns empty lists until YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID are set.
 */
export async function getChannelVideos(): Promise<ChannelVideos> {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!process.env.YOUTUBE_API_KEY || !channelId) return { shorts: [], videos: [] };

  // Every channel has an "uploads" playlist: its id is the channel id with UC → UU.
  const playlistId = `UU${channelId.slice(2)}`;
  const videos: Video[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await youtubeApi<PlaylistItemsResponse>("playlistItems", {
      part: "snippet,contentDetails",
      playlistId,
      maxResults: String(PAGE_SIZE),
      ...(pageToken && { pageToken }),
    });

    for (const { snippet, contentDetails } of data.items) {
      // Private and deleted videos stay in the playlist but have no publish date.
      if (!contentDetails.videoPublishedAt) continue;
      const { thumbnails } = snippet;
      videos.push({
        id: snippet.resourceId.videoId,
        title: snippet.title,
        description: snippet.description,
        publishedAt: contentDetails.videoPublishedAt,
        thumbnailUrl: (thumbnails.maxres ?? thumbnails.high ?? thumbnails.medium ?? thumbnails.default)!.url,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const durations = await getDurations(videos.map((video) => video.id));
  const isShort = (video: Video) => (durations.get(video.id) ?? 0) <= MAX_SHORTS_SECONDS;

  return {
    // The API only gives 16:9 thumbnails; YouTube also serves the original vertical frame as oar2.jpg.
    shorts: videos
      .filter(isShort)
      .map((video) => ({ ...video, thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/oar2.jpg` })),
    videos: videos.filter((video) => !isShort(video)),
  };
}
