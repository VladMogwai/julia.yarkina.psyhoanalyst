@AGENTS.md

# Yuliia Yarkina, psychoanalyst — yarkina-psy.online

Next.js 16 static export served by one Cloudflare Worker (`worker/index.ts` + `out/`), Supabase for data and sign-in. The repo is **public**.

## Deploy

- Push to `main` = deploy: Cloudflare builds and the site is live in ~80 s. Push only when the user says so ("запуш", "выкладывай").
- Wait for it: `scripts/check/wait-live.sh <url> <text>`.
- Never commit `.env.example` (holds real keys): stage paths explicitly, or `git add -A -- . ':!.env.example'`.
- Articles and other Supabase content are read at build time: after changing them, push an empty commit to rebuild.

## Where things are

| What | Where |
| --- | --- |
| Site pages | `src/app/[lang]/…`, languages uk (main), ru, en, fr, ro |
| UI texts | `src/i18n/dictionaries/*.ts` |
| Contacts, social links | `src/config/site.ts` |
| "Самопізнання" section (product page) | `src/app/[lang]/self-knowledge/page.tsx`, text in `src/content/what-you-dont-see.ts` |
| Legal drafts (offer, refund, privacy) | `src/content/legal.ts`, FOP details are placeholders |
| Paid questionnaire `/questions/{lang}` | `src/quiz/`: `ScrollQuiz` (desktop ≥1024px + mouse), `MobileQuiz` (phones), interface texts `src/quiz/content/*.ts` |
| The 52 questions (paid) | `supabase/seed/questions-to-self/*.json` (git-ignored, never commit) → `node --env-file=.env.local scripts/upload-premium-content.mjs questions-to-self` |
| Checkout, WayForPay | `worker/index.ts`; without WayForPay keys checkout saves the order and shows "payment opens soon" |
| Sign-in email template | `supabase/email/magic-link.html`, pasted into Supabase by the user |
| Marker highlights with Julia's note | `Marked.tsx`, switched off: `showMarks` in the section page |
| Site icon | `src/app/favicon.ico`, `icon.png`, `apple-icon.png` |

## Supabase

- Keys in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` (send it as the `apikey` header only, no `Authorization`).
- Free access to the questionnaire for an email: insert into `access_grants` (`email` lowercase, `product_slug: "questions-to-self"`).

## Checking changes

- Dev server: preview `julia-yarkina-dev` on :3200. The Worker cannot start in the preview pane; run `npx wrangler dev --port 8787` in the background instead.
- Quiz checks run headless Chrome with the paid questions mocked from the seed: see `scripts/check/README.md`. Prefer text checks; screenshots only to show the user.
- Before pushing: `npx tsc --noEmit -p . && npx eslint <changed files>`, and `npm run build` for page changes.

## Working with the user

- Texts to paste (email templates, messages) go in the chat as blocks, never via pbcopy (it breaks Cyrillic).
- Romanian quotes always with a Russian translation; the user does not read Romanian.
- Address the reader gender-neutrally in all languages (the quiz was rewritten for it).
