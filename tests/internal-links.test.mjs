import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, normalize } from "node:path";

const root = new URL("../", import.meta.url);
const entries = await readdir(root, { withFileTypes: true });
const pages = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".html")).map((entry) => entry.name);
const missing = [];

for (const page of pages) {
  const html = await readFile(new URL(page, root), "utf8");
  const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const rawHref of links) {
    if (!rawHref.startsWith("/") || rawHref.startsWith("//")) continue;
    const pathname = decodeURIComponent(rawHref.split(/[?#]/)[0]);
    if (!pathname || pathname === "/") continue;
    const relative = pathname.replace(/^\/+/, "");
    const candidates = pathname.endsWith("/")
      ? [join(relative, "index.html")]
      : /\.[a-z0-9]+$/i.test(pathname)
        ? [relative]
        : [relative, `${relative}.html`, join(relative, "index.html")];
    let found = false;
    for (const candidate of candidates) {
      try {
        await access(new URL(normalize(candidate), root));
        found = true;
        break;
      } catch {}
    }
    if (!found) missing.push(`${page} → ${pathname}`);
  }
}

assert.deepEqual(missing, [], `Liens internes introuvables :\n${missing.join("\n")}`);
console.log(`internal-links: ${pages.length} pages racines contrôlées`);
