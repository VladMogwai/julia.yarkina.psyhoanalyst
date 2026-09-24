import type { Locale } from "@/i18n/config";

export interface Article {
  id: string;
  locale: Locale;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  is_published: boolean;
  published_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  title_ru: string;
  title_uk: string;
  issuer: string;
  year: number | null;
  image_url: string;
  sort_order?: number;
  created_at?: string;
}
