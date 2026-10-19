const allowedOrigin = Deno.env.get("FONCIER_ALLOWED_ORIGIN") || "https://mathildekw.com";
const openaiKey = Deno.env.get("OPENAI_API_KEY") || "";
const model = Deno.env.get("OPENAI_ASSISTANT_MODEL") || "gpt-5-mini";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
function clean(value: unknown, max = 600) { return String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max); }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!openaiKey) return json({ error: "Assistant IA non configuré" }, 503);
  try {
    const body = await request.json();
    const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
    const messages = rawMessages.map((item: Record<string, unknown>) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: clean(item.content)
    })).filter((item: { content: string }) => item.content);
    if (!messages.length) return json({ error: "Question obligatoire" }, 400);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: "Tu es l’assistant immobilier de Mathilde TUDURI, conseillère Keller Williams Polynésie à Tahiti. Réponds en français, avec tutoiement, chaleur et concision (120 mots maximum). Oriente uniquement sur acheter, vendre, estimer, louer, financement indicatif, foncier et promotion. Ne prétends jamais connaître une faisabilité, un prix, une règle juridique, fiscale, bancaire ou urbanistique non vérifiée. Ne demande jamais de donnée confidentielle. Lorsque le sujet nécessite une analyse personnelle, propose de contacter Mathilde via /contact.html. Mentionne clairement les incertitudes. N’invente ni bien disponible, ni partenaire, ni statistique.",
        input: messages,
        max_output_tokens: 260
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI", response.status, JSON.stringify(data).slice(0, 500));
      return json({ error: "Assistant momentanément indisponible" }, 502);
    }
    const answer = clean(data.output_text || data.output?.flatMap((item: Record<string, unknown>) => Array.isArray(item.content) ? item.content : []).map((item: Record<string, unknown>) => item.text || "").join(" "), 1600);
    if (!answer) return json({ error: "Réponse vide" }, 502);
    return json({ answer });
  } catch (error) {
    console.error(error);
    return json({ error: "Assistant momentanément indisponible" }, 500);
  }
});
