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

const MAX_PAGES = 10;

/**
 * All public uploads of the YouTube channel, newest first.
 * Runs at build time; returns [] until YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID are set.
 */
export async function getVideos(): Promise<Video[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return [];

  // Every channel has an "uploads" playlist: its id is the channel id with UC → UU.
  const playlistId = `UU${channelId.slice(2)}`;
  const videos: Video[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
    if (!response.ok) {
      throw new Error(`YouTube API error ${response.status}: ${await response.text()}`);
    }
    const data = (await response.json()) as PlaylistItemsResponse;

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

  return videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
