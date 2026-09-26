-- "Self-knowledge": paid content bought once. Access is granted only by the payment callback
-- (the Cloudflare Worker, with the secret key); a browser can read its own orders and purchases
-- and the content it has bought, and nothing else.

-- Products -------------------------------------------------------------------

create table public.products (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Per language: { "uk": "...", "ru": "...", "fr": "...", "en": "...", "ro": "..." }
  title jsonb not null,
  description jsonb not null default '{}',
  price_uah numeric(10, 2) not null check (price_uah > 0),
  price_eur numeric(10, 2) not null check (price_eur > 0),
  is_active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Active products are public" on public.products
  for select using (is_active or (select private.is_admin()));

create policy "Admins manage products" on public.products
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Orders: one per checkout attempt, written by the Worker only ---------------

create table public.orders (
  reference text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null references public.products (slug),
  amount numeric(10, 2) not null,
  currency text not null check (currency in ('UAH', 'EUR')),
  status text not null default 'created'
    check (status in ('created', 'approved', 'declined', 'refunded', 'expired')),
  provider text not null default 'wayforpay',
  -- The last callback as received, for support and reconciliation.
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

create policy "Users see their own orders" on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

-- Purchases: the access itself, written by the Worker only --------------------

create table public.purchases (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null references public.products (slug),
  order_reference text references public.orders (reference),
  created_at timestamptz not null default now(),
  primary key (user_id, product_slug)
);

alter table public.purchases enable row level security;

create policy "Users see their own purchases" on public.purchases
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

create function private.has_purchase(product text) returns boolean
  language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.purchases where user_id = (select auth.uid()) and product_slug = product
  );
$$;

grant execute on function private.has_purchase(text) to authenticated;

-- Paid content: served only to buyers ------------------------------------------

create table public.premium_content (
  product_slug text not null references public.products (slug) on delete cascade,
  locale text not null check (locale in ('uk', 'ru', 'fr', 'en', 'ro')),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (product_slug, locale)
);

alter table public.premium_content enable row level security;

create policy "Buyers read what they bought" on public.premium_content
  for select to authenticated
  using ((select private.has_purchase(product_slug)) or (select private.is_admin()));

create policy "Admins manage premium content" on public.premium_content
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- The first product: the questionnaire "Questions to ask yourself".
-- Prices are placeholders until they are set; the product stays hidden until is_active is true.
insert into public.products (slug, title, description, price_uah, price_eur, is_active, sort_order) values (
  'questions-to-self',
  '{"uk": "Питання до себе", "ru": "Вопросы к себе", "fr": "Questions à se poser", "en": "Questions to ask yourself", "ro": "Întrebări pentru tine"}',
  '{"uk": "52 питання у восьми темах: тривога, провина, сором, образа, самотність, стосунки, самореалізація, межі. Кожне відкривається поступово — з тим, чого ти можеш не помічати, і трьома глибшими питаннями.",
    "ru": "52 вопроса в восьми темах: тревога, вина, стыд, обида, одиночество, отношения, самореализация, границы. Каждый открывается постепенно — с тем, чего ты можешь не замечать, и тремя более глубокими вопросами.",
    "fr": "52 questions en huit thèmes : anxiété, culpabilité, honte, rancune, solitude, relations, accomplissement de soi, limites. Chacune s’ouvre pas à pas — avec ce que tu ne remarques peut-être pas et trois questions plus profondes.",
    "en": "52 questions in eight topics: anxiety, guilt, shame, resentment, loneliness, relationships, self-realisation, boundaries. Each opens step by step — with what you may not be noticing and three deeper questions.",
    "ro": "52 de întrebări în opt teme: anxietate, vinovăție, rușine, supărare, singurătate, relații, împlinire de sine, limite. Fiecare se deschide pas cu pas — cu ce s-ar putea să nu observi și trei întrebări mai profunde."}',
  300, 7, false, 0
);
