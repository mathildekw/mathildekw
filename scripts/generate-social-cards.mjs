import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const posts = JSON.parse(await readFile(path.join(root, "social/posts.json"), "utf8"));
const unique = new Map();
for (const post of posts) {
  const media = post.media?.[0];
  if (media && !unique.has(media.file)) unique.set(media.file, post);
}

const labels = {
  "2026-10-23": ["PRIX IMMOBILIER", "À TAHITI EN 2026"],
  "2026-10-27": ["SUCCESSION", "& INDIVISION"],
  "2026-10-30": ["CONSTRUIRE", "LE VRAI BUDGET"],
  "2026-11-03": ["ACHETER", "LES DOCUMENTS"],
  "2026-11-06": ["VENDRE", "AJUSTER SA STRATÉGIE"],
  "2026-11-10": ["DIVISER", "SON TERRAIN ?"],
  "2026-11-13": ["ACHETER", "QUEL APPORT ?"],
  "2026-11-17": ["HONORAIRES", "COMPRENDRE LE CALCUL"]
};

await mkdir(path.join(root, "social/media"), { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });

for (const [file, post] of unique) {
  const [line1, line2] = labels[post.date];
  await page.setContent(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden}
    body{background:#f4efe7;color:#073d37;font-family:Arial,sans-serif;padding:78px}
    .card{height:1194px;border:2px solid rgba(7,61,55,.22);border-radius:64px;padding:72px;position:relative;overflow:hidden;background:linear-gradient(145deg,#fffaf2 0%,#f2ebe1 65%,#e5efe8 100%)}
    .orb{position:absolute;width:540px;height:540px;border-radius:50%;right:-210px;top:-165px;background:#ea725d;opacity:.92}
    .line{width:84px;height:8px;border-radius:8px;background:#ea725d;margin:210px 0 48px}
    .kicker{font-size:25px;letter-spacing:7px;font-weight:800}
    h1{font:400 100px/1.02 Georgia,serif;letter-spacing:-4px;margin:0;max-width:820px}
    h1 em{display:block;color:#ea725d;font-weight:400}
    .read{position:absolute;left:72px;bottom:150px;font-size:30px;line-height:1.4;max-width:650px;color:#315f59}
    .brand{position:absolute;left:72px;right:72px;bottom:62px;border-top:2px solid rgba(7,61,55,.18);padding-top:26px;display:flex;justify-content:space-between;font-weight:800;letter-spacing:3px;font-size:22px}
  </style></head><body><main class="card"><div class="orb"></div><p class="kicker">GUIDE IMMOBILIER · TAHITI</p><div class="line"></div><h1>${line1}<em>${line2}</em></h1><p class="read">Des repères clairs pour décider sans transformer une information générale en promesse.</p><div class="brand"><span>MATHILDE KW</span><span>MATHILDEKW.COM</span></div></main></body></html>`);
  await page.screenshot({ path: path.join(root, file), type: "jpeg", quality: 91, fullPage: false });
}

await browser.close();
console.log(`${unique.size} cartes sociales générées.`);
