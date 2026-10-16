(function () {
  "use strict";
  var cfg = window.MK_SITE_CONFIG && window.MK_SITE_CONFIG.foncier;
  var login = document.querySelector("[data-login]");
  var app = document.querySelector("[data-app]");
  var content = document.querySelector("[data-content]");
  var client = null;
  var period = document.querySelector("[data-period]");

  function esc(value) { return String(value == null ? "" : value).replace(/[&<>\"]/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]; }); }
  function number(value) { return new Intl.NumberFormat("fr-FR").format(Number(value) || 0); }
  function duration(seconds) { var value = Number(seconds) || 0; return value < 60 ? value + " s" : Math.round(value / 60) + " min"; }
  function entries(value) { return Object.entries(value || {}); }
  function empty(value) { return value == null || (Array.isArray(value) && !value.length) || (!Array.isArray(value) && typeof value === "object" && !Object.keys(value).length); }
  function panel(title, body) { return '<section class="fp-panel"><h2>' + esc(title) + '</h2>' + body + '</section>'; }
  function bars(value, labelKey) {
    var rows = Array.isArray(value) ? value : entries(value).map(function (item) { return { label: item[0], value: typeof item[1] === "object" ? item[1].sessions : item[1], detail: item[1] }; });
    if (!rows.length) return '<div class="fp-empty">Aucune donnée sur cette période.</div>';
    var max = Math.max.apply(null, rows.map(function (row) { return Number(row.value || row.sessions || row.views) || 0; }).concat([1]));
    return '<div class="fp-bars">' + rows.map(function (row) {
      var label = row[labelKey || "label"] || row.page || "Inconnu";
      var valueNumber = Number(row.value || row.sessions || row.views) || 0;
      var extra = row.detail && typeof row.detail === "object" ? ' · ' + number(row.detail.leads) + ' lead(s) · ' + number(row.detail.appointments) + ' RDV' : "";
      return '<div class="fp-bar-row"><div><span>' + esc(label) + '</span><b>' + number(valueNumber) + extra + '</b></div><i><span style="width:' + Math.round(100 * valueNumber / max) + '%"></span></i></div>';
    }).join("") + '</div>';
  }

  async function load() {
    var session = (await client.auth.getSession()).data.session;
    var days = Number(period && period.value) || 30;
    var from = new Date(Date.now() - days * 86400000).toISOString();
    content.innerHTML = '<div class="fp-empty">Calcul des statistiques réelles…</div>';
    var response = await fetch(cfg.conversionApiUrl + "/admin/analytics?from=" + encodeURIComponent(from), { headers: { Authorization: "Bearer " + session.access_token } });
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erreur serveur");
    var metrics = Array.isArray(result.metrics) ? result.metrics[0] : result.metrics || {};
    var sheet = ((result.settings || []).find(function (item) { return item.id === "google_sheets"; }) || {}).value || {};
    var analytics = ((result.settings || []).find(function (item) { return item.id === "analytics"; }) || {}).value || { status: metrics.page_views === undefined ? "configuration en attente" : "active_first_party" };
    var queued = (result.outbox || []).filter(function (item) { return item.destination === "google_sheets" && item.status !== "delivered"; }).length;
    var failed = (result.deliveries || []).filter(function (item) { return item.status === "failed"; }).length;
    var average = metrics.sessions ? Math.round((Number(metrics.engaged_seconds) || 0) / metrics.sessions) : 0;
    var cards = [
      ["Sessions consenties", metrics.sessions], ["Pages vues", metrics.page_views], ["Engagement moyen", duration(average)],
      ["Visites Foncier", metrics.landing_views], ["Diagnostics commencés", metrics.started], ["Leads enregistrés", metrics.completed],
      ["Conversion diagnostic", (Number(metrics.conversion_rate) || 0) + " %"], ["Rendez-vous confirmés", metrics.appointments]
    ];
    var html = '<div class="fp-metrics">' + cards.map(function (item) { return '<div class="fp-metric"><strong>' + esc(item[1] || 0) + '</strong><span>' + esc(item[0]) + '</span></div>'; }).join("") + '</div>';
    html += '<div class="fp-grid two">';
    html += panel("Origines du trafic", bars(metrics.by_source));
    html += panel("Appareils", bars(metrics.by_device));
    html += panel("Profondeur de lecture", bars(metrics.scroll_depth));
    html += panel("Étapes du diagnostic", bars(metrics.step_completion));
    html += '</div>';
    html += panel("Pages les plus consultées", empty(metrics.top_pages) ? '<div class="fp-empty">Aucune donnée sur cette période.</div>' : '<div class="fp-table-wrap"><table class="fp-table"><thead><tr><th>Page</th><th>Vues</th><th>Sessions</th><th>Engagement</th></tr></thead><tbody>' + metrics.top_pages.map(function (row) { return '<tr><td>' + esc(row.page) + '</td><td>' + number(row.views) + '</td><td>' + number(row.sessions) + '</td><td>' + duration(row.engaged_seconds) + '</td></tr>'; }).join("") + '</tbody></table></div>');
    html += '<div class="fp-grid two">' + panel("Tests de message", bars(metrics.by_variant)) + panel("Connexions réelles", '<p><b>Mesure interne :</b> ' + esc(analytics.status === "active_first_party" ? "active avec consentement" : "configuration en attente") + '</p><p><b>Google Sheets :</b> ' + esc(sheet.status === "connected" ? "connecté" : sheet.status || "non configuré") + '</p><p><b>Synchronisations en attente :</b> ' + number(queued) + '</p><p><b>Notifications externes échouées :</b> ' + number(failed) + '</p><p class="fp-disclaimer">Les refus de mesure ne sont pas comptés. Les valeurs de formulaire, données cadastrales et pages privées sont exclues.</p>') + '</div>';
    html += panel("Rendez-vous et abandons consentis", '<p><b>' + number((result.appointments || []).length) + '</b> rendez-vous enregistré(s) · <b>' + number((result.partials || []).length) + '</b> reprise(s) de diagnostic autorisée(s).</p>');
    content.innerHTML = html;
  }

  if (!cfg || !cfg.supabaseUrl || !cfg.anonKey || !window.supabase) {
    document.querySelector("[data-auth-status]").textContent = "Dashboard non activé : configuration Supabase absente.";
    document.querySelector("[data-login-form] button").disabled = true;
    return;
  }
  client = window.supabase.createClient(cfg.supabaseUrl, cfg.anonKey);
  document.querySelector("[data-login-form]").onsubmit = async function (event) {
    event.preventDefault();
    var email = new FormData(event.target).get("email");
    var result = await client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.href } });
    document.querySelector("[data-auth-status]").textContent = result.error ? result.error.message : "Lien sécurisé envoyé.";
  };
  if (period) period.onchange = function () { load().catch(function (error) { content.innerHTML = '<div class="fp-error">' + esc(error.message) + '</div>'; }); };
  client.auth.getSession().then(function (result) {
    if (result.data.session) { login.hidden = true; app.hidden = false; load().catch(function (error) { content.innerHTML = '<div class="fp-error">' + esc(error.message) + '</div>'; }); }
  });
})();
