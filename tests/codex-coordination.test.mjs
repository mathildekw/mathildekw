import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [template, queue, ci, agents, docs, visual] = await Promise.all([
  readFile(new URL(".github/ISSUE_TEMPLATE/codex-mission.yml", root), "utf8"),
  readFile(new URL(".github/workflows/codex-mission-queue.yml", root), "utf8"),
  readFile(new URL(".github/workflows/pull-request-ci.yml", root), "utf8"),
  readFile(new URL("AGENTS.md", root), "utf8"),
  readFile(new URL("docs/CODEX_COORDINATION.md", root), "utf8"),
  readFile(new URL(".github/workflows/visual-regression.yml", root), "utf8"),
]);

for (const label of ["ai:ready", "ai:working", "ai:review", "ai:blocked", "ai:approved"])
  assert.ok(agents.includes(label) && docs.includes(label), `Label non documenté : ${label}`);

assert.match(template, /labels:\s*\n\s*- ai:ready/);
assert.match(queue, /issues:\s*write/);
assert.match(queue, /github\.event\.label\.name == 'ai:ready'/);
assert.doesNotMatch(queue, /OPENAI_API_KEY|pull_request_target|codex exec|npm install.*codex/i);
assert.match(ci, /permissions:\s*\n\s*contents: read/);
assert.match(ci, /pnpm test/);
assert.doesNotMatch(ci, /contents: write|deploy|push/);

for (const workflow of [ci, visual]) {
  for (const use of workflow.matchAll(/uses:\s*([^\s]+)/g))
    assert.match(use[1], /@[0-9a-f]{40}$/, `Action non épinglée : ${use[1]}`);
}

console.log("codex-coordination: file, permissions et CI validées");
