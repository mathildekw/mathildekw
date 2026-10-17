import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  outputDir: "./test-results/visual",
  fullyParallel: false,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]] : "line",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide" } },
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    colorScheme: "light",
    locale: "fr-FR",
    timezoneId: "Pacific/Tahiti",
    serviceWorkers: "block"
  },
  projects: [
    { name: "mobile-320", use: { browserName: "chromium", viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true } },
    { name: "mobile-375", use: { browserName: "chromium", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "mobile-430", use: { browserName: "chromium", viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true } },
    { name: "tablet-768", use: { browserName: "chromium", viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "desktop-1024", use: { browserName: "chromium", viewport: { width: 1024, height: 900 }, deviceScaleFactor: 1 } },
    { name: "desktop-1440", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 } }
  ],
  webServer: {
    command: "node scripts/test-server.mjs",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
