# Checks

Headless checks of the questionnaire and of deploys. They use the system Chrome and `puppeteer-core`; the paid questions are mocked from `supabase/seed/questions-to-self/` (git-ignored, so these run only on a machine that has the seed).

| Script | What it checks |
| --- | --- |
| `quiz.mjs` | Shared module: `openQuiz({ lang, device: "phone" \| "desktop", base })` opens `/questions/{lang}` with the questions mocked and returns helpers (`chooseTopic`, `forward`, `swipe`, `card`, `screenshot`, `errors`) |
| `phone-back.mjs` | Phones: a swipe down goes back, and questions keep how far they were opened |
| `wait-live.sh` | After a push: waits until a page of the live site contains a given text |

```bash
node scripts/check/phone-back.mjs ro
node scripts/check/phone-back.mjs ro https://yarkina-psy.online
scripts/check/wait-live.sh https://yarkina-psy.online/uk 'apple-touch-icon'
```

The default base is the dev server, `http://localhost:3200`. Write a new check as a short script on top of `quiz.mjs`; keep screenshots in a git-ignored place (for example the system temp folder).
