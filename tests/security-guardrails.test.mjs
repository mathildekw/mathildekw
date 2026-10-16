import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const ignore = await readFile(new URL(".gitignore", root), "utf8");

for (const rule of [".env.*", "!.env.example", "**/private-payload.json", "supabase/.temp/"]) {
  assert.ok(ignore.includes(rule), `Règle .gitignore manquante : ${rule}`);
}

const tracked = execFileSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8",
}).split("\n").filter(Boolean);

const forbidden = tracked.filter((path) =>
  /(^|\/)\.env(?:\.|$)/.test(path) && path !== ".env.example" ||
  /(^|\/)private-payload\.json$/.test(path) ||
  /(^|\/)supabase\/\.temp\//.test(path)
);
assert.deepEqual(forbidden, [], `Fichiers locaux/confidentiels suivis par Git : ${forbidden.join(", ")}`);

console.log(`security-guardrails: ${tracked.length} fichiers suivis contrôlés`);
