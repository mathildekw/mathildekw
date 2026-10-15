import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const config = read("site-config.js");
const landing = read("foncier-promotion.js");
const admin = read("admin-foncier-v2.js");
const adminFunction = read("supabase/functions/foncier-admin/index.ts");
const leadsFunction = read("supabase/functions/foncier-leads-v2/index.ts");
const maintenance = read("supabase/functions/foncier-maintenance/index.ts");
const migration = read("supabase/migrations/20261015100000_foncier_commercial_readiness.sql");
const sheets = read("integrations/google-apps-script/SuiviKWImpactWebhook.gs");

assert.match(config, /sb_publishable_/);
assert.doesNotMatch(config, /service_role|sb_secret_/i);
assert.match(config, /foncier-leads-v2/);
assert.match(config, /foncier-admin/);

assert.match(landing, /submission_fingerprint:fingerprint/);
assert.match(leadsFunction, /phone_normalized/);
assert.match(leadsFunction, /email_normalized/);
assert.match(leadsFunction, /deduplicated: repeated/);
assert.match(leadsFunction, /priority_land_lead/);
assert.match(leadsFunction, /foncier_integration_outbox/);

assert.match(adminFunction, /is_foncier_admin/);
assert.match(adminFunction, /foncier_audit_log/);
assert.match(admin, /Historique commercial/);
assert.match(admin, /Prochaine action/);
assert.match(admin, /data-followup/);

assert.match(migration, /foncier_appointment_updates_crm/);
assert.match(migration, /generate_foncier_due_followups/);
assert.match(migration, /bootstrap_foncier_admin/);
assert.match(migration, /Pacific\/Tahiti|foncier-commercial-maintenance/);

assert.match(maintenance, /claim_foncier_outbox/);
assert.match(maintenance, /body\.ok !== true/);
assert.match(sheets, /\[SUPABASE:/);
assert.match(sheets, /TARGET_TAB = "Journal"/);

console.log("foncier-commercial-readiness: 27 assertions réussies");
