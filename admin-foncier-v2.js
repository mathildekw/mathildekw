(function () {
  "use strict";

  var cfg = (window.MK_SITE_CONFIG && window.MK_SITE_CONFIG.foncier) || {};
  var login = document.querySelector("[data-login]");
  var app = document.querySelector("[data-app]");
  var content = document.querySelector("[data-content]");
  var title = document.querySelector("[data-title]");
  var client = null;
  var view = "overview";
  var state = { lands: [], sellers: [], sellerActivities: [], sellerAppointments: [], sellerMetrics: {}, promoters: [], matches: [], activities: [], appointments: [], notifications: [], settings: [], outbox: [] };

  var labels = {
    new: "Nouveau lead", qualify: "À qualifier", contacted: "Premier contact",
    appointment: "Rendez-vous prévu", study: "Étude en cours",
    mandate_proposal: "Proposition de mandat", mandate_signed: "Mandat signé",
    promoter_presentation: "Présentation promoteurs", offer: "Offre reçue",
    agreement: "Compromis", sold: "Vente réalisée", follow_up: "À relancer",
    not_relevant: "Non pertinent", abandoned: "Abandonné"
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>\"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
    });
  }

  function date(value, withTime) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium", timeStyle: withTime ? "short" : undefined, timeZone: "Pacific/Tahiti"
    }).format(new Date(value));
  }

  function inputDate(value) {
    if (!value) return "";
    var formatter = new Intl.DateTimeFormat("sv-SE", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      hour12: false, timeZone: "Pacific/Tahiti"
    });
    return formatter.format(new Date(value)).replace(" ", "T");
  }

  async function api(path, options) {
    var session = (await client.auth.getSession()).data.session;
    if (!session) throw new Error("Session expirée");
    var response = await fetch(cfg.adminApiUrl + path, Object.assign({}, options || {}, {
      headers: Object.assign({ Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" }, options && options.headers || {})
    }));
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erreur serveur");
    return result;
  }

  function metrics() {
    var due = state.lands.filter(function (land) { return land.next_follow_up && new Date(land.next_follow_up) <= new Date(); }).length;
    return '<div class="fp-metrics">' + [
      [state.lands.filter(function (x) { return x.pipeline === "new"; }).length, "Nouveaux leads"],
      [state.lands.filter(function (x) { return x.priority_level === "P1"; }).length, "Prioritaires P1"],
      [state.appointments.filter(function (x) { return x.status === "confirmed" && new Date(x.start_at) >= new Date(); }).length, "Rendez-vous à venir"],
      [due, "Relances dues"],
      [state.lands.filter(function (x) { return x.pipeline === "mandate_signed"; }).length, "Mandats signés"],
      [state.sellers.length, "Diagnostics vendeurs"],
      [state.outbox.filter(function (x) { return x.status !== "delivered"; }).length, "Synchros en attente"]
    ].map(function (item) { return '<div class="fp-metric"><strong>' + item[0] + '</strong><span>' + item[1] + '</span></div>'; }).join("") + '</div>';
  }

  function sellerRows() {
    if (!state.sellers.length) return '<div class="fp-empty">Aucun diagnostic vendeur.</div>';
    var metrics = state.sellerMetrics || {};
    return '<div class="fp-metrics">' + [[metrics.started || 0,"Diagnostics commencés"],[metrics.completed || 0,"Terminés"],[metrics.appointments || 0,"Rendez-vous"],[String(metrics.conversion_rate || 0)+" %","Conversion"]].map(function(item){return '<div class="fp-metric"><strong>'+item[0]+'</strong><span>'+item[1]+'</span></div>';}).join("") + '</div><div class="fp-panel"><table class="fp-table"><thead><tr><th>Vendeur</th><th>Bien & contexte</th><th>Diagnostic</th><th>Priorité</th><th>Statut</th><th>Action / relance</th><th>Suivi</th></tr></thead><tbody>' + state.sellers.map(function(item){
      return '<tr><td><b>'+esc(item.first_name+' '+item.last_name)+'</b><br><a href="tel:'+esc(item.phone)+'">'+esc(item.phone)+'</a><br>'+esc(item.email||"")+'</td><td><b>'+esc(item.reference)+'</b><br>'+esc(item.property_type)+' · '+esc(item.commune)+'<br><small>'+esc(item.sale_duration)+' · '+esc(item.sale_method)+'</small></td><td>'+esc(item.visits_level)+'<br>'+esc(item.offers_status)+'<br><small>'+esc(item.objective)+'</small></td><td><select data-seller-priority="'+item.id+'"><option '+(item.priority_level==="P1"?"selected":"")+'>P1</option><option '+(item.priority_level==="P2"?"selected":"")+'>P2</option><option '+(item.priority_level==="P3"?"selected":"")+'>P3</option></select></td><td><select data-seller-pipeline="'+item.id+'">'+pipelineOptions(item.pipeline)+'</select></td><td><input data-seller-action="'+item.id+'" value="'+esc(item.next_action||"")+'" placeholder="Action suivante"><input data-seller-followup="'+item.id+'" type="datetime-local" value="'+esc(inputDate(item.next_follow_up))+'"></td><td><button class="fp-btn dark" data-seller-save="'+item.id+'">Enregistrer</button></td></tr>';
    }).join("")+'</tbody></table></div>';
  }

  function pipelineOptions(selected) {
    return Object.keys(labels).map(function (key) {
      return '<option value="' + key + '" ' + (selected === key ? "selected" : "") + '>' + labels[key] + '</option>';
    }).join("");
  }

  function landRows(rows) {
    if (!rows.length) return '<div class="fp-empty">Aucun prospect foncier.</div>';
    return '<div class="fp-panel"><table class="fp-table"><thead><tr><th>Prospect</th><th>Terrain & diagnostic</th><th>Priorité</th><th>Statut</th><th>Prochaine action</th><th>Relance</th><th>Suivi</th></tr></thead><tbody>' + rows.map(function (land) {
      return '<tr>' +
        '<td><b>' + esc(land.first_name + " " + land.last_name) + '</b><br><a href="tel:' + esc(land.phone) + '">' + esc(land.phone) + '</a><br>' + esc(land.email || "") + '<br><small>' + esc(land.preferred_channel || "Canal non précisé") + '</small></td>' +
        '<td><b>' + esc(land.reference) + '</b><br>' + esc(land.commune) + ' · ' + esc(land.surface) + ' m²<br><small>Cadastre : ' + esc(land.cadastre || "non communiqué") + '</small><br><span class="fp-badge">Diagnostic ' + esc(land.qualification_score || 0) + '/100</span></td>' +
        '<td><select data-priority="' + land.id + '"><option ' + (land.priority_level === "P1" ? "selected" : "") + '>P1</option><option ' + (land.priority_level === "P2" ? "selected" : "") + '>P2</option><option ' + (land.priority_level === "P3" ? "selected" : "") + '>P3</option></select></td>' +
        '<td><select data-pipeline="' + land.id + '">' + pipelineOptions(land.pipeline) + '</select></td>' +
        '<td><input data-action="' + land.id + '" value="' + esc(land.next_action || "") + '" placeholder="Action suivante"></td>' +
        '<td><input data-followup="' + land.id + '" type="datetime-local" value="' + esc(inputDate(land.next_follow_up)) + '"></td>' +
        '<td><button class="fp-btn dark" data-save="' + land.id + '">Enregistrer</button><br><button class="fp-btn" data-history="' + land.id + '">Historique</button></td>' +
        '</tr>';
    }).join("") + '</tbody></table></div><div data-history-panel></div>';
  }

  function historyPanel(leadId) {
    var land = state.lands.find(function (item) { return item.id === leadId; });
    var activities = state.activities.filter(function (item) { return item.lead_id === leadId || item.land_id === leadId; });
    var appointments = state.appointments.filter(function (item) { return item.lead_id === leadId; });
    return '<div class="fp-panel"><h2>' + esc(land.reference) + ' · Historique commercial</h2>' +
      '<p><b>Objectif :</b> ' + esc(land.owner_goal || "—") + '<br><b>Calendrier :</b> ' + esc(land.timeline || "—") + '<br><b>Commentaire :</b> ' + esc(land.comment || "—") + '</p>' +
      '<h3>Rendez-vous</h3>' + (appointments.length ? appointments.map(function (item) { return '<p><b>' + date(item.start_at, true) + '</b> · ' + esc(item.mode) + ' · ' + esc(item.status) + '</p>'; }).join("") : '<p>Aucun rendez-vous.</p>') +
      '<h3>Contacts et actions</h3>' + (activities.length ? activities.map(function (item) { return '<p><b>' + date(item.created_at, true) + ' · ' + esc(item.kind) + '</b><br>' + esc(item.body || item.reason || "") + (item.completed_at ? ' · Terminé' : '') + '</p>'; }).join("") : '<p>Aucun contact consigné.</p>') +
      '<form data-activity-form="' + leadId + '"><div class="fp-fields"><div class="fp-field"><label>Canal</label><select name="channel"><option>Téléphone</option><option>WhatsApp</option><option>Email</option><option>Rendez-vous</option><option>Note interne</option></select></div><div class="fp-field"><label>Date de relance éventuelle</label><input name="due_at" type="datetime-local"></div><div class="fp-field full"><label>Compte rendu</label><textarea name="body" required></textarea></div></div><button class="fp-btn primary">Ajouter à l’historique</button></form></div>';
  }

  function renderPromoters() {
    return '<div class="fp-panel"><table class="fp-table"><thead><tr><th>Référence</th><th>Société</th><th>Contact</th><th>Critères</th><th>Statut</th></tr></thead><tbody>' + state.promoters.map(function (item) {
      return '<tr><td>' + esc(item.reference) + '</td><td><b>' + esc(item.company) + '</b></td><td>' + esc(item.contact_name) + '<br>' + esc(item.email) + '</td><td>' + esc((item.areas || []).join(", ")) + '<br>' + esc(item.surface_min || "—") + ' à ' + esc(item.surface_max || "—") + ' m²</td><td>' + esc(item.status) + '</td></tr>';
    }).join("") + '</tbody></table></div>';
  }

  function renderTasks() {
    var pending = state.activities.filter(function (item) { return !item.completed_at && item.due_at; }).sort(function (a, b) { return new Date(a.due_at) - new Date(b.due_at); });
    return '<div class="fp-panel"><h2>Relances et actions</h2>' + (pending.length ? pending.map(function (item) {
      var land = state.lands.find(function (entry) { return entry.id === (item.lead_id || item.land_id); });
      return '<p><b>' + esc(land ? land.reference : "Dossier") + ' · ' + date(item.due_at, true) + '</b><br>' + esc(item.body || item.reason) + ' <button class="fp-btn" data-complete="' + item.id + '">Marquer fait</button></p>';
    }).join("") : '<div class="fp-empty">Aucune relance planifiée.</div>') + '</div>';
  }

  function renderSettings() {
    var sheet = (state.settings.find(function (item) { return item.id === "google_sheets"; }) || {}).value || {};
    var queued = state.outbox.filter(function (item) { return item.destination === "google_sheets" && item.status !== "delivered"; }).length;
    return '<div class="fp-panel"><h2>Suivi KW Impact</h2><p><span class="fp-badge">' + esc(sheet.status || "non configuré") + '</span></p><p>Source principale : <b>Supabase</b><br>Onglet cible : <b>' + esc(sheet.target_tab || "Journal") + '</b><br>Synchronisations en attente : <b>' + queued + '</b></p><p class="fp-disclaimer">Une synchronisation n’est déclarée réussie qu’après réponse du connecteur serveur. Aucune clé Google n’est stockée dans le navigateur.</p></div>';
  }

  function render() {
    var titles = { overview: "Vue d’ensemble", sellers: "Diagnostics vendeurs", lands: "Terrains", promoters: "Promoteurs", matching: "Matching", pipeline: "Pipeline", tasks: "Relances", settings: "Intégrations" };
    title.textContent = titles[view];
    if (view === "overview") content.innerHTML = metrics() + landRows(state.lands.slice(0, 8));
    else if (view === "sellers") content.innerHTML = sellerRows();
    else if (view === "lands") content.innerHTML = landRows(state.lands);
    else if (view === "promoters") content.innerHTML = renderPromoters();
    else if (view === "tasks") content.innerHTML = renderTasks();
    else if (view === "settings") content.innerHTML = renderSettings();
    else if (view === "pipeline") content.innerHTML = '<div class="fp-grid three">' + Object.keys(labels).map(function (key) { return '<div class="fp-panel"><h3>' + labels[key] + ' · ' + state.lands.filter(function (land) { return land.pipeline === key; }).length + '</h3>' + state.lands.filter(function (land) { return land.pipeline === key; }).map(function (land) { return '<p><b>' + esc(land.reference) + '</b> · ' + esc(land.commune) + '</p>'; }).join("") + '</div>'; }).join("") + '</div>';
    else content.innerHTML = '<div class="fp-panel"><table class="fp-table"><thead><tr><th>Terrain</th><th>Promoteur</th><th>Score</th><th>Justification</th></tr></thead><tbody>' + state.matches.map(function (match) { return '<tr><td>' + esc(match.land_id) + '</td><td>' + esc(match.promoter_id) + '</td><td><b>' + esc(match.score) + '/100</b></td><td>' + esc(match.explanation || "") + '<br>À vérifier : ' + esc((match.to_verify || []).join(", ")) + '</td></tr>'; }).join("") + '</tbody></table></div>';
    bind();
  }

  function bind() {
    content.querySelectorAll("[data-seller-save]").forEach(function (button) {
      button.onclick = async function () {
        var id = button.dataset.sellerSave;
        await api("/sellers/" + id, { method: "PATCH", body: JSON.stringify({ pipeline: content.querySelector('[data-seller-pipeline="' + id + '"]').value, priority_level: content.querySelector('[data-seller-priority="' + id + '"]').value, next_action: content.querySelector('[data-seller-action="' + id + '"]').value, next_follow_up: content.querySelector('[data-seller-followup="' + id + '"]').value || null }) });
        await load(); view = "sellers"; render();
      };
    });
    content.querySelectorAll("[data-save]").forEach(function (button) {
      button.onclick = async function () {
        var id = button.dataset.save;
        await api("/lands/" + id, { method: "PATCH", body: JSON.stringify({
          pipeline: content.querySelector('[data-pipeline="' + id + '"]').value,
          priority_level: content.querySelector('[data-priority="' + id + '"]').value,
          priority: content.querySelector('[data-priority="' + id + '"]').value === "P1",
          next_action: content.querySelector('[data-action="' + id + '"]').value,
          next_follow_up: content.querySelector('[data-followup="' + id + '"]').value || null
        }) });
        await load();
      };
    });
    content.querySelectorAll("[data-history]").forEach(function (button) {
      button.onclick = function () {
        var panel = content.querySelector("[data-history-panel]");
        panel.innerHTML = historyPanel(button.dataset.history);
        bind();
      };
    });
    content.querySelectorAll("[data-activity-form]").forEach(function (form) {
      form.onsubmit = async function (event) {
        event.preventDefault();
        var values = Object.fromEntries(new FormData(form));
        values.lead_id = form.dataset.activityForm;
        await api("/activities", { method: "POST", body: JSON.stringify(values) });
        await load();
        var panel = content.querySelector("[data-history-panel]");
        if (panel) panel.innerHTML = historyPanel(values.lead_id);
        bind();
      };
    });
    content.querySelectorAll("[data-complete]").forEach(function (button) {
      button.onclick = async function () {
        await api("/activities/" + button.dataset.complete + "/complete", { method: "PATCH", body: "{}" });
        await load();
      };
    });
  }

  async function load() {
    content.innerHTML = '<div class="fp-empty">Actualisation…</div>';
    try {
      state = await api("/summary");
      render();
    } catch (error) {
      content.innerHTML = '<div class="fp-error">' + esc(error.message) + '</div>';
    }
  }

  if (!cfg.supabaseUrl || !cfg.anonKey || !cfg.adminApiUrl || !window.supabase) {
    document.querySelector("[data-auth-status]").textContent = "Configuration Supabase administrateur non activée.";
    return;
  }

  client = window.supabase.createClient(cfg.supabaseUrl, cfg.anonKey);
  document.querySelector("[data-login-form]").onsubmit = async function (event) {
    event.preventDefault();
    var email = new FormData(event.target).get("email");
    var result = await client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.href, shouldCreateUser: true } });
    document.querySelector("[data-auth-status]").textContent = result.error ? result.error.message : "Lien envoyé. Consulte ta boîte email.";
  };
  document.querySelectorAll("[data-view]").forEach(function (button) {
    button.onclick = function () {
      document.querySelectorAll("[data-view]").forEach(function (item) { item.classList.remove("active"); });
      button.classList.add("active");
      view = button.dataset.view;
      render();
    };
  });
  document.querySelector("[data-refresh]").onclick = load;
  document.querySelector("[data-logout]").onclick = async function () { await client.auth.signOut(); location.reload(); };
  client.auth.getSession().then(function (result) {
    if (result.data.session) { login.hidden = true; app.hidden = false; load(); }
  });
})();
