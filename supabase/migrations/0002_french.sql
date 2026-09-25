-- French version of the site: articles in French and French certificate titles.

alter table public.articles drop constraint articles_locale_check;
alter table public.articles add constraint articles_locale_check check (locale in ('ru', 'uk', 'fr'));

alter table public.certificates add column title_fr text not null default '';
