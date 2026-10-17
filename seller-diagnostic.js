import { diagnoseSeller } from "/seller-diagnostic-engine.mjs";

const form = document.querySelector("#seller-diagnostic-form");
if (form) {
  const config = window.MK_SITE_CONFIG?.sellerDiagnostic || {};
  const storageKey = "mk_seller_diagnostic_v1";
  let current = 0;
  let data = {};
  try { data = JSON.parse(localStorage.getItem(storageKey) || "{}") || {}; } catch { data = {}; }

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  const radio = (name, values) => `<div class="sd-choices">${values.map((value, index) => `<div class="sd-choice"><input id="${name}-${index}" name="${name}" value="${escapeHtml(value)}" type="radio" ${data[name] === value ? "checked" : ""}><label for="${name}-${index}">${escapeHtml(value)}</label></div>`).join("")}</div>`;
  const checks = (name, values) => `<div class="sd-choices">${values.map((value, index) => `<div class="sd-choice"><input id="${name}-${index}" name="${name}" value="${escapeHtml(value)}" type="checkbox" ${(data[name] || []).includes(value) ? "checked" : ""}><label for="${name}-${index}">${escapeHtml(value)}</label></div>`).join("")}</div>`;
  const field = (name, label, type = "text", extra = "") => `<div class="sd-field"><label for="sd-${name}">${label}</label><input id="sd-${name}" name="${name}" type="${type}" value="${escapeHtml(data[name])}" ${extra}></div>`;
  const context = () => window.MKAnalytics?.context || window.PKFunnel?.context || {};
  const consent = () => localStorage.getItem("mk_analytics_consent") === "granted";
  function sessionId() { let id = sessionStorage.getItem("mk_seller_session"); if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("mk_seller_session", id); } return id; }
  async function track(eventName, metadata = {}, leadId = null) {
    if (!config.apiUrl || !consent()) return false;
    try { const response = await fetch(`${config.apiUrl}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true, event_name: eventName, session_id: sessionId(), lead_id: leadId, page_path: location.pathname, traffic_source: context().source || "direct", utm: context().utm || {}, metadata }) }); return response.ok; } catch { return false; }
  }

  const steps = [
    { title: "Quel bien vends-tu ?", intro: "Commençons par situer le bien.", required: ["property_type", "island", "commune"], html: () => radio("property_type", ["Maison", "Appartement", "Terrain", "Autre"]) + `<div class="sd-fields sd-inline">${field("island", "Île *", "text", "required")}${field("commune", "Commune *", "text", "required")}</div>` },
    { title: "Depuis combien de temps est-il en vente ?", intro: "La durée donne du contexte, mais ne suffit jamais à conclure.", required: ["sale_duration"], html: () => radio("sale_duration", ["Moins d'un mois", "1 à 3 mois", "3 à 6 mois", "6 à 12 mois", "Plus de 12 mois"]) },
    { title: "Comment est-il commercialisé ?", intro: "Un mandat en cours doit naturellement être respecté.", required: ["sale_method", "mandate_active"], html: () => radio("sale_method", ["Je vends seul", "Une agence", "Plusieurs agences", "Mandat exclusif", "Autre", "Je préfère ne pas répondre"]) + `<p class="sd-label sd-inline">Un mandat est-il actuellement en vigueur ?</p>${radio("mandate_active", ["Oui", "Non", "Je ne sais pas"])}<div class="sd-fields sd-inline" data-mandate-details ${data.mandate_active === "Oui" ? "" : "hidden"}>${field("mandate_type", "Nature du mandat — facultatif")}${field("mandate_end_date", "Date de fin connue — facultatif", "date")}</div>` },
    { title: "Où ton bien est-il diffusé ?", intro: "Sélectionne tout ce qui correspond.", required: ["diffusion_channels"], html: () => checks("diffusion_channels", ["Sites immobiliers", "Réseaux sociaux", "Agence immobilière", "Bouche-à-oreille", "Autre", "Je ne sais pas"]) + `<p class="sd-label sd-inline">Quels supports sont disponibles ?</p>${checks("presentation_assets", ["Photos professionnelles", "Vidéo", "Visite virtuelle", "Plan", "Aucun de ces éléments"])}` },
    { title: "As-tu reçu des visites ?", intro: "Une approximation suffit.", required: ["visits_level"], html: () => radio("visits_level", ["Aucune", "Quelques visites", "Beaucoup de visites", "Je ne sais pas"]) + `<div class="sd-field sd-inline" data-visits-count ${data.visits_level && data.visits_level !== "Aucune" ? "" : "hidden"}><label for="sd-visits_count">Nombre approximatif — facultatif</label><input id="sd-visits_count" name="visits_count" type="number" min="0" inputmode="numeric" value="${escapeHtml(data.visits_count)}"></div>` },
    { title: "As-tu reçu des offres ?", intro: "La présence d'une offre et ses conditions sont des signaux importants.", required: ["offers_status"], html: () => radio("offers_status", ["Aucune", "Des offres trop basses", "Une ou plusieurs offres sérieuses", "Une offre refusée", "Une offre qui n'a pas abouti"]) + `<div class="sd-field sd-inline" data-failed-reason ${data.offers_status === "Une offre qui n'a pas abouti" ? "" : "hidden"}><label for="sd-failed_offer_reason">Raison connue — facultatif</label><textarea id="sd-failed_offer_reason" name="failed_offer_reason">${escapeHtml(data.failed_offer_reason)}</textarea></div>` },
    { title: "Quel est ton prix affiché ?", intro: "Ces informations sont facultatives et ne déclenchent aucune estimation automatique.", required: [], html: () => `<div class="sd-fields">${field("current_price_xpf", "Prix actuel en XPF", "number", "min=0 inputmode=numeric")}${field("initial_price_xpf", "Prix initial en XPF", "number", "min=0 inputmode=numeric")}${field("last_price_change", "Dernière modification", "date")}</div>` },
    { title: "Quels retours as-tu reçus ?", intro: "Plusieurs réponses sont possibles.", required: ["feedback"], html: () => checks("feedback", ["Prix trop élevé", "Travaux", "Localisation", "Surface ou configuration", "Accès", "Financement des acheteurs", "Aucun retour", "Autre", "Je ne sais pas"]) },
    { title: "Quel est ton objectif ?", intro: "Cela m'aide à comprendre ton calendrier, sans t'engager.", required: ["objective"], html: () => radio("objective", ["Vendre au plus vite", "Vendre dans les 3 mois", "Vendre dans les 6 mois", "Je ne suis pas pressé", "Je réfléchis à changer de stratégie"]) },
    { title: "Comment Mathilde peut-elle te joindre ?", intro: "Le consentement publicitaire n'est jamais nécessaire pour recevoir ton diagnostic.", required: ["first_name", "last_name", "phone", "privacy_consent"], html: () => `<input name="website" hidden tabindex="-1" autocomplete="off"><div class="sd-fields">${field("first_name", "Prénom *", "text", "required autocomplete=given-name")}${field("last_name", "Nom *", "text", "required autocomplete=family-name")}${field("phone", "Téléphone *", "tel", "required autocomplete=tel")}${field("email", "Email — facultatif", "email", "autocomplete=email")}<div class="sd-field"><label for="sd-preferred_channel">Canal préféré</label><select id="sd-preferred_channel" name="preferred_channel">${["Téléphone", "WhatsApp", "Email", "SMS"].map((value) => `<option ${data.preferred_channel === value ? "selected" : ""}>${value}</option>`).join("")}</select></div><label class="sd-check full"><input type="checkbox" name="privacy_consent" ${data.privacy_consent ? "checked" : ""}> J'accepte le traitement de ces informations pour recevoir mon diagnostic et être recontacté à ce sujet. *</label><label class="sd-check full"><input type="checkbox" name="marketing_consent" ${data.marketing_consent ? "checked" : ""}> J'accepte de recevoir occasionnellement des informations immobilières. Facultatif et révocable.</label><p class="sd-disclaimer full">Consulte la <a href="/politique-confidentialite.html" target="_blank">politique de confidentialité</a>.</p></div>` },
    { title: "Ta première analyse", intro: "Une lecture prudente à partir de tes réponses.", result: true, required: [], html: () => resultHtml(diagnoseSeller(data)) }
  ];

  function collect() {
    const formData = new FormData(form);
    [...form.querySelectorAll("input,select,textarea")].forEach((element) => {
      if (element.type === "checkbox") return;
      if (element.type === "radio" && !element.checked) return;
      if (element.name) data[element.name] = element.value;
    });
    ["diffusion_channels", "presentation_assets", "feedback"].forEach((name) => { const items = formData.getAll(name); if (form.querySelector(`[name="${name}"]`)) data[name] = items; });
    ["privacy_consent", "marketing_consent"].forEach((name) => { const element = form.elements[name]; if (element) data[name] = element.checked; });
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
  function validate(step) {
    const missing = step.required.filter((name) => {
      if (Array.isArray(data[name])) return !data[name].length;
      return name.endsWith("_consent") ? !data[name] : !String(data[name] || "").trim();
    });
    form.querySelector(".sd-error")?.remove();
    if (!missing.length) return true;
    const error = document.createElement("p"); error.className = "sd-error"; error.setAttribute("role", "alert"); error.textContent = "Merci de répondre aux champs obligatoires avant de continuer."; form.append(error); form.querySelector(`[name="${missing[0]}"]`)?.focus(); return false;
  }
  function fact(label, value) { return `<div><dt>${label}</dt><dd>${escapeHtml(value || "Non renseigné")}</dd></div>`; }
  function resultHtml(result) {
    return `<div class="sd-result"><p class="sd-kicker">Diagnostic initial</p><h2>Voici les éléments à examiner.</h2><dl class="sd-result-summary">${fact("Bien", data.property_type)}${fact("Commune", data.commune)}${fact("En vente", data.sale_duration)}${fact("Visites", data.visits_level)}${fact("Offres", data.offers_status)}${fact("Objectif", data.objective)}</dl><div class="sd-result-grid"><article class="sd-result-card"><h3>Première analyse</h3><p>${escapeHtml(result.summary)}</p></article><article class="sd-result-card"><h3>Trois pistes</h3><ul>${result.hypotheses.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article class="sd-result-card"><h3>Pour aller plus loin</h3><ul>${result.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><p class="sd-disclaimer">${escapeHtml(result.disclaimer)}</p><div class="sd-next"><h3>Et si on faisait le point ensemble sur ta stratégie de vente&nbsp;?</h3><p data-submit-status>Enregistrement sécurisé en cours…</p><div data-conversion-actions></div></div></div>`;
  }
  function bindConditional() {
    form.querySelectorAll('[name="mandate_active"]').forEach((item) => item.addEventListener("change", () => { form.querySelector("[data-mandate-details]").hidden = item.value !== "Oui"; }));
    form.querySelectorAll('[name="visits_level"]').forEach((item) => item.addEventListener("change", () => { form.querySelector("[data-visits-count]").hidden = item.value === "Aucune"; }));
    form.querySelectorAll('[name="offers_status"]').forEach((item) => item.addEventListener("change", () => { form.querySelector("[data-failed-reason]").hidden = item.value !== "Une offre qui n'a pas abouti"; }));
  }
  function render() {
    const step = steps[current];
    const progress = Math.round(current / (steps.length - 1) * 100);
    document.querySelector("[data-seller-progress]").style.width = `${progress}%`;
    document.querySelector("[data-seller-progress-label]").textContent = step.result ? "Diagnostic terminé" : `Étape ${current + 1} sur 10`;
    form.innerHTML = `<div class="sd-step"><p class="sd-kicker">${step.result ? "Analyse personnalisée" : `Étape ${current + 1}`}</p><h2>${step.title}</h2><p class="sd-intro">${step.intro}</p>${step.html()}${step.result ? "" : `<div class="sd-form-actions">${current ? '<button class="sd-back" type="button" data-back>← Retour</button>' : "<span></span>"}<button class="sd-btn primary" type="submit">Continuer →</button></div>`}</div>`;
    form.querySelector("[data-back]")?.addEventListener("click", () => { collect(); current -= 1; render(); document.querySelector("#diagnostic").scrollIntoView(); });
    bindConditional();
    if (step.result) submitLead(diagnoseSeller(data));
  }
  form.addEventListener("submit", (event) => { event.preventDefault(); collect(); if (!validate(steps[current])) return; track("step_completed", { step: current + 1 }); current += 1; render(); document.querySelector("#diagnostic").scrollIntoView(); });

  async function submitLead(diagnosis) {
    const status = form.querySelector("[data-submit-status]");
    const fingerprint = JSON.stringify([data.phone, data.email, data.property_type, data.commune, data.sale_duration, data.sale_method, data.visits_level, data.offers_status, data.objective]);
    if (data.submitted_fingerprint === fingerprint && data.submitted_uuid && data.booking_token) { status.textContent = `Dossier enregistré · ${data.submitted_reference}`; showActions(data.submitted_uuid, data.booking_token); return; }
    if (!config.apiUrl) { status.className = "sd-error"; status.textContent = "Le service sécurisé n'est pas configuré. Tes réponses restent sauvegardées sur cet appareil."; return; }
    try {
      const response = await fetch(`${config.apiUrl}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, diagnosis, acquisition: context(), submission_fingerprint: fingerprint }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      Object.assign(data, { submitted_uuid: result.id, submitted_reference: result.reference, booking_token: result.booking_token, submitted_fingerprint: fingerprint }); localStorage.setItem(storageKey, JSON.stringify(data));
      status.className = "sd-status"; status.textContent = `Dossier enregistré · ${result.reference}`; track("diagnostic_submitted", {}, result.id); track("lead_recorded", {}, result.id); showActions(result.id, result.booking_token);
    } catch (error) { status.className = "sd-error"; status.textContent = "L'enregistrement n'a pas abouti. Tes réponses restent sauvegardées sur cet appareil. Réessaie ou contacte Mathilde."; }
  }
  function showActions(leadId, bookingToken) {
    const root = form.querySelector("[data-conversion-actions]");
    root.innerHTML = `<div class="sd-actions"><button class="sd-btn primary" type="button" data-book>Demander mon audit de commercialisation gratuit</button><button class="sd-btn" type="button" data-callback>Être rappelé par Mathilde</button></div><div class="sd-inline" data-action-panel></div>`;
    root.querySelector("[data-callback]").addEventListener("click", async () => { const panel = root.querySelector("[data-action-panel]"); panel.textContent = "Enregistrement…"; try { const response = await fetch(`${config.apiUrl}/callback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId, booking_token: bookingToken }) }); if (!response.ok) throw new Error(); panel.className = "sd-status sd-inline"; panel.textContent = "Demande confirmée. Mathilde pourra te rappeler."; track("callback_requested", {}, leadId); } catch { panel.className = "sd-error sd-inline"; panel.textContent = "La demande n'a pas été confirmée. Réessaie ou utilise la page Contact."; } });
    root.querySelector("[data-book]").addEventListener("click", () => loadSlots(root, leadId, bookingToken));
  }
  async function loadSlots(root, leadId, bookingToken) {
    const panel = root.querySelector("[data-action-panel]"); panel.className = "sd-inline"; panel.textContent = "Chargement des créneaux…"; track("appointment_viewed", {}, leadId);
    try { const response = await fetch(`${config.apiUrl}/slots`); const result = await response.json(); if (!response.ok || !result.slots?.length) throw new Error(); panel.innerHTML = `<div class="sd-fields"><div class="sd-field full"><label for="sd-slot">Créneau — heure de Tahiti</label><select id="sd-slot" data-slot>${result.slots.map((slot, index) => `<option value="${index}">${escapeHtml(slot.local_label)}</option>`).join("")}</select></div><div class="sd-field full"><label for="sd-mode">Type de rendez-vous</label><select id="sd-mode" data-mode><option value="phone">Téléphone</option><option value="on_site">Sur place</option></select></div></div><button class="sd-btn primary sd-inline" type="button" data-confirm>Confirmer ce rendez-vous</button><div class="sd-inline" data-booking-status></div>`; panel.querySelector("[data-confirm]").addEventListener("click", async () => { const status = panel.querySelector("[data-booking-status]"); const slot = result.slots[Number(panel.querySelector("[data-slot]").value)]; const mode = panel.querySelector("[data-mode]").value; status.textContent = "Confirmation en cours…"; try { const booking = await fetch(`${config.apiUrl}/appointments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId, booking_token: bookingToken, start_at: slot.start_at, end_at: slot.end_at, mode }) }); const answer = await booking.json(); if (!booking.ok) throw new Error(answer.error); status.className = "sd-status sd-inline"; status.textContent = `Rendez-vous confirmé · ${answer.reference}`; track("appointment_confirmed", { mode }, leadId); } catch (error) { status.className = "sd-error sd-inline"; status.textContent = error.message || "Le rendez-vous n'a pas été créé."; } }); } catch { panel.className = "sd-error sd-inline"; panel.textContent = "Aucun créneau n'est disponible actuellement. Tu peux demander à être rappelé."; }
  }

  document.querySelectorAll("[data-seller-cta]").forEach((item) => item.addEventListener("click", () => track("cta_clicked")));
  track("landing_view"); track("diagnostic_started", { resumed: Object.keys(data).length > 0 }); render();
}
