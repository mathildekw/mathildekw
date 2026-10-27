import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

type JsonRecord = Record<string, unknown>;

const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const allowedOrigin = Deno.env.get("VISIT_ALLOWED_ORIGIN") || "https://mathildekw.com";
const frontendBaseUrl = (Deno.env.get("FRONTEND_BASE_URL") || "https://mathildekw.com").replace(/\/+$/, "");
const tallySecret = Deno.env.get("TALLY_TERRAIN_WEBHOOK_SECRET") || "";
const tallyFormId = Deno.env.get("TALLY_TERRAIN_FORM_ID") || "RWGO0j";
const ipPepper = Deno.env.get("VISIT_EVIDENCE_PEPPER") || "";
const emailWebhookUrl = Deno.env.get("VISIT_EMAIL_WEBHOOK_URL") || "";
const emailWebhookSecret = Deno.env.get("VISIT_EMAIL_WEBHOOK_SECRET") || "";
const cronSecret = Deno.env.get("FONCIER_CRON_SECRET") || "";
const certificateBucket = "visit-certificates";

const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,tally-signature",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

const property = {
  reference: "ET1605",
  label: "Terrain professionnel à Punaauia"
};

const consentText = "Je confirme avoir lu le bon de présentation et de visite, demander la présentation du bien référencé ET1605 et accepter que cette validation électronique soit conservée comme preuve de ma demande. Ce document n'est ni un mandat, ni une offre d'achat, ni une promesse de vente et ne crée aucune obligation de payer une commission.";

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function clean(value: unknown, max = 500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function sha256(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as JsonRecord).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function database(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Database ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function verifyTallySignature(rawBody: string, suppliedSignature: string) {
  if (!tallySecret || !suppliedSignature) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(tallySecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  const expected = bytesToBase64(signature);
  if (expected.length !== suppliedSignature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
  return difference === 0;
}

function tallyFields(payload: JsonRecord) {
  const data = (payload.data || {}) as JsonRecord;
  const fields = Array.isArray(data.fields) ? data.fields as JsonRecord[] : [];
  const result = new Map<string, string>();
  for (const field of fields) {
    const label = clean(field.label, 200).toLowerCase();
    let value = field.value;
    if (Array.isArray(value)) value = value.join(", ");
    const options = Array.isArray(field.options) ? field.options as JsonRecord[] : [];
    if (options.length) {
      const selected = new Set(Array.isArray(field.value) ? field.value.map(String) : [String(field.value ?? "")]);
      const labels = options.filter((option) => selected.has(String(option.id))).map((option) => clean(option.text || option.label, 200));
      if (labels.length) value = labels.join(", ");
    }
    result.set(label, clean(value, 2000));
  }
  return result;
}

function field(fields: Map<string, string>, fragment: string) {
  const match = [...fields.entries()].find(([label]) => label.includes(fragment));
  return match?.[1] || "";
}

function canonicalDocument(row: JsonRecord) {
  return {
    version: "visit-et1605-v1",
    title: "Bon de présentation et de visite",
    agency: "Keller Williams Polynésie / Mathilde TUDURI",
    propertyReference: property.reference,
    propertyLabel: property.label,
    prospect: {
      fullName: clean(row.full_name, 120),
      email: clean(row.email, 180).toLowerCase(),
      phone: clean(row.phone, 80),
      company: clean(row.company, 160)
    },
    clauses: [
      "Le prospect demande à recevoir une présentation confidentielle du bien identifié par la référence ET1605.",
      "La localisation précise et les informations confidentielles restent réservées à la personne identifiée.",
      "Ce document atteste la demande de présentation. Il ne constitue ni un mandat, ni une offre d'achat, ni une promesse de vente.",
      "Le présent document ne met aucune commission à la charge du prospect.",
      "Les données sont utilisées pour traiter la demande, assurer le suivi commercial et conserver la preuve de la validation."
    ],
    consentText
  };
}

async function sendMagicLink(row: JsonRecord) {
  const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: row.email,
      create_user: true,
      data: { visit_signature_request_id: row.id },
      email_redirect_to: `${frontendBaseUrl}/signature-bon-visite.html?request=${row.id}`
    })
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Auth email ${response.status}: ${text.slice(0, 300)}`);
}

async function markEmailAttempt(row: JsonRecord) {
  const attempts = Number(row.email_attempts || 0) + 1;
  try {
    await sendMagicLink(row);
    await database(`visit_signature_requests?id=eq.${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "email_sent", email_sent_at: new Date().toISOString(), email_attempts: attempts, next_email_attempt_at: null, delivery_error: null, updated_at: new Date().toISOString() })
    });
    return true;
  } catch (error) {
    const retryAt = new Date(Date.now() + 35 * 60 * 1000).toISOString();
    await database(`visit_signature_requests?id=eq.${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "email_error", email_attempts: attempts, next_email_attempt_at: attempts < 8 ? retryAt : null, delivery_error: clean(error, 500), updated_at: new Date().toISOString() })
    });
    return false;
  }
}

async function retryPendingEmails(request: Request) {
  if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) return reply({ error: "Non autorisé." }, 401);
  const now = encodeURIComponent(new Date().toISOString());
  const rows = await database(`visit_signature_requests?status=in.(email_pending,email_error)&email_attempts=lt.8&or=(next_email_attempt_at.is.null,next_email_attempt_at.lte.${now})&select=*&order=created_at.asc&limit=1`, { method: "GET" });
  if (!rows.length) return reply({ ok: true, processed: 0 });
  const sent = await markEmailAttempt(rows[0]);
  return reply({ ok: true, processed: 1, sent });
}

async function tallyWebhook(request: Request) {
  const rawBody = await request.text();
  if (!await verifyTallySignature(rawBody, request.headers.get("tally-signature") || "")) return reply({ error: "Signature Tally invalide" }, 401);
  const payload = JSON.parse(rawBody) as JsonRecord;
  const data = (payload.data || {}) as JsonRecord;
  if (clean(data.formId, 80) !== tallyFormId) return reply({ ok: true, ignored: true });
  const eventId = clean(payload.eventId, 160);
  const submissionId = clean(data.submissionId || data.responseId, 160);
  if (!eventId) return reply({ error: "Événement Tally incomplet" }, 400);

  const existing = (await database(`visit_signature_requests?source=eq.tally&source_event_id=eq.${encodeURIComponent(eventId)}&select=*&limit=1`, { method: "GET" }))[0];
  if (existing && ["email_sent", "opened", "signed", "delivery_pending", "delivered"].includes(existing.status)) return reply({ ok: true, duplicate: true });

  const fields = tallyFields(payload);
  const fullName = field(fields, "nom et prénom") || field(fields, "nom et prenom");
  const email = field(fields, "adresse e-mail").toLowerCase() || field(fields, "adresse email").toLowerCase();
  const phone = field(fields, "numéro de téléphone") || field(fields, "numero de telephone");
  if (!fullName || !isEmail(email)) return reply({ error: "Nom ou email manquant dans le formulaire" }, 400);

  let row = existing;
  if (!row) {
    const draft: JsonRecord = {
      source: "tally",
      source_event_id: eventId,
      source_submission_id: submissionId || null,
      property_reference: property.reference,
      property_label: property.label,
      full_name: fullName,
      email,
      phone: phone || null,
      company: field(fields, "société") || field(fields, "organisation") || null,
      prospect_role: field(fields, "qualité") || null,
      project_description: field(fields, "décrivez") || null,
      project_deadline: field(fields, "échéance") || null,
      prior_sale_required: field(fields, "vente préalable") || null,
      status: "email_pending"
    };
    const documentPayload = canonicalDocument(draft);
    draft.document_payload = documentPayload;
    draft.document_hash = await sha256(stableStringify(documentPayload));
    row = (await database("visit_signature_requests", { method: "POST", body: JSON.stringify(draft) }))[0];
  }

  const sent = await markEmailAttempt(row);
  return reply({ ok: true, email: sent ? "sent" : "queued" }, sent ? 200 : 202);
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: authorization } });
  if (!response.ok) return null;
  return await response.json() as JsonRecord;
}

async function ownedRequest(request: Request, requestId: string) {
  const user = await authenticatedUser(request);
  const userEmail = clean(user?.email, 180).toLowerCase();
  if (!userEmail || !isUuid(requestId)) return null;
  const row = (await database(`visit_signature_requests?id=eq.${encodeURIComponent(requestId)}&select=*&limit=1`, { method: "GET" }))[0];
  if (!row || clean(row.email, 180).toLowerCase() !== userEmail) return null;
  return row as JsonRecord;
}

async function readDocument(body: JsonRecord, request: Request) {
  const requestId = clean(body.requestId, 80);
  const row = await ownedRequest(request, requestId);
  if (!row) return reply({ error: "Lien invalide ou adresse email non vérifiée." }, 403);
  if (!row.opened_at) await database(`visit_signature_requests?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ status: row.status === "email_sent" ? "opened" : row.status, opened_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
  return reply({ ok: true, requestId: row.id, status: row.status, document: row.document_payload, documentHash: row.document_hash, signerName: row.signer_name || null, signedAt: row.signed_at || null });
}

function wrap(text: string, width = 88) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width) { lines.push(line); line = word; } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}

async function createCertificatePdf(row: JsonRecord, evidence: JsonRecord) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText("CERTIFICAT DE VALIDATION ELECTRONIQUE", { x: 54, y: 785, size: 16, font: bold, color: rgb(0.03, 0.19, 0.18) });
  page.drawText("Bon de presentation et de visite - ET1605", { x: 54, y: 755, size: 12, font: bold });
  const entries = [
    `Signataire : ${clean(row.full_name, 120)}`,
    `Email verifie : ${clean(row.email, 180)}`,
    `Date UTC : ${clean(row.signed_at, 80)}`,
    `Reference du bien : ${property.reference}`,
    `Version du document : ${clean(row.document_version, 80)}`,
    `Empreinte SHA-256 du document : ${clean(row.document_hash, 80)}`,
    `Empreinte SHA-256 du dossier de preuve : ${clean(evidence.evidenceHash, 80)}`
  ];
  let y = 715;
  for (const entry of entries) {
    for (const line of wrap(entry, 76)) { page.drawText(line, { x: 54, y, size: 10, font: regular }); y -= 16; }
    y -= 5;
  }
  y -= 12;
  page.drawText("Declaration acceptee", { x: 54, y, size: 12, font: bold });
  y -= 22;
  for (const line of wrap(consentText, 88)) { page.drawText(line, { x: 54, y, size: 9, font: regular }); y -= 14; }
  y -= 20;
  page.drawText("Ce certificat accompagne le document electronique conserve par l'agence.", { x: 54, y, size: 9, font: regular });
  page.drawText("Il ne constitue ni un mandat, ni une offre d'achat, ni une promesse de vente.", { x: 54, y: y - 15, size: 9, font: regular });
  return new Uint8Array(await pdf.save());
}

async function uploadCertificate(path: string, pdf: Uint8Array) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${certificateBucket}/${path}`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/pdf", "x-upsert": "true" },
    body: pdf
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Storage ${response.status}: ${text.slice(0, 300)}`);
}

async function deliverCertificate(row: JsonRecord, pdf: Uint8Array) {
  if (!emailWebhookUrl) return { status: "not_configured", error: "Envoi final non configuré" };
  const response = await fetch(emailWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-PK-Secret": emailWebhookSecret },
    body: JSON.stringify({
      kind: "signed_visit_certificate",
      to: row.email,
      ccOwner: true,
      subject: `Ton bon de présentation signé — ${property.label}`,
      fileName: `bon-visite-${property.reference}.pdf`,
      pdfBase64: bytesToBase64(pdf),
      requestId: row.id
    })
  });
  const text = await response.text();
  if (!response.ok) return { status: "failed", error: `Email ${response.status}: ${text.slice(0, 300)}` };
  return { status: "sent", error: null };
}

async function signDocument(body: JsonRecord, request: Request) {
  const requestId = clean(body.requestId, 80);
  const row = await ownedRequest(request, requestId);
  if (!row) return reply({ error: "Lien invalide ou adresse email non vérifiée." }, 403);
  if (row.signed_at) return reply({ ok: true, alreadySigned: true, signedAt: row.signed_at });
  const signerName = clean(body.signerName, 120);
  if (signerName.toLocaleLowerCase("fr") !== clean(row.full_name, 120).toLocaleLowerCase("fr") || body.consent !== true) return reply({ error: "Le nom complet et le consentement explicite sont obligatoires." }, 400);
  const signedAt = new Date().toISOString();
  const ip = (request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const evidence: JsonRecord = {
    requestId: row.id,
    documentVersion: row.document_version,
    documentHash: row.document_hash,
    signerName,
    signerEmail: row.email,
    signedAt,
    consentText,
    ipHash: await sha256(`${ipPepper}:${ip}`),
    userAgent: clean(request.headers.get("user-agent"), 500)
  };
  evidence.evidenceHash = await sha256(stableStringify(evidence));
  const path = `${property.reference}/${row.id}/certificat-validation.pdf`;
  const updated = (await database(`visit_signature_requests?id=eq.${row.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "signed",
      signed_at: signedAt,
      signer_name: signerName,
      signer_email: row.email,
      consent_text: consentText,
      signer_ip_hash: evidence.ipHash,
      signer_user_agent: evidence.userAgent,
      evidence_hash: evidence.evidenceHash,
      evidence_payload: evidence,
      certificate_storage_path: path,
      updated_at: signedAt
    })
  }))[0];
  const pdf = await createCertificatePdf(updated, evidence);
  await uploadCertificate(path, pdf);
  const delivery = await deliverCertificate(updated, pdf);
  await database(`visit_signature_requests?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ status: delivery.status === "sent" ? "delivered" : "delivery_pending", delivery_status: delivery.status, delivery_error: delivery.error, updated_at: new Date().toISOString() }) });
  return reply({ ok: true, signedAt, delivery: delivery.status, certificateBase64: bytesToBase64(pdf), fileName: `bon-visite-${property.reference}.pdf` });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!supabaseUrl || !serviceKey || !anonKey) return reply({ error: "Backend non configuré." }, 500);
  try {
    const action = new URL(request.url).pathname.split("/").filter(Boolean).pop();
    if (request.method === "POST" && action === "tally-webhook") return await tallyWebhook(request);
    if (request.method === "POST" && action === "retry-email") return await retryPendingEmails(request);
    if (request.method !== "POST") return reply({ error: "Méthode non autorisée." }, 405);
    const body = await request.json().catch(() => ({})) as JsonRecord;
    if ((body.action || action) === "document") return await readDocument(body, request);
    if ((body.action || action) === "sign") return await signDocument(body, request);
    return reply({ error: "Action inconnue." }, 404);
  } catch (error) {
    console.error(error);
    return reply({ error: "Erreur serveur." }, 500);
  }
});
