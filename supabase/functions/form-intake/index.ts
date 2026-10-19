const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const allowedOrigin = Deno.env.get("FONCIER_ALLOWED_ORIGIN") || "https://mathildekw.com";
const sheetsUrl = Deno.env.get("FONCIER_GOOGLE_SHEETS_WEBHOOK") || "";
const sheetsSecret = Deno.env.get("FONCIER_GOOGLE_SHEETS_SECRET") || "";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function clean(value: unknown, max = 500) { return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function requestIdentity(request: Request) {
  return (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
}
function originAllowed(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === allowedOrigin;
}
async function database(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...init, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) } });
  const text = await response.text();
  if (!response.ok) throw new Error(`Database ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
async function syncSheet(kind: string, id: string, row: Record<string, unknown>) {
  if (!sheetsUrl) return { status: "not_configured", error: "Webhook Google Sheets absent" };
  try {
    const url = new URL(sheetsUrl);
    if (sheetsSecret && !url.searchParams.has("secret")) url.searchParams.set("secret", sheetsSecret);
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-PK-Secret": sheetsSecret }, body: JSON.stringify({ kind, unique_id: id, row }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) throw new Error(result.error || `HTTP ${response.status}`);
    return { status: "synced", error: null };
  } catch (error) { return { status: "failed", error: String(error).slice(0, 500) }; }
}
async function withinRateLimit(request: Request) {
  const response = await database("rpc/consume_public_api_rate_limit", { method: "POST", body: JSON.stringify({ p_scope: "form-intake", p_identifier_hash: await sha256(requestIdentity(request)), p_limit: 12, p_window_seconds: 3600 }) });
  return response === true;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return reply({ error: "Méthode non autorisée" }, 405);
  if (!originAllowed(request)) return reply({ error: "Origine non autorisée" }, 403);
  if (Number(request.headers.get("content-length") || 0) > 32768) return reply({ error: "Requête trop volumineuse" }, 413);
  try {
    if (!await withinRateLimit(request)) return reply({ error: "Trop de demandes. Réessaie plus tard." }, 429);
    const data = await request.json();
    if (JSON.stringify(data).length > 32768) return reply({ error: "Requête trop volumineuse" }, 413);
    if (clean(data.website)) return reply({ accepted: true }, 202);
    const kind = clean(data.kind, 60);
    const payload = data.payload && typeof data.payload === "object" ? data.payload : {};
    const phone = clean(payload.phone || payload.telephone, 50);
    const email = clean(payload.email, 180).toLowerCase();
    const contactName = clean(payload.contact_name || payload.nom || payload.prenom || payload.fullName, 180);
    if (!kind || !clean(data.source, 300) || (!phone && !email)) return reply({ error: "Coordonnées obligatoires manquantes" }, 400);
    const existing = kind === "kw_offers_email" && email
      ? (await database(`public_form_submissions?kind=eq.kw_offers_email&email=eq.${encodeURIComponent(email)}&select=*&limit=1`))[0]
      : null;
    const submission = { kind, source: clean(data.source, 300), contact_name: contactName || null, phone: phone || null, email: email || null, payload };
    const stored = existing
      ? (await database(`public_form_submissions?id=eq.${existing.id}`, { method: "PATCH", body: JSON.stringify(submission) }))[0]
      : (await database("public_form_submissions", { method: "POST", body: JSON.stringify(submission) }))[0];
    const row = { ...payload, id: stored.id, created_at: stored.created_at, source: data.source, phone, email };
    const sheet = await syncSheet(kind, stored.id, row);
    await database(`public_form_submissions?id=eq.${stored.id}`, { method: "PATCH", body: JSON.stringify({ sheet_status: sheet.status, sheet_error: sheet.error }) });
    if (sheet.status !== "synced") return reply({ saved: true, reference: stored.id, deduplicated: !!existing, notification: sheet.status, warning: "Enregistré, notification en attente" }, 202);
    return reply({ saved: true, reference: stored.id, deduplicated: !!existing, notification: "sent" }, existing ? 200 : 201);
  } catch (error) {
    console.error(error);
    return reply({ error: "Impossible d’enregistrer le formulaire" }, 500);
  }
});
