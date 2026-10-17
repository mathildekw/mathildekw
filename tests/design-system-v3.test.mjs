import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const css = await readFile(new URL("mk-design-system.css", root), "utf8");
const motion = await readFile(new URL("mk-motion-system.js", root), "utf8");
const shell = await readFile(new URL("global-shell.js", root), "utf8");
const config = await readFile(new URL("site-config.js", root), "utf8");
for (const token of ["--mk-glass-subtle", "--mk-glass-card", "--mk-glass-elevated", "--mk-glass-dark", "--mk-duration-fast", "--mk-ease-spring"])
  assert.ok(css.includes(token), `Token manquant : ${token}`);
for (const primitive of [".mk-glass-subtle", ".mk-glass-card", ".mk-glass-elevated", ".mk-glass-dark"])
  assert.ok(css.includes(primitive), `Primitive manquante : ${primitive}`);
assert.match(css, /@supports not \(\(backdrop-filter/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /min-height:50px/);
assert.ok(shell.includes("/mk-design-system.css?v=1"));
assert.ok(config.includes("/mk-motion-system.js?v=1"));
for (const behavior of ["mk-scroll-progress", "requestAnimationFrame", "pointer:fine", "prefers-reduced-motion"])
  assert.ok(motion.includes(behavior), `Motion behavior manquant : ${behavior}`);
console.log("design-system-v3: tokens, glass, motion et fallbacks contrôlés");
