-- The site gets English and Romanian (Ukrainian becomes the default language).

alter table public.articles drop constraint articles_locale_check;
alter table public.articles add constraint articles_locale_check
  check (locale in ('uk', 'en', 'fr', 'ro', 'ru'));

-- Certificates added before these languages have no title in them: the site falls back to Ukrainian.
alter table public.certificates add column title_en text not null default '';
alter table public.certificates add column title_ro text not null default '';
