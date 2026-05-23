(function () {
  var labels = {
    pageViews: "Vues de la page du bien",
    whatsappClicks: "Messages WhatsApp reçus",
    phoneClicks: "Appels reçus",
    smsClicks: "SMS reçus",
    infoRequests: "Demandes d’information",
    videoRequests: "Demandes vidéo",
    visitRequests: "Demandes de visite",
    plannedVisits: "Visites prévues",
    completedVisits: "Visites réalisées",
    qualifiedProspects: "Prospects qualifiés"
  };

  var statusLabels = {
    termine: "Terminé",
    "en-cours": "En cours",
    prevu: "Prévu",
    realisee: "Réalisée",
    planifiee: "Prévue"
  };

  var interestLabels = {
    chaud: "Chaud",
    tiede: "Tiède",
    froid: "Froid"
  };

  function text(value) {
    return value == null || value === "" ? "À compléter" : String(value);
  }

  function slugStatus(value) {
    return String(value || "prevu")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "prevu";
  }

  function safeTrack(eventName, params) {
    params = params || {};
    try {
      if (typeof window.trackEvent === "function") {
        window.trackEvent(eventName, params);
      } else if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
      }
    } catch (error) {}
  }

  function getParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      isDemo: document.body.hasAttribute("data-seller-dashboard-demo"),
      slug: params.get("bien"),
      token: params.get("token")
    };
  }

  function getConfig() {
    var config = window.MathildeClientSpaces && window.MathildeClientSpaces.config;
    return config || {};
  }

  function getLocalProperty(state) {
    var data = window.MathildeClientSpaces && window.MathildeClientSpaces.sellerProperties;
    var slug = state.isDemo ? "maison-papeete-demo" : state.slug;
    var property = data && data[slug];

    if (!property) return { error: "not-found", slug: slug };
    if (!state.isDemo && property.accessToken && state.token !== property.accessToken) {
      return { error: "locked", slug: slug };
    }

    return { property: property, isDemo: state.isDemo, source: "local" };
  }

  function normalizeApiProperty(payload, state) {
    var source = payload && (payload.property || payload.data || payload);
    if (!source || payload.ok === false || payload.error) {
      return {
        error: payload && (payload.error || payload.code) || "api-error",
        message: payload && payload.message
      };
    }

    return {
      property: {
        slug: source.slug || source.mandatId || source.id || state.slug,
        title: source.title || source.propertyTitle || source.nomBien || source.name,
        status: source.status || source.mandateStatus || source.statut,
        price: source.price || source.prix,
        location: source.location || source.commune || source.secteur,
        launchDate: source.launchDate || source.dateMiseEnLigne || source.date,
        welcomeMessage: source.welcomeMessage || source.message || "Ia ora na, bienvenue dans ton espace vendeur. Tu peux suivre ici les visites prévues, les retours des visites réalisées et les prochaines informations utiles pour avancer clairement.",
        stats: source.stats || {},
        marketingActions: source.marketingActions || source.actionsMarketing || [],
        plannedVisits: source.plannedVisits || source.visitesPrevues || [],
        completedVisitFeedback: source.completedVisitFeedback || source.visitesRealisees || source.marketFeedback || [],
        marketFeedback: source.marketFeedback || source.visitesRealisees || [],
        documents: source.documents || [],
        nextSteps: source.nextSteps || source.prochainesEtapes || []
      },
      isDemo: !!source.isDemo || state.isDemo,
      source: "google-sheets"
    };
  }

  function fetchApiProperty(state) {
    var config = getConfig();
    var url = String(config.appsScriptUrl || "").trim();
    if (!url || state.isDemo) return Promise.resolve(null);

    var endpoint = url +
      (url.indexOf("?") === -1 ? "?" : "&") +
      "bien=" + encodeURIComponent(state.slug || "") +
      "&token=" + encodeURIComponent(state.token || "");

    return requestJsonp(endpoint)
      .then(function (payload) {
        return normalizeApiProperty(payload, state);
      });
  }

  function requestJsonp(endpoint) {
    return new Promise(function (resolve, reject) {
      var callbackName = "__mathildeSellerDashboard" + Date.now() + Math.floor(Math.random() * 10000);
      var script = document.createElement("script");
      var cleanup = function () {
        try { delete window[callbackName]; } catch (error) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      };
      var timer = window.setTimeout(function () {
        cleanup();
        reject(new Error("Apps Script timeout"));
      }, 12000);

      window[callbackName] = function (payload) {
        window.clearTimeout(timer);
        cleanup();
        resolve(payload);
      };

      script.onerror = function () {
        window.clearTimeout(timer);
        cleanup();
        reject(new Error("Apps Script unavailable"));
      };
      script.src = endpoint + "&callback=" + encodeURIComponent(callbackName);
      document.head.appendChild(script);
    });
  }

  function renderMessage(root, options) {
    root.innerHTML = '<section class="client-shell"><div class="wrap"><article class="client-access-card"><p class="eyebrow">Espace vendeur privé</p><h1>' + text(options.title) + '</h1><p>' + text(options.message) + '</p><div class="cta-row single"><a class="btn primary" href="/suivi-vendeur.html">Réessayer</a><a class="btn ghost" href="/vendre-bien-immobilier-tahiti.html">Retour page vendeur</a></div></article></div></section>';
    safeTrack(options.eventName || "seller_dashboard_message", {
      property_slug: options.slug || "",
      page_location: window.location.href
    });
  }

  function renderLocked(root, state) {
    renderMessage(root, {
      title: "Accès privé invalide ou expiré.",
      message: "Vérifie l’identifiant du mandat et le code privé transmis par Mathilde KW. Si le lien ne fonctionne plus, demande simplement un nouvel accès.",
      slug: state.slug,
      eventName: "seller_dashboard_denied"
    });
  }

  function renderUnavailable(root, state) {
    renderMessage(root, {
      title: "Données momentanément indisponibles.",
      message: "Les données de suivi sont momentanément indisponibles. Réessaie dans quelques minutes ou contacte Mathilde KW si le problème persiste.",
      slug: state.slug,
      eventName: "seller_dashboard_unavailable"
    });
  }

  function visitRow(item, completed) {
    var cls = slugStatus(item.interest || item.niveauInteret || "tiede");
    var status = item.status || item.statut || (completed ? "Réalisée" : "Prévue");
    var body = completed
      ? '<p>' + text(item.summary || item.retour || item.retourProprietaire) + '</p><dl><dt>Objection</dt><dd>' + text(item.objection || item.objectionPrincipale) + '</dd><dt>Prochaine action</dt><dd>' + text(item.nextAction || item.prochaineAction) + '</dd></dl>'
      : '<p>Statut : ' + text(status) + '</p>';

    return '<article class="client-feedback-row"><div><time>' + text(item.date) + (item.time || item.heure ? " · " + text(item.time || item.heure) : "") + '</time><strong>' + text(item.buyerProfile || item.profilAcheteur || item.profil) + '</strong>' + (completed ? '<span class="client-interest ' + cls + '">' + text(interestLabels[cls] || item.interest || item.niveauInteret) + '</span>' : '<span class="client-interest planifiee">' + text(status) + '</span>') + '</div>' + body + '</article>';
  }

  function latestVisitAction(visits) {
    for (var index = visits.length - 1; index >= 0; index -= 1) {
      var item = visits[index] || {};
      var action = item.nextAction || item.prochaineAction;
      if (action) return action;
    }
    return "À compléter après les prochains retours.";
  }

  function ownerWelcomeMessage(property) {
    var fallback = "Ia ora na, bienvenue dans ton espace vendeur. Tu peux suivre ici les visites prévues, les retours des visites réalisées et les prochaines informations utiles pour avancer clairement.";
    var message = String(property.welcomeMessage || "");
    if (!message || /actions réalisées|statistiques|actions, les statistiques/i.test(message)) return fallback;
    return message;
  }

  function renderDashboard(root, property, isDemo, source) {
    document.body.setAttribute("data-property-slug", property.slug);
    document.body.setAttribute("data-property-title", property.title);

    var plannedItems = property.plannedVisits || [];
    var completedItems = property.completedVisitFeedback || property.marketFeedback || [];
    var plannedVisits = plannedItems.map(function (item) { return visitRow(item, false); }).join("") || '<p class="client-empty">Aucune visite prévue pour le moment. Dès qu’un créneau est confirmé, il apparaîtra ici.</p>';
    var completed = completedItems.map(function (item) { return visitRow(item, true); }).join("") || '<p class="client-empty">Les retours de visites seront ajoutés après les premiers rendez-vous.</p>';
    var lastAction = latestVisitAction(completedItems);
    var visitSummary = '<div class="client-stats-grid owner-visit-summary">' +
      '<article class="client-stat-card"><span>Visites prévues</span><strong>' + plannedItems.length + '</strong></article>' +
      '<article class="client-stat-card"><span>Retours de visites</span><strong>' + completedItems.length + '</strong></article>' +
      '<article class="client-stat-card"><span>Prochaine action liée aux visites</span><strong>' + text(lastAction) + '</strong></article>' +
      '</div>';

    root.innerHTML = '<section class="client-hero"><div class="wrap client-hero-grid"><div><p class="eyebrow">' + (isDemo ? "Démonstration vendeur" : "Espace vendeur privé") + '</p><h1>' + text(property.title) + '</h1><p class="lead">' + text(ownerWelcomeMessage(property)) + '</p><div class="client-hero-meta"><span>' + text(property.status) + '</span><span>' + text(property.price) + '</span><span>' + text(property.location) + '</span><span>Mise en ligne : ' + text(property.launchDate) + '</span></div></div><aside class="client-demo-note"><strong>' + (isDemo ? "Données fictives" : "Suivi propriétaire") + '</strong><p>' + (isDemo ? "Cette page sert à montrer le niveau de suivi possible en rendez-vous vendeur." : "Les données affichées viennent du suivi préparé par Mathilde KW. Les notes internes restent privées.") + '</p></aside></div></section>' +
      '<main class="client-dashboard wrap">' +
      '<section class="client-section"><div class="client-section-head"><p class="eyebrow">Vue rapide</p><h2>Suivi des visites</h2><p>L’espace propriétaire se concentre volontairement sur les visites : les rendez-vous prévus, les retours reçus et les prochaines actions utiles.</p></div>' + visitSummary + '</section>' +
      '<section class="client-section client-two-cols"><div><div class="client-section-head"><p class="eyebrow">À venir</p><h2>Visites prévues</h2></div><div class="client-feedback-list">' + plannedVisits + '</div></div><div><div class="client-section-head"><p class="eyebrow">Retours terrain</p><h2>Visites réalisées</h2></div><div class="client-feedback-list">' + completed + '</div></div></section>' +
      '<section class="client-final"><div><h2>Besoin d’un point rapide ?</h2><p>Les retours de visites donnent une vraie lecture du marché. Si une décision doit être prise, on en parle simplement ensemble.</p></div><div class="cta-row single"><a class="btn whatsapp" href="https://wa.me/33782475958?text=Ia%20ora%20na%20Mathilde%2C%20je%20souhaite%20faire%20un%20point%20sur%20les%20visites%20de%20mon%20bien." target="_blank" rel="noopener" data-event="whatsapp_click">Écrire sur WhatsApp</a><a class="btn ghost" href="tel:+68988078247" data-event="phone_click">Appeler Mathilde</a></div></section>' +
      '</main>';

    safeTrack("seller_dashboard_view", {
      property_slug: property.slug,
      property_title: property.title,
      dashboard_source: source || "local",
      page_location: window.location.href
    });
  }

  function resolveState() {
    var state = getParams();
    return fetchApiProperty(state)
      .then(function (apiState) {
        if (apiState) return apiState;
        return getLocalProperty(state);
      })
      .catch(function () {
        if (getConfig().appsScriptUrl && !state.isDemo) {
          return { error: "unavailable", slug: state.slug };
        }
        return getLocalProperty(state);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-seller-dashboard-root]");
    if (!root) return;
    root.innerHTML = '<section class="client-shell"><div class="wrap"><article class="client-access-card"><p class="eyebrow">Espace vendeur privé</p><h1>Chargement du suivi...</h1><p>Je récupère les informations autorisées pour ce mandat.</p></article></div></section>';

    resolveState().then(function (state) {
      if (state.error === "locked" || state.error === "not-found" || state.error === "invalid-token" || state.error === "inactive") {
        renderLocked(root, state);
        return;
      }
      if (state.error) {
        renderUnavailable(root, state);
        return;
      }

      renderDashboard(root, state.property, state.isDemo, state.source);

      root.addEventListener("click", function (event) {
        var doc = event.target.closest("[data-client-doc]");
        if (doc && doc.getAttribute("href") === "#") {
          event.preventDefault();
          safeTrack("seller_document_placeholder_click", {
            property_slug: state.property.slug,
            property_title: state.property.title,
            document_name: doc.textContent.replace(/\s+/g, " ").trim()
          });
        }
      });
    });
  });
})();
