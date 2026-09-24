import { marked } from "marked";

/** Article bodies are written in Markdown in the admin panel. */
export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false });
}
