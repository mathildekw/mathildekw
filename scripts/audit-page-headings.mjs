import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const ignoredDirectories = new Set(["node_modules", "playwright-report", "test-results", ".git"]);
const privatePage = /(^|\/)(admin-|portail-foncier|espace-vendeur|demo-espace-vendeur|suivi-vendeur|etude-fonciere-privee|dossier-promoteur)/;

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

function textContent(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

const inventory = [];
for (const file of (await collect(root)).sort()) {
  const html = await readFile(file, "utf8");
  const headings = [...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(match => ({
    level: Number(match[1]),
    text: textContent(match[2])
  }));
  let previous = 0;
  const jumps = [];
  headings.forEach((heading, index) => {
    if (previous && heading.level > previous + 1) jumps.push(index);
    previous = heading.level;
  });
  const path = relative(root, file);
  const noindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
  inventory.push({
    path,
    public: !privatePage.test(path) && !noindex,
    headings,
    h1: headings.filter(heading => heading.level === 1).length,
    jumps
  });
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(inventory, null, 2));
} else {
  console.log("| Page | Portée | H1 | H2 | H3 | Sauts |\n|---|---:|---:|---:|---:|---:|");
  inventory.forEach(page => console.log(`| ${page.path} | ${page.public ? "publique" : "privée/interne"} | ${page.h1} | ${page.headings.filter(h => h.level === 2).length} | ${page.headings.filter(h => h.level === 3).length} | ${page.jumps.length} |`));
}

if (process.argv.includes("--check")) {
  const invalid = inventory.filter(page => page.public && (page.h1 !== 1 || page.jumps.length));
  if (invalid.length) {
    console.error(`Hiérarchie invalide : ${invalid.map(page => page.path).join(", ")}`);
    process.exitCode = 1;
  }
}
