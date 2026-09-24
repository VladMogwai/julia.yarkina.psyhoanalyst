-- Content for the static site: articles and certificates, edited from /admin.
-- Anyone can read published content; only users listed in public.admins can write.

create schema if not exists private;

-- Admins ---------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

create policy "Admins can see themselves" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create function private.is_admin() returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Articles -------------------------------------------------------------------

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('ru', 'uk')),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  cover_url text,
  is_published boolean not null default false,
  published_at date not null default current_date,
  updated_at timestamptz not null default now(),
  unique (locale, slug)
);

alter table public.articles enable row level security;

create policy "Published articles are public" on public.articles
  for select using (is_published or (select private.is_admin()));

create policy "Admins manage articles" on public.articles
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Certificates ---------------------------------------------------------------

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  title_ru text not null,
  title_uk text not null,
  issuer text not null default '',
  year int check (year between 1950 and 2100),
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.certificates enable row level security;

create policy "Certificates are public" on public.certificates
  for select using (true);

create policy "Admins manage certificates" on public.certificates
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- updated_at -----------------------------------------------------------------

create function private.touch_updated_at() returns trigger
  language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_touch_updated_at
  before update on public.articles
  for each row execute function private.touch_updated_at();

-- Media storage (article covers, certificate scans) --------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admins upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select private.is_admin()));

create policy "Admins update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));

create policy "Admins delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));

-- Rebuild the static site when content changes -------------------------------
-- Store the Cloudflare Pages deploy hook URL in Vault:
--   select vault.create_secret('https://api.cloudflare.com/...', 'cloudflare_deploy_hook');

create extension if not exists pg_net with schema extensions;

create function private.request_site_rebuild() returns trigger
  language plpgsql security definer set search_path = ''
as $$
declare
  hook_url text;
begin
  select decrypted_secret into hook_url
  from vault.decrypted_secrets
  where name = 'cloudflare_deploy_hook';

  if hook_url is not null then
    perform net.http_post(url := hook_url, body := '{}'::jsonb);
  end if;

  return null;
end;
$$;

create trigger articles_request_site_rebuild
  after insert or update or delete on public.articles
  for each statement execute function private.request_site_rebuild();

create trigger certificates_request_site_rebuild
  after insert or update or delete on public.certificates
  for each statement execute function private.request_site_rebuild();
