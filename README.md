# Юлия Яркина — психоаналитик

Сайт-визитка на двух языках (RU / UK): главная, статьи, видео с YouTube, сертификаты, админка для статей и сертификатов.

**Стек:** Next.js 16 (App Router, статический экспорт) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Cloudflare Pages. Всё на бесплатных тарифах.

## Как это устроено

- Сайт собирается в статический HTML (`pnpm build` → `out/`). Статьи и сертификаты берутся из Supabase, видео — из YouTube Data API **во время сборки**, поэтому страницы отдаются мгновенно и полностью видны поисковикам.
- `/admin` — клиентская админка: вход через Supabase Auth, запись разрешена только пользователям из таблицы `admins` (RLS).
- Любое изменение статей и сертификатов вызывает deploy hook Cloudflare (триггер в Postgres) — сайт пересобирается сам за 2–3 минуты.
- GitHub Action раз в сутки пересобирает сайт, чтобы подтягивались новые видео.
- Кнопка «Записаться» ведёт в мессенджер из `src/config/site.ts`.

```
src/
  app/[lang]/        страницы сайта (ru, uk)
  app/admin/         админка (noindex)
  app/sitemap.ts     sitemap.xml с hreflang
  config/site.ts     URL сайта, контакты и соцсети, портрет
  i18n/              тексты интерфейса на двух языках
  lib/content/       загрузка статей, сертификатов, видео при сборке
  lib/seo.ts         метаданные, canonical, hreflang, JSON-LD
supabase/migrations/ схема БД, RLS, bucket и триггер пересборки
```

## Локальный запуск

```bash
pnpm install
cp .env.example .env.local   # заполнить значения
pnpm dev
```

Без переменных Supabase и YouTube сайт тоже собирается — с пустыми списками.

## Настройка с нуля

1. **Supabase** (supabase.com, Free): создать проект, в SQL Editor выполнить `supabase/migrations/0001_init.sql`.
   - Authentication → Sign In / Providers: выключить «Allow new users to sign up».
   - Authentication → Users → Add user: создать пользователя для Юлии (email + пароль).
   - Сделать её администратором: `insert into public.admins (user_id) select id from auth.users where email = '…';`
   - Project Settings → API: скопировать URL и publishable key в `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. **YouTube**: в Google Cloud Console включить YouTube Data API v3, создать API key → `YOUTUBE_API_KEY`. ID канала (начинается с `UC…`) → `YOUTUBE_CHANNEL_ID`.
3. **Cloudflare Pages**: Workers & Pages → Create → Pages → подключить этот репозиторий.
   - Framework preset: Next.js (Static HTML Export), build command `pnpm build`, output `out`.
   - Environment variables: все переменные из `.env.example`.
   - Settings → Builds → Deploy hooks: создать hook и сохранить URL:
     - в Supabase: `select vault.create_secret('<URL>', 'cloudflare_deploy_hook');`
     - в GitHub: Settings → Secrets → Actions → `CLOUDFLARE_DEPLOY_HOOK`.
4. **Поисковики**: добавить сайт в Google Search Console и Яндекс Вебмастер, отправить `https://<домен>/sitemap.xml`.

## Контент

Тексты, фото и сертификаты взяты из [профиля Юлии на Mental Health db](https://www.mentalhealthdb.info/profile/6605af4a-494d-4135-bcfe-3ccd917cb94a/profile), русская версия — перевод. Фоновые фото — Pexels, список в `src/config/images.ts`.

Сертификаты из профиля лежат в `src/content/certificates.ts` и `public/images/certificates/` — они видны всегда; добавленные через админку показываются после них.

## Что осталось заполнить

- [ ] Остальные соцсети — `contacts` в `src/config/site.ts` (Telegram для записи уже указан).
- [ ] Проверить актуальность текстов из профиля (например, магистратура «в процессе обучения») — `src/i18n/dictionaries/ru.ts` и `uk.ts`.
- [ ] Свой домен (по желанию, ~$10/год) — после подключения поменять `NEXT_PUBLIC_SITE_URL`.
