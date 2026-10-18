import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const sitemap = await readFile(new URL("../../sitemap.xml", import.meta.url), "utf8");
const routes = [...sitemap.matchAll(/<loc>https:\/\/mathildekw\.com(.*?)<\/loc>/g)]
  .map(match => match[1] || "/")
  .filter(path => !/\.(?:pdf|xml)$/i.test(path));

for (const path of routes) {
  test(`${path} reste lisible et contenu dans le viewport`, async ({ page }) => {
    const runtimeErrors = [];
    page.on("pageerror", error => runtimeErrors.push(error.message));
    await page.route(/google-analytics|googletagmanager|clarity\.ms|connect\.facebook\.net/, route => route.abort());
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} doit répondre`).toBeLessThan(400);
    await page.locator("[data-global-shell]").waitFor({ state: "visible" });
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--mk-surface").trim() !== "");
    await expect(page.locator("body h1")).toHaveCount(1);
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      darkSurfaceFailures: [...document.querySelectorAll('[data-surface="dark"] :is(h1,h2,h3,h4,h5,h6,p,li,a,strong,small)')]
        .filter(element => {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") return false;
          const rgb = style.color.match(/[\d.]+/g)?.slice(0, 3).map(Number) || [0, 0, 0];
          const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 255000;
          return brightness < .62;
        })
        .slice(0, 5)
        .map(element => `${element.tagName.toLowerCase()}: ${getComputedStyle(element).color} — ${element.textContent.trim().slice(0, 60)}`),
      tinyTargets: innerWidth > 768 ? [] : [...document.querySelectorAll("button,.btn,input:not([type='checkbox']):not([type='radio']),select,textarea,summary,.mk-shell-link")]
        .filter(element => {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") return false;
          if (element.classList.contains("mk-shell-link") && element.closest("nav")?.dataset.open !== "true") return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        })
        .slice(0, 5)
        .map(element => element.outerHTML.slice(0, 120))
    }));
    expect(metrics.overflow, `${path} déborde horizontalement`).toBeLessThanOrEqual(1);
    expect(metrics.darkSurfaceFailures, `${path} contient du texte sombre sur une surface déclarée sombre`).toEqual([]);
    expect(metrics.tinyTargets, `${path} contient des zones tactiles trop petites`).toEqual([]);
    expect(runtimeErrors, `${path} déclenche une erreur JavaScript`).toEqual([]);
  });
}
