(function(){if(document.querySelector('script[data-mk-shell-loader]'))return;var s=document.createElement('script');s.src='/global-shell.js?v=9';s.defer=true;s.dataset.mkShellLoader='';document.head.appendChild(s)})();
window.MK_SITE_CONFIG = {
  finance: {
    borrowingEffortRate: 0.35,
    defaultAnnualRate: 0.045,
    defaultInsuranceRate: 0,
    annualRateUpdatedAt: ""
  },
  leads: {
    webhookUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/form-intake",
    endpointLabel: "form-intake"
  },
  contact: {
    whatsapp: "33782475958",
    phoneDisplay: "88 07 82 47",
    phoneHref: "+68988078247"
  },
  referral: {
    // Part de la commission totale HT de l'agence, après rétrocessions et
    // frais de franchise. Source unique pour l'affichage et les calculs.
    commissionRate: 0.1125
  },
  internship: {
    requirements: [
      "Ton propre ordinateur portable",
      "Un téléphone utilisable pendant le stage",
      "Une connexion ou un forfait adapté aux missions",
      "De l'autonomie dans les déplacements lorsque du terrain est prévu"
    ]
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
  },
  assistant: {
    apiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/website-assistant",
    emailCaptureUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/form-intake"
  }
};

// Assistant conversationnel et invitation email partagés par toutes les pages
// publiques. Les secrets et les appels au modèle restent côté Supabase.
if (!document.querySelector('script[data-mk-concierge]')) {
  var conciergeScript = document.createElement("script");
  conciergeScript.src = "/site-concierge.js?v=1";
  conciergeScript.defer = true;
  conciergeScript.dataset.mkConcierge = "";
  document.head.appendChild(conciergeScript);
}

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

// Cross-link the long-form “vendre pour racheter” guide from the existing
// commercial journeys without duplicating their forms or navigation.
var initSalePurchaseGuideLinks = function () {
  var path = location.pathname;
  if (path === "/acheter-bien-immobilier-tahiti.html") {
    var buyerShell = document.querySelector(".buyer-funnel-shell .buyer-wrap");
    if (buyerShell && !document.querySelector("[data-sale-purchase-link]")) {
      var buyerCard = document.createElement("aside");
      buyerCard.className = "buyer-form-card";
      buyerCard.dataset.salePurchaseLink = "";
      buyerCard.innerHTML = '<p class="buyer-kicker">Vendre + acheter</p><h2>Ton prochain achat dépend de la vente de ton logement&nbsp;?</h2><p>Compare les stratégies et calcule le budget potentiellement disponible après ta vente.</p><a class="buyer-btn" href="/blog-vendre-pour-racheter-tahiti.html">Préparer les deux projets</a>';
      buyerShell.appendChild(buyerCard);
    }
  }
  if (path === "/capacite-emprunt-polynesie.html") {
    var financeShell = document.querySelector(".fin-shell .fin-wrap");
    if (financeShell && !document.querySelector("[data-sale-purchase-link]")) {
      var financeCard = document.createElement("aside");
      financeCard.className = "fin-card";
      financeCard.dataset.salePurchaseLink = "";
      financeCard.innerHTML = '<p class="fin-kicker">Projet lié à une vente</p><h2>Tu dois vendre ton logement pour constituer ton apport&nbsp;?</h2><p>Calcule le produit net indicatif de ta vente et compare trois stratégies prudentes.</p><a class="fin-btn" href="/blog-vendre-pour-racheter-tahiti.html">Ouvrir le guide vendre pour racheter</a>';
      financeShell.appendChild(financeCard);
    }
  }
  if (["/vendre-bien-immobilier-tahiti.html", "/estimation-immobiliere-tahiti.html"].includes(path)) {
    var main = document.querySelector("main");
    if (main && !document.querySelector("[data-sale-purchase-link]")) {
      var section = document.createElement("section");
      section.className = "section";
      section.dataset.salePurchaseLink = "";
      section.innerHTML = '<div class="wrap contact-strip"><div><p class="eyebrow">Vendre pour racheter</p><h2>Ton prochain achat dépend de ta vente&nbsp;?</h2><p>Compare les stratégies et pose un budget réaliste avant de coordonner les deux opérations.</p></div><a class="btn primary" href="/blog-vendre-pour-racheter-tahiti.html">Lire le guide complet</a></div>';
      main.appendChild(section);
    }
  }
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSalePurchaseGuideLinks, { once: true });
else initSalePurchaseGuideLinks();
