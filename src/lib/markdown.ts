import { marked } from "marked";

/** A YouTube link alone on its own line becomes an embedded player. */
const YOUTUBE_LINE =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})\S*$/gm;

function embedYouTube(source: string): string {
  return source.replace(
    YOUTUBE_LINE,
    (_, id: string) =>
      `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`,
  );
}

/** Article bodies are written in Markdown in the admin panel. */
export function renderMarkdown(source: string): string {
  return marked.parse(embedYouTube(source), { async: false });
}
