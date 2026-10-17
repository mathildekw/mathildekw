(function () {
  "use strict";
  if (window.__mkPrivacyAnalytics) return;
  window.__mkPrivacyAnalytics = true;

  var cfg = (window.MK_SITE_CONFIG && window.MK_SITE_CONFIG.foncier) || {};
  var endpoint = cfg.conversionApiUrl || "";
  var consentKey = "mk_analytics_consent";
  var privateRoute = /^\/(admin-|admin\/|portail-foncier|espace-vendeur|demo-espace-vendeur|suivi-vendeur|etude-fonciere-privee|dossier-promoteur)/.test(location.pathname);
  var params = new URLSearchParams(location.search);
  var utm = {};
  var scrollSent = {};
  var activeSince = Date.now();
  var engagedSeconds = 0;

  if (privateRoute || !endpoint) return;

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
    var value = params.get(key);
    if (value) utm[key] = value.slice(0, 120);
  });
  if (Object.keys(utm).length) localStorage.setItem("pk_funnel_utm", JSON.stringify(utm));
  else try { utm = JSON.parse(localStorage.getItem("pk_funnel_utm") || "{}"); } catch (error) { utm = {}; }

  function identifier() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function granted() { return localStorage.getItem(consentKey) === "granted"; }
  function sessionId() {
    var current = sessionStorage.getItem("pk_funnel_session");
    if (!current) { current = identifier(); sessionStorage.setItem("pk_funnel_session", current); }
    return current;
  }
  function source() {
    var signal = String(utm.utm_source || "").toLowerCase() + " " + document.referrer.toLowerCase();
    if (/facebook|\bfb\b/.test(signal)) return "facebook";
    if (/instagram|\big\b/.test(signal)) return "instagram";
    if (/tiktok/.test(signal)) return "tiktok";
    if (/google/.test(signal)) return "google";
    if (/whatsapp|\bwa\b/.test(signal)) return "whatsapp";
    return document.referrer ? "other" : "direct";
  }
  function device() {
    return matchMedia("(max-width: 767px)").matches ? "mobile" : matchMedia("(max-width: 1100px)").matches ? "tablet" : "desktop";
  }

  var variant = localStorage.getItem("pk_funnel_variant");
  if (!/^[ABC]$/.test(variant || "")) {
    variant = ["A", "B", "C"][Math.floor(Math.random() * 3)];
    localStorage.setItem("pk_funnel_variant", variant);
  }

  function track(name, metadata) {
    if (!granted()) return Promise.resolve(false);
    var safeMetadata = Object.assign({ device: device() }, metadata || {});
    return fetch(endpoint.replace(/\/$/, "") + "/public/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent: true,
        event_name: name,
        session_id: sessionId(),
        page_path: location.pathname,
        traffic_source: source(),
        utm: utm,
        ab_variant: variant,
        metadata: safeMetadata
      }),
      keepalive: true
    }).then(function (response) { return response.ok; }).catch(function () { return false; });
  }

  function startTracking() {
    if (document.documentElement.dataset.mkAnalyticsStarted) return;
    document.documentElement.dataset.mkAnalyticsStarted = "true";
    track("page_view", { title: document.title.slice(0, 160) });
    if (document.body.classList.contains("fp") && !document.getElementById("land-form")) track("landing_view");
  }

  function banner() {
    if (localStorage.getItem(consentKey)) return;
    var node = document.createElement("aside");
    node.className = "mk-consent";
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-label", "Choix de confidentialité");
    node.innerHTML = '<div><strong>Mesure d’audience respectueuse</strong><p>Autorises-tu des statistiques anonymes pour améliorer le site ? Aucune valeur de formulaire ni donnée cadastrale n’est collectée.</p><a href="/politique-confidentialite.html">En savoir plus</a></div><div class="mk-consent-actions"><button type="button" data-consent="denied">Refuser</button><button type="button" class="accept" data-consent="granted">Accepter</button></div>';
    document.body.appendChild(node);
    node.addEventListener("click", function (event) {
      var button = event.target.closest("[data-consent]");
      if (!button) return;
      localStorage.setItem(consentKey, button.dataset.consent);
      node.remove();
      if (button.dataset.consent === "granted") startTracking();
    });
  }

  window.PKFunnel = { track: track, context: { traffic_source: source(), utm: utm, ab_variant: variant } };
  window.MKAnalytics = {
    track: track,
    consent: function (choice) { localStorage.setItem(consentKey, choice ? "granted" : "denied"); if (choice) startTracking(); },
    resetConsent: function () { localStorage.removeItem(consentKey); location.reload(); }
  };

  document.addEventListener("click", function (event) {
    var menu = event.target.closest(".mk-shell-toggle");
    if (menu && menu.getAttribute("aria-expanded") !== "true") track("menu_open");
    var link = event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (link.closest("[data-foncier-cta]")) track("cta_clicked", { placement: link.closest("[data-foncier-cta]").dataset.foncierCta || "unknown", destination: href.split("?")[0] });
    if (/wa\.me|whatsapp/i.test(href)) track("whatsapp_click", { destination: "whatsapp" });
    else if (/^tel:/i.test(href)) track("phone_click", { destination: "phone" });
    else if (/diagnostic-foncier/i.test(href)) track("diagnostic_click", { destination: "/diagnostic-foncier.html" });
    else if (/estimation-/i.test(href)) track("estimate_click", { destination: href.split("?")[0] });
    else if (/appartement-|maison-a-vendre|biens\//i.test(href)) track("property_click", { destination: href.split("?")[0] });
  }, true);

  document.addEventListener("scroll", function () {
    if (!granted()) return;
    var height = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    var percent = Math.round(100 * scrollY / height);
    [25, 50, 75, 100].forEach(function (threshold) {
      if (percent >= threshold && !scrollSent[threshold]) { scrollSent[threshold] = true; track("scroll_depth", { percent: threshold }); }
    });
  }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      engagedSeconds += Math.round((Date.now() - activeSince) / 1000);
      if (engagedSeconds >= 5) { track("engagement_time", { seconds: Math.min(engagedSeconds, 1800) }); engagedSeconds = 0; }
    } else activeSince = Date.now();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { banner(); if (granted()) startTracking(); }, { once: true });
  else { banner(); if (granted()) startTracking(); }
})();
