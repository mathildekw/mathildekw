const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const origin = Deno.env.get("FONCIER_ALLOWED_ORIGIN") || "https://mathildekw.com";
const notificationUrl = Deno.env.get("FONCIER_NOTIFICATION_WEBHOOK") || "";
const notificationSecret = Deno.env.get("FONCIER_NOTIFICATION_SECRET") || "";
const sheetsUrl = Deno.env.get("FONCIER_GOOGLE_SHEETS_WEBHOOK") || "";
const sheetsSecret = Deno.env.get("FONCIER_GOOGLE_SHEETS_SECRET") || "";

const cors = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function clean(value: unknown, max = 500) { return String(value ?? "").trim().slice(0, max); }
function normalizePhone(value: unknown) { return clean(value, 50).replace(/\D/g, ""); }
function normalizeEmail(value: unknown) { return clean(value, 180).toLowerCase(); }

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function secureToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function database(path: string, init: RequestInit = {}) {
  const result = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  const text = await result.text();
  if (!result.ok) throw new Error(`Database ${result.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

function geometry(data: Record<string, unknown>) {
  const value = data.parcel_geometry as Record<string, unknown> | undefined;
  return value && ["Polygon", "MultiPolygon"].includes(String(value.type)) && JSON.stringify(value).length < 200000 ? value : null;
}

function qualify(data: Record<string, unknown>) {
  let score = 20;
  const reasons: unknown[] = [];
  function add(criterion: string, points: number, matched: boolean, value: unknown) {
    if (matched) score += points;
    reasons.push({ criterion, points: matched ? points : 0, matched, value });
  }
  add("volonté de vendre", 25, ["Vendre à un promoteur", "Vendre au meilleur prix possible"].includes(String(data.owner_goal)), data.owner_goal);
  add("calendrier", 20, ["Immédiatement", "Dans les 3 mois"].includes(String(data.timeline)), data.timeline);
  add("accès déclaré", 12, /direct/i.test(String(data.access || "")), data.access);
  add("surface", 10, Number(data.surface) >= 2000, Number(data.surface) || null);
  add("situation foncière", 10, data.legal_status === "Propriétaire unique", data.legal_status);
  score = Math.min(100, score);
  return { score, priority: score >= 75 ? "P1" : score >= 50 ? "P2" : "P3", reasons };
}

async function notify(lead: Record<string, unknown>, priority: string) {
  if (!notificationUrl) return { status: "not_configured" };
  try {
    const result = await fetch(notificationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-PK-Secret": notificationSecret },
      body: JSON.stringify({
        event: priority === "P1" ? "priority_land_lead" : "new_land_lead",
        reference: lead.reference,
        priority,
        terrain: { commune: lead.commune, surface: lead.surface },
        actions: { dossier: `${origin}/admin-foncier.html` },
      }),
    });
    return { status: result.ok ? "delivered" : "failed", reference: result.headers.get("x-request-id"), error: result.ok ? null : `HTTP ${result.status}` };
  } catch (error) {
    return { status: "failed", error: String(error) };
  }
}

async function syncSheets(lead: Record<string, unknown>) {
  if (!sheetsUrl) return { status: "not_connected" };
  try {
    const url = new URL(sheetsUrl);
    if (sheetsSecret && !url.searchParams.has("secret")) url.searchParams.set("secret", sheetsSecret);
    const result = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-PK-Secret": sheetsSecret, "Idempotency-Key": `google_sheets:land_lead:${lead.id}` },
      body: JSON.stringify({ kind: "land_lead", unique_id: lead.id, row: lead }),
    });
    const body = await result.json().catch(() => ({}));
    if (!result.ok || body.ok !== true) throw new Error(body.error || `HTTP ${result.status}`);
    return { status: "synced" };
  } catch (error) {
    return { status: "error", error: String(error).slice(0, 500) };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return response({ error: "Méthode non autorisée" }, 405);
  try {
    const data = await request.json();
    if (clean(data.website)) return response({ accepted: true }, 202);
    if (!data.privacy_consent || !clean(data.first_name) || !clean(data.last_name) || !normalizePhone(data.phone) || !clean(data.commune) || !Number(data.surface)) {
      return response({ error: "Champs obligatoires manquants" }, 400);
    }

    const phoneNormalized = normalizePhone(data.phone);
    const emailNormalized = normalizeEmail(data.email);
    const clientFingerprint = clean(data.submission_fingerprint, 5000);
    const submissionHash = await hash(clientFingerprint || JSON.stringify([
      phoneNormalized, emailNormalized, clean(data.commune), Number(data.surface), clean(data.cadastre), clean(data.owner_goal), clean(data.timeline)
    ]));
    const qualification = qualify(data);
    const bookingToken = secureToken();
    const reportToken = secureToken();
    const acquisition = data.acquisition && typeof data.acquisition === "object" ? data.acquisition : {};

    const queries = [database(`foncier_land_leads?phone_normalized=eq.${encodeURIComponent(phoneNormalized)}&select=*&limit=1`)];
    if (emailNormalized) queries.push(database(`foncier_land_leads?email_normalized=eq.${encodeURIComponent(emailNormalized)}&select=*&limit=1`));
    const existing = (await Promise.all(queries)).flat().find(Boolean);
    const repeated = Boolean(existing && existing.last_submission_hash === submissionHash && existing.last_submission_at && Date.now() - new Date(existing.last_submission_at).getTime() < 10 * 60 * 1000);

    const row = {
      first_name: clean(data.first_name, 80), last_name: clean(data.last_name, 80),
      phone: clean(data.phone, 50), email: emailNormalized || null,
      preferred_channel: clean(data.preferred_channel, 30), marketing_consent: !!data.marketing_consent, privacy_consent: true,
      island: clean(data.island, 80), commune: clean(data.commune, 100), district: clean(data.district, 150),
      location: clean(data.location, 250), cadastre: clean(data.cadastre, 100), parcel_object_id: Number(data.parcel_object_id) || null,
      parcel_uid: clean(data.parcel_uid, 256) || null, parcel_geometry: geometry(data), cadastral_area: Number(data.cadastral_area) || null,
      geo_sources: data.parcel_object_id ? [{ label: "DAF — Parcelles cadastrales de Polynésie", url: "https://services.arcgis.com/L4H4rU26VyhEF588/arcgis/rest/services/CAD_parcelles_open/FeatureServer/0", license: "Licence Ouverte Etalab 2.0", consultedAt: new Date().toISOString() }] : [],
      surface: Number(data.surface), access: clean(data.access, 120), visibility: clean(data.visibility, 30), topography: clean(data.topography, 80),
      shape: clean(data.shape, 100), frontage: Number(data.frontage) || null, current_state: clean(data.current_state, 100),
      water: clean(data.water, 30), electricity: clean(data.electricity, 30), sanitation: clean(data.sanitation, 30),
      legal_status: clean(data.legal_status, 100), owner_goal: clean(data.owner_goal, 150), timeline: clean(data.timeline, 80),
      comment: clean(data.comment, 1500), qualification_score: qualification.score, qualification_reasons: { commercial: qualification.reasons },
      potential_projects: Array.isArray(data.qualification?.projects) ? data.qualification.projects : [], priority: qualification.priority === "P1",
      priority_level: qualification.priority, commercial_motivation: qualification.score, acquisition, ab_variant: clean(data.ab_variant, 5) || null,
      booking_token_hash: await hash(bookingToken), report_token_hash: await hash(reportToken), last_submission_hash: submissionHash,
      last_submission_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };

    const rows = existing
      ? await database(`foncier_land_leads?id=eq.${existing.id}`, { method: "PATCH", body: JSON.stringify(row) })
      : await database("foncier_land_leads", { method: "POST", body: JSON.stringify(row) });
    const lead = rows[0];

    if (!repeated) {
      await database("foncier_notifications", { method: "POST", body: JSON.stringify({
        kind: qualification.priority === "P1" ? "priority_land_lead" : existing ? "updated_land_lead" : "new_land_lead",
        title: qualification.priority === "P1" ? "Lead foncier prioritaire P1" : existing ? "Prospect foncier actualisé" : "Nouveau prospect foncier",
        body: `${lead.reference} · ${lead.commune} · ${lead.surface} m²`, entity_type: "land", entity_id: lead.id,
      }) });
      await database("foncier_activities", { method: "POST", body: JSON.stringify({
        land_id: lead.id, lead_id: lead.id, kind: "first_contact", reason: "Premier contact à effectuer",
        body: `Contacter le propriétaire · priorité ${qualification.priority}`,
        due_at: new Date(Date.now() + (qualification.priority === "P1" ? 4 : 24) * 3600000).toISOString(),
      }) });
    }

    const external = repeated ? { status: "deduplicated" } : await notify(lead, qualification.priority);
    const sheets = await syncSheets(lead);
    if (sheets.status !== "synced") {
      await database("foncier_integration_outbox?on_conflict=idempotency_key", {
        method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          destination: "google_sheets", event_type: "land_lead_upsert", idempotency_key: `google_sheets:land_lead:${lead.id}`,
          entity_type: "land_lead", entity_id: lead.id, status: "pending", attempts: 0,
          next_attempt_at: new Date().toISOString(), last_error: sheets.error || null,
          payload: { kind: "land_lead", unique_id: lead.id, row: lead },
        }),
      });
    }
    await database(`foncier_land_leads?id=eq.${lead.id}`, { method: "PATCH", body: JSON.stringify({
      sheet_sync_status: sheets.status, sheet_sync_error: sheets.error || null,
      sheet_synced_at: sheets.status === "synced" ? new Date().toISOString() : null,
    }) });

    if (data.resume_token) {
      await database(`foncier_partial_submissions?resume_token_hash=eq.${await hash(clean(data.resume_token, 200))}`, {
        method: "PATCH", body: JSON.stringify({ converted_lead_id: lead.id, follow_up_status: "converted" }),
      });
    }

    return response({
      id: lead.id, reference: lead.reference, priority: qualification.priority, score: qualification.score,
      booking_token: bookingToken, report_token: reportToken, sheet_sync: sheets.status,
      notification: external.status, updated_existing: !!existing, deduplicated: repeated,
    }, existing ? 200 : 201);
  } catch (error) {
    console.error(error);
    return response({ error: "Le dossier n’a pas pu être enregistré" }, 500);
  }
});
