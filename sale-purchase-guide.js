import { principalForMonthlyPayment, formatXpf, toNumber } from "./finance-calculators.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const config = window.MK_SITE_CONFIG || {};
const sessionId = crypto.randomUUID?.() || `00000000-0000-4000-8000-${Date.now().toString().slice(-12)}`;

function track(eventName, metadata = {}) {
  window.gtag?.("event", eventName, { page_path: location.pathname });
  const api = config.buyer?.apiUrl;
  const key = config.foncier?.anonKey;
  if (!api || !key) return;
  fetch(`${api}/public/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ session_id: sessionId, event_name: eventName, page_path: location.pathname, traffic_source: document.referrer ? "referral" : "direct", metadata })
  }).catch(() => {});
}

$$('[data-vp-event]').forEach((element) => element.addEventListener("click", () => track(element.dataset.vpEvent)));
$$('.vp-toc a').forEach((link) => link.addEventListener("click", () => track("guide_toc_clicked", { target: link.getAttribute("href") })));
track("guide_viewed");

const reached = new Set();
addEventListener("scroll", () => {
  const page = document.documentElement;
  const percent = Math.round((scrollY / Math.max(1, page.scrollHeight - innerHeight)) * 100);
  [25, 50, 75].forEach((threshold) => {
    if (percent >= threshold && !reached.has(threshold)) { reached.add(threshold); track("guide_scroll", { percent: threshold }); }
  });
}, { passive: true });

function setupSaleCalculator() {
  const form = $("[data-sale-calculator]");
  const calculate = () => {
    const data = Object.fromEntries(new FormData(form));
    const net = Math.max(0, toNumber(data.sale_price) - toNumber(data.remaining_loan) - toNumber(data.early_fees) - toNumber(data.seller_fees) - toNumber(data.other_costs));
    const available = Math.max(0, net + toNumber(data.savings) - toNumber(data.reserve));
    $("[data-net-sale]", form).textContent = formatXpf(net);
    $("[data-available-cash]", form).textContent = formatXpf(available);
    form.dataset.availableCash = String(available);
  };
  form.addEventListener("input", calculate);
  form.addEventListener("change", () => track("sale_calculator_used"));
  calculate();
}

function setupPurchaseCalculator() {
  const form = $("[data-purchase-calculator]");
  const calculate = () => {
    const data = Object.fromEntries(new FormData(form));
    const payment = Math.max(0, toNumber(data.monthly_payment) - toNumber(data.insurance));
    const principal = principalForMonthlyPayment(payment, toNumber(data.annual_rate) / 100, toNumber(data.years));
    const budget = Math.max(0, principal + toNumber(data.down_payment) - toNumber(data.purchase_fees) - toNumber(data.works));
    $("[data-loan-capacity]", form).textContent = formatXpf(principal);
    $("[data-purchase-budget]", form).textContent = formatXpf(budget);
  };
  form.addEventListener("input", calculate);
  form.addEventListener("change", () => track("purchase_calculator_used"));
  calculate();
}

const scenarios = {
  sell: "À préparer : estimation argumentée, mise en vente, solution de logement transitoire et budget confirmé après la vente. Risque principal : ne pas retrouver immédiatement le futur bien.",
  buy: "À préparer : accord bancaire, trésorerie de transition, coût total et plan si la vente prend du retard. Risque principal : porter plus longtemps que prévu les engagements financiers.",
  sync: "À préparer : avant-contrats, conditions suspensives, dates bancaires et notariales, remise des clés. Risque principal : qu'un décalage sur une opération bloque l'autre."
};
$$('[data-scenario]').forEach((button) => button.addEventListener("click", () => {
  $$('[data-scenario]').forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  $("[data-scenario-detail]").textContent = scenarios[button.dataset.scenario];
  track("scenario_compared", { scenario: button.dataset.scenario });
}));
$("[data-scenario-detail]").textContent = scenarios.sell;

function setupTimeline() {
  const input = $("#timeline-start");
  const output = $("[data-timeline]");
  const now = new Date(); input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const render = () => {
    const [year, month] = input.value.split("-").map(Number);
    const labels = ["Estimation du bien et étude du financement", "Commercialisation et recherche du futur bien", "Visites, négociations et avant-contrats éventuels", "Financement, actes définitifs et déménagement"];
    output.innerHTML = labels.map((label, index) => { const date = new Date(year, month - 1 + index, 1); return `<div class="vp-timeline-item"><strong>${date.toLocaleDateString("fr-PF", { month: "long", year: "numeric" })}</strong><span>${label}</span></div>`; }).join("");
  };
  input.addEventListener("change", render); render();
}

function setupFunnel() {
  const form = $("[data-move-form]"); if (!form) return;
  const steps = $$("[data-step]", form); let current = 0;
  const show = (index) => {
    current = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach((step, i) => step.hidden = i !== current);
    $("[data-progress]", form).style.width = `${((current + 1) / steps.length) * 100}%`;
    $("[data-progress-label]", form).textContent = `Étape ${current + 1} sur ${steps.length}`;
    steps[current].querySelector("h3")?.focus({ preventScroll: true });
  };
  const validStep = () => {
    for (const control of $$("input,select,textarea", steps[current])) if (!control.checkValidity()) { control.reportValidity(); control.focus(); return false; }
    return true;
  };
  form.addEventListener("click", (event) => {
    if (event.target.closest("[data-next]")) { if (!validStep()) return; if (current === 0) track("move_questionnaire_started"); track("move_step_completed", { step: current + 1 }); show(current + 1); }
    if (event.target.closest("[data-back]")) show(current - 1);
    if (event.target.closest("[data-print]")) { track("summary_printed"); print(); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); if (!validStep()) return;
    const status = $("[data-form-status]", form), submit = $('button[type="submit"]', form), raw = Object.fromEntries(new FormData(form));
    const payload = { ...raw, session_id: sessionId, privacy_consent: raw.privacy_consent === "yes", broker_consent: raw.broker_consent === "yes", alert_consent: false, seller_estimate: raw.seller_estimate === "yes", budget_flexibility: "À préciser", bedrooms: null, surface_min: null, required_criteria: "Projet de vente et de rachat coordonné", wanted_criteria: "À préciser avec Mathilde" };
    status.className = "vp-status"; status.textContent = "Enregistrement sécurisé…"; submit.disabled = true;
    try {
      if (!config.buyer?.apiUrl || !config.foncier?.anonKey) throw new Error("Le service d'enregistrement n'est pas configuré.");
      const response = await fetch(`${config.buyer.apiUrl}/public/searches`, { method: "POST", headers: { "Content-Type": "application/json", apikey: config.foncier.anonKey, Authorization: `Bearer ${config.foncier.anonKey}` }, body: JSON.stringify(payload) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Impossible d'enregistrer le projet.");
      steps.forEach((step) => step.hidden = true); $("[data-progress-label]", form).hidden = true; $(".vp-funnel-progress", form).hidden = true;
      const panel = $("[data-form-result]", form); panel.hidden = false;
      $("[data-summary]", panel).innerHTML = `<span><strong>Bien actuel :</strong> ${raw.seller_property_type} à ${raw.seller_commune}</span><span><strong>Situation :</strong> ${raw.seller_status === "not_listed" ? "pas encore en vente" : "déjà en vente"}</span><span><strong>Recherche :</strong> ${raw.property_type} — ${raw.communes}</span><span><strong>Budget envisagé :</strong> ${formatXpf(toNumber(raw.budget_xpf))}</span><span><strong>Financement :</strong> ${raw.financing_status}</span><span><strong>Calendrier :</strong> ${raw.purchase_timeline}</span>`;
      $("[data-reference]", panel).textContent = `Référence : ${result.reference}. La mise en relation courtier reste ${raw.broker_consent === "yes" ? "soumise à une validation manuelle" : "non demandée"}.`;
      panel.focus(); track("move_questionnaire_completed", { lead_id: result.lead_id, broker_requested: raw.broker_consent === "yes" });
    } catch (error) { status.className = "vp-status error"; status.textContent = error.message; submit.disabled = false; }
  });
  show(0);
}

setupSaleCalculator(); setupPurchaseCalculator(); setupTimeline(); setupFunnel();
