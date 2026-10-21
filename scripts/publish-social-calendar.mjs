import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const postsPath = path.join(root, "social/posts.json");
const statePath = path.join(root, "social/published.json");
const posts = JSON.parse(await readFile(postsPath, "utf8"));
let state = { published: [] };
try { state = JSON.parse(await readFile(statePath, "utf8")); } catch {}

const tahitiDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Pacific/Tahiti", year: "numeric", month: "2-digit", day: "2-digit"
}).format(new Date());
const targetDate = process.env.SOCIAL_DATE || tahitiDate;
const dryRun = process.argv.includes("--dry-run");
const due = posts.filter((post) => post.date === targetDate && post.status === "scheduled" && !state.published.includes(post.id));

if (!due.length) {
  console.log(`Aucune publication à envoyer pour ${targetDate}.`);
  process.exit(0);
}

const apiVersion = process.env.META_GRAPH_API_VERSION;
const pageId = process.env.META_PAGE_ID;
const igUserId = process.env.META_IG_USER_ID;
const token = process.env.META_ACCESS_TOKEN;
const siteOrigin = (process.env.SITE_ORIGIN || "https://mathildekw.com").replace(/\/$/, "");

if (!dryRun && (!apiVersion || !pageId || !igUserId || !token)) {
  throw new Error("Configuration Meta incomplète : META_GRAPH_API_VERSION, META_PAGE_ID, META_IG_USER_ID et META_ACCESS_TOKEN sont requis.");
}

async function graph(endpoint, fields) {
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...fields, access_token: token })
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(`Meta Graph API: ${payload.error?.message || response.statusText}`);
  return payload;
}

for (const post of due) {
  if (dryRun) {
    console.log(`[dry-run] ${post.network}: ${post.id}`);
    continue;
  }
  if (post.network === "facebook") {
    await graph(`${pageId}/feed`, { message: post.text, link: post.link });
  } else if (post.network === "instagram") {
    const imageUrl = `${siteOrigin}/${post.media[0].file}`;
    const container = await graph(`${igUserId}/media`, { image_url: imageUrl, caption: `${post.text}\n\n${post.link}` });
    await graph(`${igUserId}/media_publish`, { creation_id: container.id });
  } else {
    throw new Error(`Réseau non pris en charge : ${post.network}`);
  }
  state.published.push(post.id);
  console.log(`Publié : ${post.id}`);
}

if (!dryRun) await writeFile(statePath, JSON.stringify(state, null, 2) + "\n");
