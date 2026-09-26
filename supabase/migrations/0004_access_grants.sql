-- Access given by hand from /admin: an email and a product, without a payment.
-- It works before the person has an account: signing in with that email (by a one-time code sent to
-- it, so nobody else can claim it) opens the product exactly like a purchase.

create table public.access_grants (
  email text not null check (email = lower(email) and email like '%_@_%'),
  product_slug text not null references public.products (slug) on delete cascade,
  note text not null default '',
  granted_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (email, product_slug)
);

alter table public.access_grants enable row level security;

create policy "Admins manage access grants" on public.access_grants
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "People see grants for their own email" on public.access_grants
  for select to authenticated
  using (email = lower((select auth.jwt() ->> 'email')));

-- Buyers and people with a grant read the paid content alike.
create or replace function private.has_purchase(product text) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.purchases where user_id = (select auth.uid()) and product_slug = product
  ) or exists (
    select 1 from public.access_grants
    where email = lower((select auth.jwt() ->> 'email')) and product_slug = product
  );
$$;
