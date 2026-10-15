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
  mobileFix.href = "/foncier-mobile-fix.css?v=2";
  document.head.appendChild(mobileFix);
}
