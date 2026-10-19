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

const valuationReply = "Je ne peux pas estimer sérieusement un bien ni donner un prix à partir d’une conversation : il faut vérifier ses caractéristiques, son état, son emplacement et les références de marché pertinentes. Tu peux demander une estimation personnalisée à Mathilde depuis la page Estimer ; elle analysera ton bien avant de te communiquer une fourchette argumentée.";

const approvedReplies: Record<string, string> = {
  SELL: "Pour préparer une vente, le site te propose le parcours Vendre, une demande d’estimation et le diagnostic « Pourquoi mon bien ne se vend pas ? ». Je peux t’aider à choisir le bon parcours, mais Mathilde devra étudier ton bien pour te donner un conseil personnalisé.",
  BUY: "Pour un projet d’achat, consulte la rubrique Acheter et les biens présentés sur le site. Tu peux aussi déposer tes critères de recherche afin que Mathilde puisse reprendre personnellement ta demande.",
  ESTIMATE: valuationReply,
  LAND: "Pour un terrain, consulte Foncier & Promotion afin de demander un bilan de potentiel foncier. Le site présente aussi un diagnostic dédié, sans conclure automatiquement à une constructibilité, une rentabilité ou une autorisation.",
  DIVIDE: "Le parcours « Puis-je diviser mon terrain à Tahiti ? » recueille les premières informations utiles. Son résultat reste indicatif : le PGA, les accès, les servitudes, les réseaux, le bornage et les vérifications professionnelles restent nécessaires.",
  FINANCE: "Le site propose un simulateur indicatif de capacité d’emprunt. Il ne constitue ni un accord bancaire ni une offre de crédit ; un professionnel doit confirmer le financement et les conditions applicables.",
  JOIN: "La rubrique Nous rejoindre présente les parcours disponibles pour découvrir Keller Williams Polynésie et transmettre une candidature ou une demande de contact.",
  LISTINGS: "Tu peux consulter les biens actuellement présentés dans la rubrique Acheter. Pour vérifier une disponibilité ou organiser une visite, transmets ta demande à Mathilde depuis la fiche du bien ou la page Contact.",
  CONTACT: "Tu peux joindre directement Mathilde depuis la page Contact pour une réponse personnalisée, une demande de rendez-vous ou l’étude de ton projet.",
  UNKNOWN: "Je n’ai pas d’information vérifiée sur ce point dans le contenu de mathildekw.com. Pour éviter de t’induire en erreur, je préfère ne pas improviser : contacte directement Mathilde depuis la page Contact."
};

const approvedActions: Record<string, { label: string; href: string }> = {
  SELL: { label: "Découvrir le parcours Vendre", href: "/vendre-bien-immobilier-tahiti.html" },
  BUY: { label: "Commencer ma recherche", href: "/acheter-bien-immobilier-tahiti.html" },
  ESTIMATE: { label: "Demander mon estimation", href: "/estimation-immobiliere-tahiti.html" },
  LAND: { label: "Découvrir Foncier & Promotion", href: "/foncier-promotion.html" },
  DIVIDE: { label: "Tester le diagnostic division", href: "/diviser-terrain-tahiti.html" },
  FINANCE: { label: "Calculer ma capacité", href: "/capacite-emprunt-polynesie.html" },
  JOIN: { label: "Découvrir Nous rejoindre", href: "/nous-rejoindre/" },
  LISTINGS: { label: "Voir les biens", href: "/biens-a-vendre-tahiti.html" },
  CONTACT: { label: "Contacter Mathilde", href: "/contact.html" },
  UNKNOWN: { label: "Poser ma demande à Mathilde", href: "/contact.html" }
};

function isValuationRequest(value: string) {
  return /(?:estim(?:e|er|ation)|combien\s+(?:vaut|coûte)|quel(?:le)?\s+(?:prix|valeur)|valeur\s+(?:de|du|d['’]une?))/i.test(value);
}

function containsUnverifiedPrice(value: string) {
  return /(?:\b\d[\d\s.,]*(?:xpf|f\s*cfp|cfp|francs?|millions?|m\b|€)|(?:prix|valeur|estimation|fourchette)[^.!?]{0,50}\b\d[\d\s.,]*)/i.test(value);
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
    const latestQuestion = messages[messages.length - 1].content;
    if (isValuationRequest(latestQuestion)) return json({ answer: valuationReply, action: approvedActions.ESTIMATE, guarded: "valuation", grounded: true });
    const systemPrompt = "Classe le message dans UNE seule catégorie parmi SELL, BUY, ESTIMATE, LAND, DIVIDE, FINANCE, JOIN, LISTINGS, CONTACT, UNKNOWN. Réponds uniquement avec le nom exact de la catégorie, sans phrase ni ponctuation. ESTIMATE couvre toute demande de prix ou valeur d’un bien. UNKNOWN s’applique dès que la demande ne concerne pas clairement une page ou un parcours de mathildekw.com.";
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cloudflareAccountId)}/ai/run/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cloudflareToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 12,
        temperature: 0
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Cloudflare Workers AI", response.status, JSON.stringify(data).slice(0, 500));
      const quotaReached = response.status === 429 || data?.errors?.some((error: Record<string, unknown>) => /quota|limit/i.test(String(error.message || "")));
      return json({ error: quotaReached ? "Le quota gratuit du jour est atteint" : "Assistant momentanément indisponible", fallback: "contact" }, quotaReached ? 429 : 502);
    }
    const category = clean(data.result?.response, 30).toUpperCase().replace(/[^A-Z]/g, "");
    const answer = approvedReplies[category] || approvedReplies.UNKNOWN;
    if (containsUnverifiedPrice(answer)) return json({ answer: approvedReplies.UNKNOWN, action: approvedActions.UNKNOWN, guarded: "price", grounded: true });
    return json({ answer, action: approvedActions[category] || approvedActions.UNKNOWN, category, grounded: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Assistant momentanément indisponible" }, 500);
  }
});
