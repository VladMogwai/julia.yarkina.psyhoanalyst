// Google sign-in for the YouTube scripts in this folder.
//
// Needs scripts/youtube/client_secret.json (Google Cloud → OAuth client of type "Desktop app").
// The first run opens Google sign-in in the browser and keeps the token in token.json; both files are
// git-ignored. Sign in with the account that owns the channel.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const here = dirname(fileURLToPath(import.meta.url));
const SECRET = join(here, "client_secret.json");
const TOKEN = join(here, "token.json");
// upload sets thumbnails; force-ssl reads the channel and changes its banner.
const SCOPE = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl";

const secret = await readFile(SECRET, "utf8").catch(() => {
  console.error(`Missing ${SECRET}\nDownload the OAuth client JSON (type "Desktop app") from Google Cloud and save it there.`);
  process.exit(1);
});
const { installed } = JSON.parse(secret);
if (!installed) {
  console.error('client_secret.json is not a "Desktop app" client. Create one of that type in Google Cloud.');
  process.exit(1);
}

/** Opens Google sign-in and catches the redirect on a local port. */
async function signIn() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const redirect = `http://127.0.0.1:${server.address().port}`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: installed.client_id,
    redirect_uri: redirect,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  console.log("Opening Google sign-in. If the browser does not open, paste this link:\n" + url);
  exec(`open "${url}"`);
  const code = await new Promise((resolve, reject) => {
    server.on("request", (req, res) => {
      const params = new URL(req.url, redirect).searchParams;
      res.end(params.get("code") ? "Done, you can close this tab." : "Sign-in failed: " + params.get("error"));
      server.close();
      params.get("code") ? resolve(params.get("code")) : reject(new Error(params.get("error")));
    });
  });
  return tokenRequest({ code, redirect_uri: redirect, grant_type: "authorization_code" });
}

async function tokenRequest(fields) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: installed.client_id, client_secret: installed.client_secret, ...fields }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error("Token error: " + JSON.stringify(json));
  return json;
}

export async function accessToken() {
  let saved = null;
  try {
    saved = JSON.parse(await readFile(TOKEN, "utf8"));
  } catch {}
  if (saved?.refresh_token) {
    try {
      const fresh = await tokenRequest({ refresh_token: saved.refresh_token, grant_type: "refresh_token" });
      if (SCOPE.split(" ").every((s) => fresh.scope?.includes(s))) return fresh.access_token;
      console.log("Saved sign-in lacks some permissions, signing in again.");
    } catch {
      console.log("Saved sign-in expired, signing in again.");
    }
  }
  const token = await signIn();
  await writeFile(TOKEN, JSON.stringify(token, null, 2));
  return token.access_token;
}

/** Prints which channel the token belongs to, so a wrong account is caught before any change. */
export async function showChannel(token) {
  const me = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  if (me.error) throw new Error("Channel check failed: " + me.error.message);
  console.log("Signed in as channel:", me.items?.[0]?.snippet?.title ?? "(no channel on this account)");
}
