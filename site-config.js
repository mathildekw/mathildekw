(function(){if(document.querySelector('script[data-mk-shell-loader]'))return;var s=document.createElement('script');s.src='/global-shell.js?v=7';s.defer=true;s.dataset.mkShellLoader='';document.head.appendChild(s)})();
window.MK_SITE_CONFIG = {
  finance: {
    borrowingEffortRate: 0.35,
    defaultAnnualRate: 0.045,
    defaultInsuranceRate: 0,
    annualRateUpdatedAt: ""
  },
  leads: {
    webhookUrl: "",
    endpointLabel: "LEADS_WEBHOOK_URL"
  },
  contact: {
    whatsapp: "33782475958",
    phoneDisplay: "88 07 82 47",
    phoneHref: "+68988078247"
  },
  buyer: {
    apiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/buyer-funnel",
    // Official third-party connectors remain disabled until server-side
    // credentials and written authorization are configured.
    modeloConnector: "manual",
    acteloConnector: "manual"
  },
  foncier: {
    apiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-promotion",
    leadApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-leads-v2",
    conversionApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-conversion",
    reportApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-report",
    studiesApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-studies",
    prospectingApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-prospecting",
    adminApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-admin",
    supabaseUrl: "https://rqjuvutlnpwecjkpkiuw.supabase.co",
    // Public publishable key only. Privileged service-role credentials remain
    // server-side in Supabase Edge Functions and must never be added here.
    anonKey: "sb_publishable_lHIm5SqXealczmGZtid3Yg_oYmZ96BK"
  },
  sellerDiagnostic: {
    apiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/seller-diagnostic"
  }
};

// Provide an accessible name for legacy controls whose visual label is adjacent
// but not programmatically associated. This does not alter form behavior.
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".fp-field > input, .fp-field > select, .fp-field > textarea").forEach(function (control) {
    var label = control.parentElement && control.parentElement.querySelector("label");
    if (label && !(control.labels && control.labels.length)) {
      if (!control.id) control.id = "mk-field-" + Math.random().toString(36).slice(2, 9);
      label.htmlFor = control.id;
    }
  });
});

// Load the containment fix only on the immersive Foncier landing page.
// This file can execute from <head>, before document.body exists.
var initFoncierMobileFix = function () {
if (document.body && document.body.classList.contains("hz-page")) {
  var mobileFix = document.createElement("link");
  mobileFix.rel = "stylesheet";
  mobileFix.href = "/foncier-mobile-fix.css?v=7";
  document.head.appendChild(mobileFix);

  // Chrome/iOS can expose a visual viewport narrower than the CSS layout
  // viewport when page zoom or enlarged text is active. Reflow the landing
  // content to the width the visitor can actually see instead of clipping it.
  var fitFoncierToVisualViewport = function () {
    var visibleWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    var layoutWidth = document.documentElement.clientWidth;
    var needsFit = visibleWidth > 0 && visibleWidth + 2 < layoutWidth;
    document.body.classList.toggle("visual-viewport-fit", needsFit);
    if (needsFit) {
      document.body.style.setProperty("--fp-visible-width", visibleWidth + "px");
      document.body.style.setProperty("--fp-visible-title", Math.max(34, Math.min(52, visibleWidth * 0.135)) + "px");
      document.body.style.setProperty("--fp-visible-copy", Math.max(14, Math.min(16, visibleWidth * 0.052)) + "px");
    }
  };
  fitFoncierToVisualViewport();
  if (window.visualViewport) window.visualViewport.addEventListener("resize", fitFoncierToVisualViewport, { passive: true });
}
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFoncierMobileFix, { once: true });
} else {
  initFoncierMobileFix();
}

// Connect the financing simulation with the existing buyer journey without
// duplicating page-specific navigation or personal data in URLs.
var initBuyerFinancingBridge = function () {
  if (!document.body || !document.body.classList.contains("buyer-funnel-page")) return;
  var shell = document.querySelector(".buyer-funnel-shell .buyer-wrap");
  var form = document.querySelector("[data-buyer-form]");
  if (shell && form && !document.querySelector("[data-financing-bridge]")) {
    var card = document.createElement("aside");
    card.className = "buyer-form-card";
    card.dataset.financingBridge = "";
    card.style.marginBottom = "24px";
    card.innerHTML = '<p class="buyer-kicker">Avant de chercher</p><h2>Tu ne connais pas encore ton budget&nbsp;?</h2><p class="buyer-step-intro">Estime ta capacité d\'emprunt en 2 minutes, gratuitement et sans engagement.</p><a class="buyer-btn" href="/capacite-emprunt-polynesie.html">Calculer ma capacité</a>';
    shell.insertBefore(card, form);
  }
  var handoff = document.createElement("script");
  handoff.src = "/buyer-handoff.js?v=1";
  handoff.defer = true;
  document.head.appendChild(handoff);
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initBuyerFinancingBridge, { once: true });
else initBuyerFinancingBridge();
