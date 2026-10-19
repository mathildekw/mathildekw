const allowedOrigin = Deno.env.get("FONCIER_ALLOWED_ORIGIN") || "https://mathildekw.com";
const cloudflareAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || "";
const cloudflareToken = Deno.env.get("CLOUDFLARE_AI_API_TOKEN") || "";
const model = Deno.env.get("CLOUDFLARE_AI_MODEL") || "@cf/meta/llama-3.1-8b-instruct-fp8";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function clean(value: unknown, max = 600) { return String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max); }
function limitAnswer(value: unknown, maxWords = 120) {
  const answer = clean(value, 3000);
  const words = answer.split(/\s+/).filter(Boolean);
  const shortened = words.slice(0, maxWords).join(" ");
  if (!shortened || /[.!?](?:[\s)*_`]+)?$/.test(shortened)) return shortened;
  const sentenceEnd = Math.max(shortened.lastIndexOf(". "), shortened.lastIndexOf("! "), shortened.lastIndexOf("? "));
  return sentenceEnd > 0 ? shortened.slice(0, sentenceEnd + 1) : `${shortened}.`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!cloudflareAccountId || !cloudflareToken) return json({ error: "Assistant IA non configuré", fallback: "contact" }, 503);
  try {
    const body = await request.json();
    const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
    const messages = rawMessages.map((item: Record<string, unknown>) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: clean(item.content)
    })).filter((item: { content: string }) => item.content);
    if (!messages.length) return json({ error: "Question obligatoire" }, 400);
    const systemPrompt = "Tu es l’assistant immobilier de Mathilde TUDURI, conseillère Keller Williams Polynésie à Tahiti. Réponds en français, avec tutoiement, chaleur et concision (90 mots maximum), en terminant toujours ta réponse et sans liste trop longue. Oriente uniquement sur acheter, vendre, estimer, louer, financement indicatif, foncier et promotion. Ne prétends jamais connaître une faisabilité, un prix, une règle juridique, fiscale, bancaire ou urbanistique non vérifiée. Ne demande jamais de donnée confidentielle. Lorsque le sujet nécessite une analyse personnelle, propose de contacter Mathilde via /contact.html. Mentionne clairement les incertitudes. N’invente ni bien disponible, ni partenaire, ni statistique. Ne cite aucune agence concurrente ni plateforme immobilière spécifique.";
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cloudflareAccountId)}/ai/run/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cloudflareToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 220,
        temperature: 0.35
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Cloudflare Workers AI", response.status, JSON.stringify(data).slice(0, 500));
      const quotaReached = response.status === 429 || data?.errors?.some((error: Record<string, unknown>) => /quota|limit/i.test(String(error.message || "")));
      return json({ error: quotaReached ? "Le quota gratuit du jour est atteint" : "Assistant momentanément indisponible", fallback: "contact" }, quotaReached ? 429 : 502);
    }
    const answer = limitAnswer(data.result?.response);
    if (!answer) return json({ error: "Réponse vide" }, 502);
    return json({ answer });
  } catch (error) {
    console.error(error);
    return json({ error: "Assistant momentanément indisponible" }, 500);
  }
});
