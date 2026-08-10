import { estimateBorrowingCapacity, estimateMonthlyPayment, estimateRentalYield, estimateSimpleBudget, formatXpf, toNumber } from "./finance-calculators.js";

const config = window.MK_SITE_CONFIG || {};
const finance = config.finance || {};
const leads = config.leads || {};
let lastPayload = {};
let currentSource = "";

function pct(v) { return `${(v * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`; }
function field(form, name, fallback = 0) {
  const raw = new FormData(form).get(name);
  if ((raw === null || raw === "") && fallback !== undefined) return fallback;
  return raw;
}
function annualRate(form) {
  const fallback = (finance.defaultAnnualRate || 0.045) * 100;
  return toNumber(field(form, "annualRate", fallback)) / 100;
}
function effortRate(form) {
  const fallback = (finance.borrowingEffortRate || 0.35) * 100;
  return toNumber(field(form, "effortRate", fallback)) / 100;
}
function writeResult(scope, data) {
  Object.entries(data).forEach(([key, value]) => {
    const node = scope.querySelector(`[data-out="${key}"]`);
    if (!node) return;
    if (key.toLowerCase().includes("yield")) node.textContent = pct(value);
    else node.textContent = formatXpf(value);
  });
}
function serialize(form) {
  return Object.fromEntries([...new FormData(form).entries()].filter(([, v]) => String(v || "").trim() !== ""));
}
function activateTool(id) {
  document.querySelectorAll("[data-tool-panel]").forEach(panel => panel.classList.toggle("is-active", panel.id === id));
  document.querySelectorAll("[data-tool-target]").forEach(tab => tab.classList.toggle("is-active", tab.dataset.toolTarget === id));
  if (typeof trackEvent === "function") trackEvent("calculator_started", { tool: id });
}

document.querySelectorAll("[data-tool-target]").forEach(tab => tab.addEventListener("click", () => activateTool(tab.dataset.toolTarget)));

document.querySelector('[data-calculator="capacity"]')?.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const result = estimateBorrowingCapacity({
    monthlyIncome: field(form, "monthlyIncome"),
    otherIncome: field(form, "otherIncome"),
    monthlyDebts: field(form, "monthlyDebts"),
    downPayment: field(form, "downPayment"),
    years: field(form, "years", 20),
    annualRate: annualRate(form),
    effortRate: effortRate(form),
    insuranceMonthly: field(form, "insuranceMonthly")
  });
  lastPayload.capacity = { input: serialize(form), result, source: "simulateur capacité emprunt", timestamp: new Date().toISOString() };
  writeResult(document.querySelector('[data-result="capacity"]'), result);
  if (typeof trackEvent === "function") trackEvent("calculator_completed", { tool: "capacity" });
});

document.querySelector('[data-calculator="monthly"]')?.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const result = estimateMonthlyPayment({ price: field(form, "price"), downPayment: field(form, "downPayment"), principal: field(form, "principal"), years: field(form, "years", 20), annualRate: annualRate(form) });
  lastPayload.monthly = { input: serialize(form), result, source: "simulateur mensualité", timestamp: new Date().toISOString() };
  writeResult(document.querySelector('[data-result="monthly"]'), result);
  if (typeof trackEvent === "function") trackEvent("calculator_completed", { tool: "monthly" });
});

document.querySelector('[data-calculator="yield"]')?.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const result = estimateRentalYield(serialize(form));
  lastPayload.yield = { input: serialize(form), result, source: "simulateur rendement locatif", timestamp: new Date().toISOString() };
  writeResult(document.querySelector('[data-result="yield"]'), result);
  if (typeof trackEvent === "function") trackEvent("calculator_completed", { tool: "yield" });
});

document.querySelector('[data-calculator="budget"]')?.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const result = estimateSimpleBudget(serialize(form));
  lastPayload.budget = { input: serialize(form), result, source: "simulateur budget achat", timestamp: new Date().toISOString() };
  writeResult(document.querySelector('[data-result="budget"]'), result);
  if (typeof trackEvent === "function") trackEvent("calculator_completed", { tool: "budget" });
});

document.querySelector("[data-seller-tool]")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector(".legal-note");
  const payload = { source: "outil estimation vendeur", timestamp: new Date().toISOString(), sellerProject: serialize(form) };
  await submitLead(payload, status, "seller_estimation_submitted");
});

document.querySelectorAll("[data-lead-open]").forEach(button => button.addEventListener("click", () => {
  currentSource = button.dataset.leadOpen;
  document.querySelector("[data-lead-dialog]")?.showModal();
  if (typeof trackEvent === "function") trackEvent("calculator_lead_cta_clicked", { tool: currentSource });
}));

document.querySelector("[data-lead-form]")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector("[data-lead-status]");
  if (new FormData(form).get("company")) return;
  const payload = { source: lastPayload[currentSource]?.source || `simulateur ${currentSource}`, timestamp: new Date().toISOString(), contact: serialize(form), calculation: lastPayload[currentSource] || null };
  await submitLead(payload, status, "lead_submitted");
});

async function submitLead(payload, status, eventName) {
  const endpoint = leads.webhookUrl || "";
  status.textContent = "Envoi en cours...";
  if (!endpoint) {
    status.textContent = "La connexion automatique des leads n’est pas encore configurée. Écris à Mathilde sur WhatsApp pour transmettre ta demande maintenant.";
    status.insertAdjacentHTML("beforeend", ' <a href="https://wa.me/33782475958" target="_blank" rel="noopener">Ouvrir WhatsApp</a>');
    return false;
  }
  try {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    status.textContent = "Merci, ta demande a bien été transmise.";
    if (typeof trackEvent === "function") trackEvent(eventName, { source: payload.source });
    return true;
  } catch {
    status.textContent = "L’envoi n’a pas abouti. Réessaie ou contacte Mathilde sur WhatsApp.";
    return false;
  }
}
