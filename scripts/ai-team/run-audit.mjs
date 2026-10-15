import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(new URL("../../", import.meta.url).pathname);
const cadence = process.argv.find((x) => x.startsWith("--cadence="))?.split("=")[1] || "daily";
if (!["daily", "weekly", "monthly"].includes(cadence)) throw new Error("Cadence invalide");
const config = JSON.parse(await readFile(path.join(root, "config/ai-team.json"), "utf8"));
const startedAt = new Date();
const checks = [];
const proposals = [];
const evidence = (value) => crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
const record = (agent, id, status, title, detail, extra = {}) => checks.push({ agent, id, status, title, detail, ...extra });

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { redirect: "follow", ...options, signal: controller.signal, headers: { "User-Agent": "Pacific-Keys-Monitor/1.0", ...(options.headers || {}) } });
    const text = options.method === "HEAD" ? "" : await response.text();
    return { ok: response.ok, status: response.status, text, headers: Object.fromEntries(response.headers) };
  } finally { clearTimeout(timer); }
}

for (const page of config.publicPages) {
  const url = new URL(page, config.siteUrl).href;
  try {
    const result = await request(url);
    record("security", `uptime:${page}`, result.ok ? "pass" : "fail", `Disponibilité ${page}`, `HTTP ${result.status}`, { url, durationClass: "network", evidence: evidence(result.text) });
    if (result.ok && /<html/i.test(result.text)) {
      const title = result.text.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
      const description = result.text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1];
      const h1Count = (result.text.match(/<h1\b/gi) || []).length;
      record("seo", `seo:${page}`, title && description && h1Count === 1 ? "pass" : "warn", `SEO essentiel ${page}`, `title=${Boolean(title)}, description=${Boolean(description)}, h1=${h1Count}`, { url });
    }
  } catch (error) {
    record("security", `uptime:${page}`, "fail", `Disponibilité ${page}`, error.name === "AbortError" ? "Délai dépassé" : error.message, { url });
  }
}

for (const external of config.externalChecks) {
  try {
    const result = await request(external.url, { method: external.method });
    let valid = result.ok;
    if (external.id === "te-fenua-parcels" && result.ok) {
      const metadata = JSON.parse(result.text);
      valid = Boolean(metadata.name && Array.isArray(metadata.fields) && metadata.capabilities?.includes("Query"));
    }
    record("land", `external:${external.id}`, valid ? "pass" : external.required ? "fail" : "warn", `Service ${external.id}`, valid ? `HTTP ${result.status}, métadonnées exploitables` : `HTTP ${result.status} ou métadonnées incomplètes`, { url: external.url });
  } catch (error) { record("land", `external:${external.id}`, external.required ? "fail" : "warn", `Service ${external.id}`, error.message, { url: external.url }); }
}

const htmlFiles = (await readdir(root)).filter((name) => name.endsWith(".html"));
const missing = [];
for (const name of htmlFiles) {
  const html = await readFile(path.join(root, name), "utf8");
  for (const match of html.matchAll(/(?:href|src)=["'](\/[^"'#?]+)/g)) {
    const local = match[1] === "/" ? "index.html" : match[1].slice(1);
    try { await readFile(path.join(root, local)); }
    catch {
      try { await readFile(path.join(root, local, "index.html")); }
      catch { missing.push(`${name} → ${match[1]}`); }
    }
  }
}
record("security", "links:internal", missing.length ? "fail" : "pass", "Liens et ressources internes", missing.length ? missing.slice(0, 20).join("; ") : `${htmlFiles.length} pages contrôlées`);

const trackedExtensions = new Set([".html", ".js", ".mjs", ".json", ".yml", ".yaml", ".ts"]);
const suspicious = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "ai-reports"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await scan(full);
    else if (trackedExtensions.has(path.extname(entry.name))) {
      // The scanner contains the detection patterns as source text; do not
      // report its own implementation as a credential leak.
      if (full === new URL(import.meta.url).pathname) continue;
      const content = await readFile(full, "utf8");
      if (/(?:sk_live_|ghp_[A-Za-z0-9]{20,}|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^"']+)/.test(content)) suspicious.push(path.relative(root, full));
    }
  }
}
await scan(root);
record("security", "security:secrets", suspicious.length ? "fail" : "pass", "Recherche de secrets versionnés", suspicious.length ? suspicious.join(", ") : "Aucun motif de secret exploitable détecté");

const test = spawnSync(process.execPath, ["tests/finance-calculators.test.mjs"], { cwd: root, encoding: "utf8" });
record("security", "tests:smoke", test.status === 0 ? "pass" : "fail", "Tests de calcul critiques", test.status === 0 ? "Tests exécutés avec succès" : (test.stderr || test.stdout).slice(0, 800));

const failures = checks.filter((x) => x.status === "fail");
const warnings = checks.filter((x) => x.status === "warn");
for (const check of [...failures, ...warnings].slice(0, 8)) proposals.push({
  id: `proposal-${check.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
  title: check.title,
  agent: check.agent,
  problem: check.detail,
  evidence: check.url || check.id,
  expectedImpact: check.status === "fail" ? "Rétablir une fonction ou réduire un risque vérifié" : "Améliorer la qualité mesurable du site",
  priority: check.status === "fail" ? "P1" : "P2",
  risk: "À analyser avant toute modification",
  complexity: "À estimer",
  files: [],
  tests: [check.id],
  preview: null,
  estimatedCostUsd: 0,
  status: "detected"
});

const finishedAt = new Date();
const report = {
  schemaVersion: 1,
  runId: `${cadence}-${startedAt.toISOString().replace(/[:.]/g, "-")}`,
  cadence,
  timezone: config.timezone,
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  source: process.env.GITHUB_ACTIONS === "true" ? "github-actions" : "local",
  productionCommit: process.env.GITHUB_SHA || null,
  status: failures.length ? "attention" : warnings.length ? "review" : "healthy",
  summary: { checks: checks.length, passed: checks.filter((x) => x.status === "pass").length, warnings: warnings.length, failures: failures.length, proposals: proposals.length },
  agents: config.agents.map((agent) => ({ ...agent, activeThisRun: agent.enabled && agent.cadences.includes(cadence), lastRunStatus: agent.enabled && agent.cadences.includes(cadence) ? "completed" : "not_scheduled" })),
  cost: { modelCalls: 0, inputTokens: 0, outputTokens: 0, estimatedUsd: 0, budgetUsd: cadence === "daily" ? config.modelCalls.dailyBudgetUsd : config.modelCalls.monthlyBudgetUsd, modelLayerEnabled: config.modelCalls.enabled },
  checks,
  proposals
};
await mkdir(path.join(root, "ai-reports"), { recursive: true });
await writeFile(path.join(root, "ai-reports/latest.json"), JSON.stringify(report, null, 2) + "\n");
await writeFile(path.join(root, "ai-reports", `${report.runId}.json`), JSON.stringify(report, null, 2) + "\n");
const markdown = `# Bilan IA — Mathildekw.com\n\nExécution **${cadence}** du ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: config.timezone }).format(startedAt)} (Tahiti).\n\n- État : **${report.status}**\n- Contrôles : ${report.summary.checks}\n- Réussites : ${report.summary.passed}\n- Alertes : ${report.summary.warnings}\n- Échecs : ${report.summary.failures}\n- Propositions : ${report.summary.proposals}\n- Appels IA : 0\n- Coût estimé : 0 USD\n\n## Trois actions prioritaires\n\n${proposals.slice(0, 3).map((p, i) => `${i + 1}. **${p.title}** — ${p.problem}`).join("\n") || "1. Aucun incident détecté. Examiner les opportunités SEO et conversion lors de la revue humaine."}\n\n## Détail des contrôles\n\n${checks.map((c) => `- ${c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️" : "❌"} **${c.title}** — ${c.detail}`).join("\n")}\n`;
await writeFile(path.join(root, "ai-reports", "weekly.md"), markdown);
console.log(JSON.stringify(report.summary));
if (failures.length) process.exitCode = 2;
