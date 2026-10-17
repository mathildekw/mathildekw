const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const allowedOrigin = Deno.env.get("FONCIER_ALLOWED_ORIGIN") || "https://mathildekw.com";

const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
}

function clean(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

async function database(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Database ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function isAdmin(request: Request) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/is_foncier_admin`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  return response.ok && (await response.json()) === true;
}

async function audit(request: Request, action: string, entityType: string, entityId?: string, metadata: unknown = {}) {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  let actorId = null;
  if (token) {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
    });
    if (response.ok) actorId = (await response.json()).id || null;
  }
  await database("foncier_audit_log", {
    method: "POST",
    body: JSON.stringify({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId || null, metadata }),
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (!(await isAdmin(request))) return json({ error: "Non autorisé" }, 401);
    const url = new URL(request.url);
    const path = url.pathname.split("/foncier-admin")[1] || "/";

    if (request.method === "GET" && path === "/summary") {
      const [lands, promoters, matches, activities, appointments, notifications, settings, outbox, sellers, sellerActivities, sellerAppointments, sellerMetrics] = await Promise.all([
        database("foncier_land_leads?select=*&order=created_at.desc"),
        database("foncier_promoters?select=*&order=created_at.desc"),
        database("foncier_matches?select=*&order=score.desc"),
        database("foncier_activities?select=*&order=created_at.desc&limit=1000"),
        database("foncier_appointments?select=*&order=start_at.desc&limit=500"),
        database("foncier_notifications?select=*&order=created_at.desc&limit=200"),
        database("foncier_settings?select=*"),
        database("foncier_integration_outbox?select=status,destination,last_error,attempts,next_attempt_at,entity_id&order=created_at.desc&limit=200"),
        database("seller_diagnostic_leads?select=*&order=created_at.desc"),
        database("seller_diagnostic_activities?select=*&order=created_at.desc&limit=1000"),
        database("seller_diagnostic_appointments?select=*&order=start_at.desc&limit=500"),
        database("rpc/seller_diagnostic_metrics", { method: "POST", body: JSON.stringify({ date_from: new Date(Date.now() - 30 * 86400000).toISOString() }) }),
      ]);
      return json({ lands, promoters, matches, activities, appointments, notifications, settings, outbox, sellers, sellerActivities, sellerAppointments, sellerMetrics });
    }

    const sellerMatch = path.match(/^\/sellers\/([0-9a-f-]+)$/i);
    if (request.method === "PATCH" && sellerMatch) {
      const body = await request.json();
      const allowed: Record<string, unknown> = {};
      for (const key of ["pipeline", "priority_level", "next_action", "next_follow_up"]) if (key in body) allowed[key] = body[key] || null;
      allowed.updated_at = new Date().toISOString();
      const rows = await database(`seller_diagnostic_leads?id=eq.${encodeURIComponent(sellerMatch[1])}`, { method: "PATCH", body: JSON.stringify(allowed) });
      await audit(request, "seller_diagnostic_updated", "seller_diagnostic", sellerMatch[1], { fields: Object.keys(allowed) });
      return json(rows[0]);
    }

    if (request.method === "POST" && path === "/seller-activities") {
      const body = await request.json();
      if (!body.lead_id || !clean(body.body)) return json({ error: "Prospect et compte rendu requis" }, 400);
      const rows = await database("seller_diagnostic_activities", { method: "POST", body: JSON.stringify({ lead_id: body.lead_id, kind: clean(body.kind, 80) || "contact_note", body: clean(body.body, 2000), due_at: body.due_at || null, metadata: { channel: clean(body.channel, 40) || null } }) });
      await audit(request, "seller_activity_created", "seller_diagnostic", body.lead_id, { activity_id: rows[0].id });
      return json(rows[0], 201);
    }

    const landMatch = path.match(/^\/lands\/([0-9a-f-]+)$/i);
    if (request.method === "PATCH" && landMatch) {
      const body = await request.json();
      const allowed: Record<string, unknown> = {};
      for (const key of ["pipeline", "priority", "priority_level", "next_action", "next_follow_up", "assigned_to"]) {
        if (key in body) allowed[key] = body[key] || null;
      }
      allowed.updated_at = new Date().toISOString();
      const rows = await database(`foncier_land_leads?id=eq.${encodeURIComponent(landMatch[1])}`, {
        method: "PATCH",
        body: JSON.stringify(allowed),
      });
      await audit(request, "land_updated", "land", landMatch[1], { fields: Object.keys(allowed) });
      return json(rows[0]);
    }

    if (request.method === "POST" && path === "/activities") {
      const body = await request.json();
      if (!body.lead_id || !clean(body.body)) return json({ error: "Prospect et compte rendu requis" }, 400);
      const rows = await database("foncier_activities", {
        method: "POST",
        body: JSON.stringify({
          land_id: body.lead_id,
          lead_id: body.lead_id,
          kind: clean(body.kind, 80) || "contact_note",
          reason: clean(body.reason, 200) || "Historique commercial",
          body: clean(body.body, 2000),
          due_at: body.due_at || null,
          completed_at: body.completed ? new Date().toISOString() : null,
          metadata: { channel: clean(body.channel, 40) || null },
        }),
      });
      await audit(request, "activity_created", "land", body.lead_id, { activity_id: rows[0].id });
      return json(rows[0], 201);
    }

    const activityMatch = path.match(/^\/activities\/([0-9a-f-]+)\/complete$/i);
    if (request.method === "PATCH" && activityMatch) {
      const rows = await database(`foncier_activities?id=eq.${encodeURIComponent(activityMatch[1])}`, {
        method: "PATCH",
        body: JSON.stringify({ completed_at: new Date().toISOString() }),
      });
      await audit(request, "activity_completed", "activity", activityMatch[1]);
      return json(rows[0]);
    }

    return json({ error: "Route inconnue" }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: "Erreur serveur" }, 500);
  }
});
