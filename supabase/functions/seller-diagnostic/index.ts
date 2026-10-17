const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const origin = Deno.env.get("FONCIER_ALLOWED_ORIGIN") || "https://mathildekw.com";
const sheetsUrl = Deno.env.get("FONCIER_GOOGLE_SHEETS_WEBHOOK") || "";
const sheetsSecret = Deno.env.get("FONCIER_GOOGLE_SHEETS_SECRET") || "";
const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization,apikey,content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };

function reply(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
function clean(value: unknown, max = 500) { return String(value ?? "").trim().slice(0, max); }
function list(value: unknown, max = 20) { return Array.isArray(value) ? value.slice(0, max).map((item) => clean(item, 120)).filter(Boolean) : []; }
function phone(value: unknown) { return clean(value, 50).replace(/\D/g, ""); }
function email(value: unknown) { return clean(value, 180).toLowerCase(); }
function validEmail(value: unknown) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email(value)); }
async function sha(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function token() { const bytes = new Uint8Array(24); crypto.getRandomValues(bytes); return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }

async function database(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...init, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) } });
  const text = await response.text();
  if (!response.ok) throw new Error(`Database ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

function qualification(data: Record<string, unknown>) {
  let points = 0;
  if (["Vendre au plus vite", "Vendre dans les 3 mois"].includes(clean(data.objective))) points += 45;
  else if (clean(data.objective) === "Vendre dans les 6 mois") points += 30;
  else points += 15;
  if (["3 à 6 mois", "6 à 12 mois", "Plus de 12 mois"].includes(clean(data.sale_duration))) points += 25;
  if (clean(data.offers_status) === "Une ou plusieurs offres sérieuses" || clean(data.offers_status) === "Une offre qui n'a pas abouti") points += 15;
  if (clean(data.visits_level) === "Quelques visites" || clean(data.visits_level) === "Beaucoup de visites") points += 10;
  const priority = points >= 65 ? "P1" : points >= 40 ? "P2" : "P3";
  return { points, priority };
}

async function availableSlots() {
  const start = new Date();
  const end = new Date(Date.now() + 15 * 86400000);
  const [availability, landBooked, sellerBooked] = await Promise.all([
    database("foncier_availability?active=eq.true&select=*"),
    database(`foncier_appointments?status=eq.confirmed&start_at=gte.${encodeURIComponent(start.toISOString())}&start_at=lt.${encodeURIComponent(end.toISOString())}&select=start_at,end_at`),
    database(`seller_diagnostic_appointments?status=eq.confirmed&start_at=gte.${encodeURIComponent(start.toISOString())}&start_at=lt.${encodeURIComponent(end.toISOString())}&select=start_at,end_at`),
  ]);
  const busy = [...landBooked, ...sellerBooked].map((item: Record<string, string>) => [new Date(item.start_at).getTime(), new Date(item.end_at).getTime()]);
  const slots = [];
  for (let day = 1; day <= 14; day++) {
    const date = new Date(Date.now() + day * 86400000).toISOString().slice(0, 10);
    const weekday = new Date(`${date}T12:00:00-10:00`).getUTCDay();
    for (const window of availability.filter((item: Record<string, unknown>) => item.weekday === weekday)) {
      const [startHour, startMinute] = window.start_time.split(":").map(Number);
      const [endHour, endMinute] = window.end_time.split(":").map(Number);
      for (let minute = startHour * 60 + startMinute; minute + 45 <= endHour * 60 + endMinute; minute += 45) {
        const hh = String(Math.floor(minute / 60)).padStart(2, "0");
        const mm = String(minute % 60).padStart(2, "0");
        const slotStart = new Date(`${date}T${hh}:${mm}:00-10:00`);
        const slotEnd = new Date(slotStart.getTime() + 45 * 60000);
        if (slotStart > new Date() && !busy.some((range) => slotStart.getTime() < range[1] && slotEnd.getTime() > range[0])) slots.push({ start_at: slotStart.toISOString(), end_at: slotEnd.toISOString(), local_label: new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Pacific/Tahiti" }).format(slotStart) });
      }
    }
  }
  return slots.slice(0, 80);
}

async function syncSheets(lead: Record<string, unknown>) {
  if (!sheetsUrl) return { status: "not_connected" };
  try {
    const url = new URL(sheetsUrl);
    if (sheetsSecret) url.searchParams.set("key", sheetsSecret);
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-PK-Secret": sheetsSecret, "Idempotency-Key": `google_sheets:seller_lead:${lead.id}` }, body: JSON.stringify({ kind: "seller_lead", unique_id: lead.id, row: lead }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok !== true) throw new Error(body.error || `HTTP ${response.status}`);
    return { status: "synced" };
  } catch (error) { return { status: "pending", error: String(error).slice(0, 500) }; }
}

async function track(data: Record<string, unknown>) {
  const allowed = ["landing_view","cta_clicked","diagnostic_started","step_completed","diagnostic_abandoned","diagnostic_submitted","lead_recorded","appointment_viewed","appointment_confirmed","callback_requested"];
  if (!data.consent || !allowed.includes(clean(data.event_name, 50))) return false;
  await database("seller_diagnostic_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ session_id: data.session_id, event_name: data.event_name, lead_id: data.lead_id || null, page_path: clean(data.page_path, 200), traffic_source: clean(data.traffic_source, 80) || "direct", utm: typeof data.utm === "object" ? data.utm : {}, metadata: typeof data.metadata === "object" ? data.metadata : {} }) });
  return true;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = new URL(request.url);
    const path = url.pathname.split("/seller-diagnostic")[1] || "/";
    if (path === "/events" && request.method === "POST") { const recorded = await track(await request.json()); return reply({ recorded }, recorded ? 201 : 202); }
    if (path === "/slots" && request.method === "GET") return reply({ timezone: "Pacific/Tahiti", duration_minutes: 45, slots: await availableSlots() });
    if (path === "/leads" && request.method === "POST") {
      const data = await request.json();
      if (clean(data.website)) return reply({ accepted: true }, 202);
      if (!data.privacy_consent || !clean(data.first_name) || !clean(data.last_name) || !phone(data.phone) || !validEmail(data.email) || !clean(data.property_type) || !clean(data.commune) || !clean(data.sale_duration) || !clean(data.sale_method) || !clean(data.visits_level) || !clean(data.offers_status) || !clean(data.objective)) return reply({ error: "Champs obligatoires manquants ou invalides" }, 400);
      const normalizedPhone = phone(data.phone);
      const normalizedEmail = email(data.email);
      const fingerprint = clean(data.submission_fingerprint, 5000) || JSON.stringify([normalizedPhone, normalizedEmail, data.commune, data.property_type, data.sale_duration, data.objective]);
      const submissionHash = await sha(fingerprint);
      const existing = (await database(`seller_diagnostic_leads?phone_normalized=eq.${encodeURIComponent(normalizedPhone)}&property_type=eq.${encodeURIComponent(clean(data.property_type))}&commune=eq.${encodeURIComponent(clean(data.commune))}&select=*&limit=1`))[0];
      const repeated = Boolean(existing && existing.last_submission_hash === submissionHash && Date.now() - new Date(existing.last_submission_at).getTime() < 10 * 60000);
      const bookingToken = token();
      const qualified = qualification(data);
      const row = { first_name: clean(data.first_name, 80), last_name: clean(data.last_name, 80), phone: clean(data.phone, 50), email: normalizedEmail || null, preferred_channel: clean(data.preferred_channel, 30), privacy_consent: true, marketing_consent: !!data.marketing_consent, property_type: clean(data.property_type, 40), island: clean(data.island, 60), commune: clean(data.commune, 100), sale_duration: clean(data.sale_duration, 60), sale_method: clean(data.sale_method, 80), mandate_active: data.mandate_active === "Oui" ? true : data.mandate_active === "Non" ? false : null, mandate_type: clean(data.mandate_type, 80) || null, mandate_end_date: data.mandate_end_date || null, diffusion_channels: list(data.diffusion_channels), presentation_assets: list(data.presentation_assets), visits_level: clean(data.visits_level, 60), visits_count: Number.isFinite(Number(data.visits_count)) && data.visits_count !== "" ? Number(data.visits_count) : null, offers_status: clean(data.offers_status, 100), failed_offer_reason: clean(data.failed_offer_reason, 500) || null, current_price_xpf: Number(data.current_price_xpf) || null, initial_price_xpf: Number(data.initial_price_xpf) || null, last_price_change: data.last_price_change || null, feedback: list(data.feedback), objective: clean(data.objective, 80), diagnosis: typeof data.diagnosis === "object" ? data.diagnosis : {}, priority_level: qualified.priority, acquisition: typeof data.acquisition === "object" ? data.acquisition : {}, next_action: qualified.priority === "P1" ? "Proposer un audit de commercialisation" : "Premier contact vendeur", next_follow_up: new Date(Date.now() + (qualified.priority === "P1" ? 4 : 24) * 3600000).toISOString(), booking_token_hash: await sha(bookingToken), last_submission_hash: submissionHash, last_submission_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const rows = existing ? await database(`seller_diagnostic_leads?id=eq.${existing.id}`, { method: "PATCH", body: JSON.stringify(row) }) : await database("seller_diagnostic_leads", { method: "POST", body: JSON.stringify(row) });
      const lead = rows[0];
      if (!repeated) {
        await database("seller_diagnostic_activities", { method: "POST", body: JSON.stringify({ lead_id: lead.id, kind: "first_contact", body: row.next_action, due_at: row.next_follow_up }) });
        await database("foncier_notifications", { method: "POST", body: JSON.stringify({ kind: qualified.priority === "P1" ? "priority_seller_lead" : "new_seller_lead", title: qualified.priority === "P1" ? "Vendeur prioritaire P1" : "Nouveau diagnostic vendeur", body: `${lead.reference} · ${lead.property_type} · ${lead.commune}`, entity_type: "seller_diagnostic", entity_id: lead.id }) });
      }
      const sheets = await syncSheets(lead);
      if (sheets.status !== "synced") await database("foncier_integration_outbox?on_conflict=idempotency_key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ destination: "google_sheets", event_type: "seller_lead_upsert", idempotency_key: `google_sheets:seller_lead:${lead.id}`, entity_type: "seller_lead", entity_id: lead.id, status: "pending", next_attempt_at: new Date().toISOString(), last_error: sheets.error || null, payload: { kind: "seller_lead", unique_id: lead.id, row: lead } }) });
      await database(`seller_diagnostic_leads?id=eq.${lead.id}`, { method: "PATCH", body: JSON.stringify({ sheet_sync_status: sheets.status, sheet_sync_error: sheets.error || null, sheet_synced_at: sheets.status === "synced" ? new Date().toISOString() : null }) });
      return reply({ id: lead.id, reference: lead.reference, priority: qualified.priority, booking_token: bookingToken, sheet_sync: sheets.status, updated_existing: !!existing, deduplicated: repeated }, existing ? 200 : 201);
    }
    if (path === "/appointments" && request.method === "POST") {
      const data = await request.json();
      const leads = await database(`seller_diagnostic_leads?id=eq.${encodeURIComponent(data.lead_id)}&booking_token_hash=eq.${await sha(clean(data.booking_token, 200))}&select=*`);
      if (!leads[0]) return reply({ error: "Dossier ou autorisation invalide" }, 403);
      const slot = (await availableSlots()).find((item) => item.start_at === data.start_at && item.end_at === data.end_at);
      if (!slot || !["phone", "on_site"].includes(data.mode)) return reply({ error: "Ce créneau n’est plus disponible" }, 409);
      let appointment;
      try { appointment = await database("rpc/book_seller_diagnostic_appointment", { method: "POST", body: JSON.stringify({ target_lead: data.lead_id, target_start: data.start_at, target_end: data.end_at, target_mode: data.mode }) }); } catch { return reply({ error: "Ce créneau vient d’être réservé" }, 409); }
      await database(`seller_diagnostic_leads?id=eq.${data.lead_id}`, { method: "PATCH", body: JSON.stringify({ pipeline: "appointment", next_action: "Préparer l’audit de commercialisation", next_follow_up: data.start_at, updated_at: new Date().toISOString() }) });
      await database("seller_diagnostic_activities", { method: "POST", body: JSON.stringify({ lead_id: data.lead_id, kind: "appointment_booked", body: `Rendez-vous confirmé · ${data.mode}`, due_at: data.start_at }) });
      return reply({ confirmed: true, reference: appointment.confirmation_reference, start_at: appointment.start_at, timezone: "Pacific/Tahiti" }, 201);
    }
    if (path === "/callback" && request.method === "POST") {
      const data = await request.json();
      const leads = await database(`seller_diagnostic_leads?id=eq.${encodeURIComponent(data.lead_id)}&booking_token_hash=eq.${await sha(clean(data.booking_token, 200))}&select=id,reference`);
      if (!leads[0]) return reply({ error: "Dossier invalide" }, 403);
      await database("seller_diagnostic_activities", { method: "POST", body: JSON.stringify({ lead_id: data.lead_id, kind: "callback_requested", body: "Rappeler le propriétaire", due_at: new Date(Date.now() + 4 * 3600000).toISOString() }) });
      await database("foncier_notifications", { method: "POST", body: JSON.stringify({ kind: "seller_callback_requested", title: "Rappel vendeur demandé", body: leads[0].reference, entity_type: "seller_diagnostic", entity_id: data.lead_id }) });
      return reply({ recorded: true }, 201);
    }
    return reply({ error: "Route inconnue" }, 404);
  } catch (error) { console.error(error); return reply({ error: "Le service est temporairement indisponible" }, 500); }
});
