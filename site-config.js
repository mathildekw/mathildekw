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
  foncier: {
    apiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-promotion",
    leadApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-leads",
    conversionApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-conversion",
    reportApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-report",
    studiesApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-studies",
    prospectingApiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/foncier-prospecting",
    supabaseUrl: "https://rqjuvutlnpwecjkpkiuw.supabase.co",
    anonKey: ""
  }
};

// Provide an accessible name for legacy controls whose visual label is adjacent
// but not programmatically associated. This does not alter form behavior.
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".fp-field > input, .fp-field > select, .fp-field > textarea").forEach(function (control) {
    var label = control.parentElement && control.parentElement.querySelector("label");
    if (label && !(control.labels && control.labels.length) && !control.getAttribute("aria-label")) {
      control.setAttribute("aria-label", label.textContent.trim());
    }
  });
});

// Load the containment fix only on the immersive Foncier landing page.
if (document.body && document.body.classList.contains("hz-page")) {
  var mobileFix = document.createElement("link");
  mobileFix.rel = "stylesheet";
  mobileFix.href = "/foncier-mobile-fix.css?v=3";
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
