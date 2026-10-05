/**
 * Opens the paid questionnaire in headless Chrome as a buyer would see it: the request for the paid
 * questions is answered with the local seed, so no account or access is needed. Works against the
 * dev server and the live site alike.
 *
 *   const quiz = await openQuiz({ lang: "ro", device: "phone" });
 *   await quiz.chooseTopic(0);
 *   ...
 *   await quiz.close();
 */
import { readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SEED = new URL("../../supabase/seed/questions-to-self/", import.meta.url);

const VIEWPORTS = {
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900 },
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function openQuiz({ lang = "uk", device = "phone", base = "http://localhost:3200" } = {}) {
  const payload = JSON.parse(readFileSync(new URL(`${lang}.json`, SEED), "utf8"));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, defaultViewport: VIEWPORTS[device] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (!request.url().includes("/rest/v1/premium_content")) return request.continue();
    const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (request.method() === "OPTIONS") return request.respond({ status: 204, headers: cors });
    request.respond({ status: 200, contentType: "application/json", headers: cors, body: JSON.stringify({ payload }) });
  });

  await page.goto(`${base}/questions/${lang}`, { waitUntil: "networkidle2" });
  await wait(2500);

  const phone = device === "phone";
  return {
    page,
    errors,
    /** Picks a topic on the first screen by its position. */
    async chooseTopic(index = 0) {
      await page.evaluate(
        (selector, at) => document.querySelectorAll(selector)[at].click(),
        phone ? ".m-topics button" : ".topic",
        index,
      );
      await wait(2600);
    },
    /** Opens the next step, or moves on once the question is fully open. */
    async forward() {
      if (phone) await page.touchscreen.tap(195, 520);
      else await page.keyboard.press("ArrowDown");
      await wait(phone ? 500 : 1400);
    },
    /** Phones: a swipe up (direction -1) moves on, down (1) goes back. Desktop: the arrow keys. */
    async swipe(direction) {
      if (!phone) {
        await page.keyboard.press(direction < 0 ? "ArrowDown" : "ArrowUp");
        await wait(2000);
        return;
      }
      const startY = direction < 0 ? 620 : 300;
      await page.touchscreen.touchStart(195, startY);
      for (let step = 1; step <= 8; step++) {
        await page.touchscreen.touchMove(195, startY + direction * step * 25);
        await wait(16);
      }
      await page.touchscreen.touchEnd();
      await wait(2200);
    },
    /** Phones: the card on screen — its question, how many steps are open, whether it is the end card. */
    card: () =>
      page.evaluate(() => {
        const slot = document.querySelector(".m-slot--current");
        return {
          title: slot?.querySelector(".m-title")?.textContent.slice(0, 60),
          steps: slot?.querySelectorAll('.step[data-visible="true"]').length,
          end: Boolean(slot?.querySelector(".m-edge")),
        };
      }),
    screenshot: (path, options = {}) => page.screenshot({ path, ...options }),
    close: () => browser.close(),
  };
}
