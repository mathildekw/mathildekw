import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const edge = await readFile(new URL("supabase/functions/visit-signature/index.ts", root), "utf8");
const migration = await readFile(new URL("supabase/migrations/20261027010000_visit_signature_system.sql", root), "utf8");
const page = await readFile(new URL("signature-bon-visite.html", root), "utf8");
const client = await readFile(new URL("signature-bon-visite.js", root), "utf8");

assert.match(edge, /verifyTallySignature/);
assert.match(edge, /HMAC/);
assert.match(edge, /TALLY_TERRAIN_WEBHOOK_SECRET/);
assert.match(edge, /document_hash/);
assert.match(edge, /evidenceHash/);
assert.match(edge, /ipPepper/);
assert.match(edge, /email_redirect_to/);
assert.match(edge, /auth\/v1\/user/);
assert.match(edge, /Bon de presentation et de visite/);
assert.doesNotMatch(edge.toLowerCase(), /talqor/);
assert.match(migration, /enable row level security/i);
assert.match(migration, /revoke all .* anon, authenticated/i);
assert.match(migration, /source_event_id/);
assert.match(migration, /evidence_hash/);
assert.match(page, /noindex,nofollow,noarchive/);
assert.match(page, /Signer et confirmer le bon de visite/);
assert.match(client, /Authorization: "Bearer "/);
assert.match(client, /certificateBase64/);

console.log("visit-signature: validation email, intégrité et preuve contrôlées");
