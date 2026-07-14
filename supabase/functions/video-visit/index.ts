type VisitRequest = {
  action?: string;
  reference?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  project?: string;
  financingStatus?: string;
  message?: string;
  requestId?: string;
  accessToken?: string;
  inviteToken?: string;
  invitationType?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-documenso-signature",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const properties: Record<string, { label: string; videoPath: string }> = {
  "979": { label: "T2 Punaauia", videoPath: "979/video-6d8f3c9a.m4v" },
  "971": { label: "T3 Punaauia", videoPath: "971/video-b4e2a917.m4v" },
  "888": { label: "T2 Paofai", videoPath: "888/video-91c7ad35.m4v" }
};

function env(name: string, fallback = "") {
  return Deno.env.get(name) || fallback;
}

const supabaseUrl = env("SUPABASE_URL").replace(/\/+$/, "");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY") || env("SERVICE_ROLE_KEY");
const bucket = env("SUPABASE_VIDEO_BUCKET") || env("VIDEO_BUCKET", "property-videos");
const documensoToken = env("DOCUMENSO_API_TOKEN");
const documensoApiBaseUrl = env("DOCUMENSO_API_BASE_URL", "https://app.documenso.com/api/v1").replace(/\/+$/, "");
const documensoTemplateId = env("DOCUMENSO_TEMPLATE_ID");
const documensoTemplateRecipientId = Number(env("DOCUMENSO_TEMPLATE_RECIPIENT_ID", "2821345"));
const frontendBaseUrl = env("FRONTEND_BASE_URL", "https://mathildekw.com").replace(/\/+$/, "");
const signedUrlExpiresIn = Number(env("VIDEO_LINK_EXPIRES_SECONDS", "10368000"));
const inviteExpiresIn = Number(env("VIDEO_INVITE_EXPIRES_SECONDS", "2592000"));
const adminSecret = env("VIDEO_VISIT_ADMIN_SECRET");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function clean(value: unknown, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text}`);
  return data;
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createDocumensoSignature(row: Record<string, unknown>) {
  if (!documensoToken || !documensoTemplateId) {
    return { skipped: true, reason: "Documenso non configure" };
  }

  const payload = {
    title: `Bon de visite video - Bien ${row.property_reference}`,
    externalId: String(row.id),
    recipients: [
      {
        id: documensoTemplateRecipientId,
        name: row.full_name,
        email: row.email
      }
    ],
    meta: {
      subject: `Bon de visite video - Bien ${row.property_reference}`,
      message: "Ia ora na, merci de signer ce bon de visite video afin de recevoir l'acces a la visite video du bien concerne.",
      timezone: "Pacific/Tahiti",
      dateFormat: "dd/MM/yyyy HH:mm",
      language: "fr",
      signingOrder: "PARALLEL",
      distributionMethod: "EMAIL",
      typedSignatureEnabled: true,
      uploadSignatureEnabled: true,
      drawSignatureEnabled: true
    },
    formValues: {
      fullName: row.full_name,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      postal_address: "",
      postal_code: "",
      city: "",
      country: "",
      propertyReference: row.property_reference,
      property_reference: row.property_reference,
      propertyLabel: row.property_label,
      property_label: row.property_label,
      property_area: row.property_label,
      request_date: new Date(String(row.created_at || Date.now())).toLocaleDateString("fr-FR", { timeZone: "Pacific/Tahiti" }),
      request_time: new Date(String(row.created_at || Date.now())).toLocaleTimeString("fr-FR", { timeZone: "Pacific/Tahiti", hour: "2-digit", minute: "2-digit" }),
      signed_date: "",
      signed_time: ""
    }
  };

  const response = await fetch(`${documensoApiBaseUrl}/templates/${encodeURIComponent(documensoTemplateId)}/generate-document`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${documensoToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`Documenso ${response.status}: ${text}`);

  const documentId = String(data.documentId || data.document?.id || data.id || "");

  return {
    documentId,
    recipientId: String(data.recipients?.[0]?.recipientId || data.recipients?.[0]?.id || data.recipientId || ""),
    signingUrl: String(data.recipients?.[0]?.signingUrl || "")
  };
}

async function findValidInvitation(inviteToken: string, reference: string) {
  const tokenHash = await sha256(inviteToken);
  const rows = await supabaseFetch(`/rest/v1/video_visit_invitations?token_hash=eq.${tokenHash}&property_reference=eq.${encodeURIComponent(reference)}&select=*`, {
    method: "GET"
  });

  const invitation = rows[0];
  if (!invitation) return null;
  if (invitation.revoked_at) return null;
  if (new Date(invitation.expires_at).getTime() < Date.now()) return null;

  await supabaseFetch(`/rest/v1/video_visit_invitations?id=eq.${invitation.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      opened_at: invitation.opened_at || new Date().toISOString(),
      last_opened_at: new Date().toISOString()
    })
  });

  return invitation;
}

async function requestSignature(body: VisitRequest) {
  const reference = clean(body.reference, 12);
  const property = properties[reference];
  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 80);

  if (!property) return json({ error: "Bien inconnu." }, 400);
  const invitation = await findValidInvitation(clean(body.inviteToken, 160), reference);
  if (!invitation) {
    return json({ error: "Lien prive invalide, expire ou revoque. Contacte Mathilde pour recevoir une nouvelle invitation." }, 403);
  }

  if (!fullName || !email || !phone || !isEmail(email)) {
    return json({ error: "Nom, email et telephone sont obligatoires." }, 400);
  }

  const rows = await supabaseFetch("/rest/v1/video_visit_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      invitation_id: invitation.id,
      property_reference: reference,
      property_label: property.label,
      video_path: property.videoPath,
      full_name: fullName,
      email,
      phone,
      project: clean(body.project, 160),
      financing_status: clean(body.financingStatus, 160),
      message: clean(body.message, 1000),
      status: "pending"
    })
  });

  const row = rows[0];
  let signature = null;

  try {
    signature = await createDocumensoSignature(row);
    if ("documentId" in signature && signature.documentId) {
      await supabaseFetch(`/rest/v1/video_visit_requests?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "signature_sent",
          documenso_document_id: signature.documentId,
          documenso_recipient_id: signature.recipientId || null,
          updated_at: new Date().toISOString()
        })
      });
    }
  } catch (error) {
    console.error(error);
  }

  return json({
    ok: true,
    requestId: row.id,
    status: signature && "documentId" in signature && signature.documentId ? "signature_sent" : "pending_manual_signature",
    signingUrl: signature && "signingUrl" in signature ? signature.signingUrl : "",
    message: "Demande recue. Le lien video sera disponible uniquement apres signature."
  });
}

function extractDocumensoDocumentId(payload: Record<string, unknown>) {
  const document = payload.document as Record<string, unknown> | undefined;
  return String(
    payload.documentId ||
    payload.document_id ||
    payload.id ||
    document?.id ||
    ""
  );
}

function isSignedPayload(payload: Record<string, unknown>) {
  const event = String(payload.event || payload.type || payload.status || "").toLowerCase();
  const document = payload.document as Record<string, unknown> | undefined;
  const documentStatus = String(document?.status || "").toLowerCase();
  return event.includes("complete") || event.includes("signed") || documentStatus.includes("complete") || documentStatus.includes("signed");
}

async function documensoWebhook(request: Request) {
  const payload = await request.json().catch(() => ({}));
  if (!isSignedPayload(payload)) return json({ ok: true, ignored: true });

  const documentId = extractDocumensoDocumentId(payload);
  if (!documentId) return json({ error: "Document Documenso introuvable." }, 400);

  const token = randomToken();
  const tokenHash = await sha256(token);
  const accessExpiresAt = new Date(Date.now() + signedUrlExpiresIn * 1000).toISOString();

  const rows = await supabaseFetch(`/rest/v1/video_visit_requests?documenso_document_id=eq.${encodeURIComponent(documentId)}&select=*`, {
    method: "GET"
  });

  if (!rows.length) return json({ ok: true, ignored: true });
  const row = rows[0];

  await supabaseFetch(`/rest/v1/video_visit_requests?id=eq.${row.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "signed",
      signed_at: new Date().toISOString(),
      access_token_hash: tokenHash,
      access_expires_at: accessExpiresAt,
      updated_at: new Date().toISOString()
    })
  });

  return json({
    ok: true,
    requestId: row.id,
    accessUrl: `${frontendBaseUrl}/demande-visite-video.html?request=${row.id}&token=${token}`
  });
}

async function signedAccess(body: VisitRequest) {
  const requestId = clean(body.requestId, 80);
  const accessToken = clean(body.accessToken, 160);
  if (!requestId || !accessToken) return json({ error: "Lien incomplet." }, 400);
  if (!isUuid(requestId)) return json({ error: "La video sera disponible apres signature du bon de visite." }, 403);

  const tokenHash = await sha256(accessToken);
  const rows = await supabaseFetch(`/rest/v1/video_visit_requests?id=eq.${encodeURIComponent(requestId)}&select=*`, {
    method: "GET"
  });

  const row = rows[0];
  if (!row || !["signed", "access_sent"].includes(row.status) || row.access_token_hash !== tokenHash) {
    return json({ error: "La video sera disponible apres signature du bon de visite." }, 403);
  }

  if (row.access_expires_at && new Date(row.access_expires_at).getTime() < Date.now()) {
    return json({ error: "Ce lien d'acces a expire." }, 403);
  }

  const signResponse = await supabaseFetch(
    `/storage/v1/object/sign/${encodeURIComponent(bucket)}/${String(row.video_path).split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      body: JSON.stringify({ expiresIn: signedUrlExpiresIn })
    }
  );

  const signedPath = signResponse.signedURL || signResponse.signedUrl || signResponse.signed_url;
  const signedUrl = String(signedPath).startsWith("http") ? signedPath : `${supabaseUrl}/storage/v1${signedPath}`;

  await supabaseFetch(`/rest/v1/video_visit_requests?id=eq.${row.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "access_sent",
      access_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });

  return json({ ok: true, signedUrl, expiresIn: signedUrlExpiresIn });
}

async function adminMarkSigned(body: VisitRequest, request: Request) {
  if (!adminSecret || request.headers.get("x-admin-secret") !== adminSecret) {
    return json({ error: "Non autorise." }, 401);
  }

  const requestId = clean(body.requestId, 80);
  if (!isUuid(requestId)) return json({ error: "Demande introuvable." }, 404);
  const rows = await supabaseFetch(`/rest/v1/video_visit_requests?id=eq.${encodeURIComponent(requestId)}&select=*`, { method: "GET" });
  if (!rows.length) return json({ error: "Demande introuvable." }, 404);

  const token = randomToken();
  const tokenHash = await sha256(token);
  const accessExpiresAt = new Date(Date.now() + signedUrlExpiresIn * 1000).toISOString();

  await supabaseFetch(`/rest/v1/video_visit_requests?id=eq.${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "signed",
      signed_at: new Date().toISOString(),
      access_token_hash: tokenHash,
      access_expires_at: accessExpiresAt,
      updated_at: new Date().toISOString()
    })
  });

  return json({ ok: true, accessUrl: `${frontendBaseUrl}/demande-visite-video.html?request=${requestId}&token=${token}` });
}

async function adminCreateInvitation(body: VisitRequest, request: Request) {
  if (!adminSecret || request.headers.get("x-admin-secret") !== adminSecret) {
    return json({ error: "Non autorise." }, 401);
  }

  const reference = clean(body.reference, 12);
  const property = properties[reference];
  if (!property) return json({ error: "Bien inconnu." }, 400);

  const token = randomToken();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + inviteExpiresIn * 1000).toISOString();
  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phone = clean(body.phone, 80);
  const invitationType = fullName || email || phone ? "nominative" : clean(body.invitationType, 24) || "generic";

  const rows = await supabaseFetch("/rest/v1/video_visit_invitations", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      property_reference: reference,
      property_label: property.label,
      invitation_type: invitationType === "nominative" ? "nominative" : "generic",
      token_hash: tokenHash,
      prospect_full_name: fullName || null,
      prospect_email: email || null,
      prospect_phone: phone || null,
      expires_at: expiresAt
    })
  });

  return json({
    ok: true,
    invitationId: rows[0].id,
    invitationUrl: `${frontendBaseUrl}/demande-visite-video.html?ref=${reference}&invite=${token}`,
    expiresAt
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Backend non configure." }, 500);
  }

  const url = new URL(request.url);
  const pathAction = url.pathname.split("/").filter(Boolean).pop();

  try {
    if (request.method === "POST" && pathAction === "documenso-webhook") {
      return await documensoWebhook(request);
    }

    const body = await request.json().catch(() => ({})) as VisitRequest;
    const action = body.action || pathAction;

    if (request.method === "POST" && action === "request-signature") return await requestSignature(body);
    if (request.method === "POST" && action === "access") return await signedAccess(body);
    if (request.method === "POST" && action === "admin-create-invitation") return await adminCreateInvitation(body, request);
    if (request.method === "POST" && action === "admin-mark-signed") return await adminMarkSigned(body, request);

    return json({ error: "Action inconnue." }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: "Erreur serveur." }, 500);
  }
});
