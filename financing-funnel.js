import { FINANCING_CONFIG, calculateFinancingCapacity } from "./financing-engine.mjs";

const form = document.querySelector("[data-financing-form]");
if (form) {
  const cfg = window.MK_SITE_CONFIG?.buyer || {};
  const dbCfg = window.MK_SITE_CONFIG?.foncier || {};
  const steps = [...form.querySelectorAll("[data-step]")].filter((step) => !step.matches("[data-result]"));
  const resultStep = form.querySelector("[data-result]");
  const successStep = form.querySelector("[data-success]");
  const sessionId = sessionStorage.getItem("mk_financing_session") || crypto.randomUUID();
  let current = 0;
  let result = null;
  sessionStorage.setItem("mk_financing_session", sessionId);
  const endpoint = (path) => String(cfg.apiUrl || "").replace(/\/$/, "") + path;
  const headers = () => ({ "Content-Type": "application/json", apikey: dbCfg.anonKey || "", Authorization: "Bearer " + (dbCfg.anonKey || "") });
  const number = (value) => Number(String(value || "").replace(/\D/g, "")) || 0;
  const money = (value) => Math.round(Number(value || 0)).toLocaleString("fr-FR") + " F CFP";
  const track = (eventName, metadata = {}) => {
    if (!cfg.apiUrl || !dbCfg.anonKey) return;
    fetch(endpoint("/public/events"), { method: "POST", headers: headers(), body: JSON.stringify({ session_id: sessionId, event_name: eventName, page_path: location.pathname, traffic_source: document.referrer ? "referral" : "direct", metadata }) }).catch(() => {});
  };
  const save = () => {
    const values = {};
    new FormData(form).forEach((value, key) => { if (!["first_name", "last_name", "phone", "email", "broker_consent", "privacy_consent"].includes(key)) values[key] = value; });
    sessionStorage.setItem("mk_financing_answers", JSON.stringify(values));
  };
  const restore = () => {
    try { const values = JSON.parse(sessionStorage.getItem("mk_financing_answers") || "{}"); Object.entries(values).forEach(([key, value]) => { const input = form.elements.namedItem(key); if (!input) return; if (input instanceof RadioNodeList) { const radio = [...form.querySelectorAll(`[name="${CSS.escape(key)}"]`)].find((el) => el.value === value); if (radio) radio.checked = true; } else input.value = value; }); } catch (_) {}
  };
  const updateConditionals = () => {
    const together = new FormData(form).get("purchase_mode") === "together";
    form.querySelectorAll("[data-person-two]").forEach((el) => { el.hidden = !together; const input = el.querySelector("input,select"); if (input) input.required = together; });
    const charges = new FormData(form).get("has_charges") === "yes";
    form.querySelector("[data-charges-field]").hidden = !charges;
    form.elements.charges.required = charges;
    if (!charges) form.elements.charges.value = "";
    const found = new FormData(form).get("property_found") === "yes";
    form.querySelector("[data-price-field]").hidden = !found;
    form.elements.property_price.required = found;
    if (!found) form.elements.property_price.value = "";
    form.querySelector("[data-income-total]").textContent = money(number(form.elements.income1.value) + number(form.elements.income2.value));
  };
  const show = (index) => {
    current = Math.max(0, Math.min(steps.length - 1, index));
    [...steps, resultStep, successStep].forEach((step) => { step.hidden = true; });
    steps[current].hidden = false;
    form.querySelector("[data-progress]").style.width = ((current + 1) / steps.length * 100) + "%";
    form.querySelector("[data-progress-text]").textContent = `Étape ${current + 1} sur ${steps.length}`;
    const title = steps[current].querySelector("h2"); if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); }
    form.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  const valid = (step = steps[current]) => {
    for (const control of step.querySelectorAll("input,select")) if (!control.checkValidity()) { control.reportValidity(); control.focus(); return false; }
    return true;
  };
  const calculate = () => {
    const data = Object.fromEntries(new FormData(form).entries());
    result = calculateFinancingCapacity({ income1: number(data.income1), income2: number(data.income2), charges: number(data.charges), contribution: number(data.contribution) || number(data.contribution_choice), durationYears: number(data.duration_years) }, FINANCING_CONFIG);
    steps.forEach((step) => { step.hidden = true; }); resultStep.hidden = false;
    form.querySelector("[data-central]").textContent = money(result.central);
    form.querySelector("[data-range]").textContent = money(result.minimum) + " à " + money(result.maximum);
    form.querySelector("[data-payment]").textContent = money(result.monthlyPayment);
    form.querySelector("[data-years]").textContent = result.years + " ans";
    form.querySelector("[data-contribution]").textContent = money(result.contribution);
    form.querySelector("[data-progress]").style.width = "100%";
    form.querySelector("[data-progress-text]").textContent = "Ton estimation";
    track("financing_simulation_completed", { duration_years: result.years }); track("financing_result_viewed", { estimate_band: Math.round(result.central / 5000000) * 5000000 });
    resultStep.querySelector("h2").focus({ preventScroll: true });
  };
  restore(); updateConditionals(); show(0);
  document.querySelector("[data-start]")?.addEventListener("click", () => track("financing_funnel_started"));
  form.addEventListener("input", (event) => { if (event.target.matches("[data-money]")) { const value = number(event.target.value); event.target.value = value ? value.toLocaleString("fr-FR") : ""; } updateConditionals(); save(); });
  form.addEventListener("change", (event) => { if (event.target.name === "contribution_choice") form.elements.contribution.value = number(event.target.value).toLocaleString("fr-FR"); if (event.target.name === "project_type") track("financing_project_selected", { project_type: event.target.value }); updateConditionals(); save(); });
  form.addEventListener("click", (event) => { const next = event.target.closest("[data-next]"), back = event.target.closest("[data-back]"), calc = event.target.closest("[data-calculate]"), backResult = event.target.closest("[data-back-result]"); if (next) { if (!valid()) return; if (current === 2) track("financing_income_completed"); show(current + 1); } if (back) show(current - 1); if (calc) { if (!valid()) return; calculate(); } if (backResult) show(steps.length - 1); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); if (!valid(resultStep) || !result) return;
    const submit = form.querySelector("button[type=submit]"), error = form.querySelector("[data-error]"); submit.disabled = true; submit.textContent = "Enregistrement…"; error.textContent = ""; track("financing_minitaux_clicked");
    const raw = Object.fromEntries(new FormData(form).entries());
    const payload = { ...raw, session_id: sessionId, income1: number(raw.income1), income2: number(raw.income2), charges: number(raw.charges), contribution: number(raw.contribution) || number(raw.contribution_choice), duration_years: number(raw.duration_years), property_price: number(raw.property_price), broker_consent: raw.broker_consent === "yes", privacy_consent: raw.privacy_consent === "yes" };
    try { if (!cfg.apiUrl || !dbCfg.anonKey) throw new Error("Le service d'enregistrement n'est pas configuré."); const response = await fetch(endpoint("/public/financing"), { method: "POST", headers: headers(), body: JSON.stringify(payload) }); const json = await response.json(); if (!response.ok) throw new Error(json.error || "Impossible d'enregistrer la demande."); resultStep.hidden = true; successStep.hidden = false; form.querySelector("[data-reference]").textContent = "Référence : " + json.reference; sessionStorage.setItem("mk_buyer_handoff", JSON.stringify({ first_name: raw.first_name, last_name: raw.last_name, phone: raw.phone, email: raw.email, budget_xpf: result.central, project_type: raw.project_type })); track("financing_lead_submitted", { simulation_id: json.simulation_id, broker_status: json.broker_status }); }
    catch (err) { error.textContent = err.message; submit.disabled = false; submit.textContent = "Demander mon étude personnalisée"; }
  });
}
