const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const cronSecret = Deno.env.get("FONCIER_CRON_SECRET") || "";
const sheetsUrl = Deno.env.get("FONCIER_GOOGLE_SHEETS_WEBHOOK") || "";
const sheetsSecret = Deno.env.get("FONCIER_GOOGLE_SHEETS_SECRET") || "";

function output(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
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
  if (!response.ok) throw new Error(text.slice(0, 500));
  return text ? JSON.parse(text) : null;
}

async function rpc(name: string, body: unknown = {}) {
  return database(`rpc/${name}`, { method: "POST", body: JSON.stringify(body) });
}

async function processOutbox() {
  if (!sheetsUrl) return { status: "not_connected", processed: 0 };
  const items = await rpc("claim_foncier_outbox", { batch_size: 20 });
  const results = [];
  for (const item of items || []) {
    try {
      const url = new URL(sheetsUrl);
      if (sheetsSecret && !url.searchParams.has("secret")) url.searchParams.set("secret", sheetsSecret);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-PK-Secret": sheetsSecret, "Idempotency-Key": item.idempotency_key },
        body: JSON.stringify(item.payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.ok !== true) throw new Error(body.error || `HTTP ${response.status}`);
      await database(`foncier_integration_outbox?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "delivered", delivered_at: new Date().toISOString(), last_error: null }),
      });
      results.push({ id: item.id, status: "delivered" });
    } catch (error) {
      const dead = item.attempts >= 8;
      const minutes = Math.min(1440, Math.pow(2, Math.max(0, item.attempts - 1)) * 5);
      await database(`foncier_integration_outbox?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: dead ? "dead" : "failed",
          next_attempt_at: new Date(Date.now() + minutes * 60000).toISOString(),
          last_error: String(error).slice(0, 500),
        }),
      });
      results.push({ id: item.id, status: dead ? "dead" : "failed" });
    }
  }
  return { status: "processed", processed: results.length, results };
}

Deno.serve(async (request) => {
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) return output({ error: "Non autorisé" }, 401);
  try {
    const [followups, sellerFollowups] = await Promise.all([rpc("generate_foncier_due_followups"), rpc("generate_seller_diagnostic_followups")]);
    const sheets = await processOutbox();
    return output({ followups_created: Number(followups) || 0, seller_followups_created: Number(sellerFollowups) || 0, google_sheets: sheets });
  } catch (error) {
    console.error(error);
    return output({ error: String(error).slice(0, 500) }, 500);
  }
});
