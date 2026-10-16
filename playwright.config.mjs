import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  outputDir: "./test-results/visual",
  fullyParallel: false,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]] : "line",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.012 } },
  use: {
    baseURL: "http://127.0.0.1:4173",
    // Use the same Playwright-managed Chromium locally and in CI so visual
    // baselines are reproducible across macOS and GitHub runners.
    browserName: "chromium",
    colorScheme: "light",
    locale: "fr-FR",
    timezoneId: "Pacific/Tahiti",
    serviceWorkers: "block"
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "tablet", use: { ...devices["iPad Mini"], browserName: "chromium" } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 } }
  ],
  webServer: {
    command: "node scripts/test-server.mjs",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
