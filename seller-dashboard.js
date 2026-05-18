(function () {
  var labels = {
    pageViews: "Vues de la page du bien",
    whatsappClicks: "Clics WhatsApp",
    phoneClicks: "Clics téléphone",
    infoRequests: "Demandes d’information",
    visitRequests: "Demandes de visite",
    qualifiedProspects: "Prospects qualifiés",
    completedVisits: "Visites réalisées"
  };

  var statusLabels = {
    "termine": "Terminé",
    "en-cours": "En cours",
    "prevu": "Prévu"
  };

  var interestLabels = {
    chaud: "Chaud",
    tiede: "Tiède",
    froid: "Froid"
  };

  function text(value) {
    return value == null || value === "" ? "À compléter" : String(value);
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

  function getProperty() {
    var params = new URLSearchParams(window.location.search);
    var isDemo = document.body.hasAttribute("data-seller-dashboard-demo");
    var slug = isDemo ? "maison-papeete-demo" : params.get("bien");
    var token = params.get("token");
    var data = window.MathildeClientSpaces && window.MathildeClientSpaces.sellerProperties;
    var property = data && data[slug];

    if (!property) return { error: "not-found", slug: slug };
    if (!isDemo && property.accessToken && token !== property.accessToken) {
      return { error: "locked", slug: slug };
    }

    return { property: property, isDemo: isDemo };
  }

  function renderLocked(root, state) {
    root.innerHTML = '<section class="client-shell"><div class="wrap"><article class="client-access-card"><p class="eyebrow">Espace vendeur privé</p><h1>Accès privé</h1><p>Ce tableau de bord est accessible uniquement avec un lien vendeur complet. Si tu es propriétaire, demande simplement le bon lien à Mathilde KW.</p><a class="btn primary" href="/vendre-bien-immobilier-tahiti.html">Retour page vendeur</a></article></div></section>';
    safeTrack("seller_dashboard_denied", { property_slug: state.slug || "", page_location: window.location.href });
  }

  function statCard(key, value) {
    return '<article class="client-stat-card"><span>' + labels[key] + '</span><strong>' + text(value) + '</strong></article>';
  }

  function actionRow(item) {
    var cls = item.status || "prevu";
    return '<article class="client-action-row"><div><span class="client-status ' + cls + '">' + text(statusLabels[cls] || item.status) + '</span><strong>' + text(item.label) + '</strong><p>' + text(item.comment) + '</p></div><time>' + text(item.date) + '</time></article>';
  }

  function feedbackRow(item) {
    var cls = item.interest || "tiede";
    return '<article class="client-feedback-row"><div><time>' + text(item.date) + '</time><strong>' + text(item.buyerProfile) + '</strong><span class="client-interest ' + cls + '">' + text(interestLabels[cls] || item.interest) + '</span></div><p>' + text(item.summary) + '</p><dl><dt>Objection</dt><dd>' + text(item.objection) + '</dd><dt>Prochaine action</dt><dd>' + text(item.nextAction) + '</dd></dl></article>';
  }

  function documentCard(item) {
    return '<a class="client-doc-card" href="' + (item.url || "#") + '" data-client-doc><strong>' + text(item.label) + '</strong><span>' + text(item.status) + '</span></a>';
  }

  function nextStep(item) {
    return '<article class="client-next-card"><strong>' + text(item.action) + '</strong><dl><dt>Date cible</dt><dd>' + text(item.targetDate) + '</dd><dt>Responsable</dt><dd>' + text(item.owner) + '</dd></dl><p>' + text(item.comment) + '</p></article>';
  }

  function renderDashboard(root, property, isDemo) {
    document.body.setAttribute("data-property-slug", property.slug);
    document.body.setAttribute("data-property-title", property.title);

    var stats = property.stats || {};
    var statHtml = Object.keys(labels).map(function (key) {
      return statCard(key, stats[key]);
    }).join("");
    var actions = (property.marketingActions || []).map(actionRow).join("") || '<p class="client-empty">Les premières actions seront ajoutées ici.</p>';
    var feedback = (property.marketFeedback || []).map(feedbackRow).join("") || '<p class="client-empty">Les retours acheteurs seront ajoutés après les premières demandes ou visites.</p>';
    var docs = (property.documents || []).map(documentCard).join("") || '<p class="client-empty">Les liens documents seront ajoutés lorsque les dossiers seront prêts.</p>';
    var next = (property.nextSteps || []).map(nextStep).join("") || '<p class="client-empty">Les prochaines étapes seront ajoutées ici.</p>';

    root.innerHTML = '<section class="client-hero"><div class="wrap client-hero-grid"><div><p class="eyebrow">' + (isDemo ? "Démonstration vendeur" : "Espace vendeur privé") + '</p><h1>' + text(property.title) + '</h1><p class="lead">' + text(property.welcomeMessage) + '</p><div class="client-hero-meta"><span>' + text(property.status) + '</span><span>' + text(property.price) + '</span><span>' + text(property.location) + '</span><span>Mise en ligne : ' + text(property.launchDate) + '</span></div></div><aside class="client-demo-note"><strong>' + (isDemo ? "Données fictives" : "Lien privé") + '</strong><p>' + (isDemo ? "Cette page sert à montrer le niveau de suivi possible en rendez-vous vendeur." : "Cette V1 est un suivi privé simple. Elle ne remplace pas un coffre-fort documentaire sécurisé.") + '</p></aside></div></section>' +
      '<main class="client-dashboard wrap">' +
      '<section class="client-section"><div class="client-section-head"><p class="eyebrow">Statistiques</p><h2>Visibilité et demandes</h2></div><div class="client-stats-grid">' + statHtml + '</div></section>' +
      '<section class="client-section"><div class="client-section-head"><p class="eyebrow">Commercialisation</p><h2>Actions marketing réalisées</h2></div><div class="client-action-list">' + actions + '</div></section>' +
      '<section class="client-section"><div class="client-section-head"><p class="eyebrow">Terrain</p><h2>Retours de visites et du marché</h2></div><div class="client-feedback-list">' + feedback + '</div></section>' +
      '<section class="client-section client-two-cols"><div><div class="client-section-head"><p class="eyebrow">Documents</p><h2>Documents utiles</h2></div><div class="client-doc-grid">' + docs + '</div></div><div><div class="client-section-head"><p class="eyebrow">Suite</p><h2>Prochaines étapes</h2></div><div class="client-next-list">' + next + '</div></div></section>' +
      '<section class="client-final"><div><h2>Besoin d’un point rapide ?</h2><p>Un tableau de bord aide à suivre, mais rien ne remplace une conversation claire quand une décision doit être prise.</p></div><div class="cta-row single"><a class="btn whatsapp" href="https://wa.me/33782475958?text=Ia%20ora%20na%20Mathilde%2C%20je%20souhaite%20faire%20un%20point%20sur%20mon%20espace%20vendeur." target="_blank" rel="noopener" data-event="whatsapp_click">Écrire sur WhatsApp</a><a class="btn ghost" href="tel:+68988078247" data-event="phone_click">Appeler Mathilde</a></div></section>' +
      '</main>';

    safeTrack("seller_dashboard_view", {
      property_slug: property.slug,
      property_title: property.title,
      page_location: window.location.href
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-seller-dashboard-root]");
    if (!root) return;

    var state = getProperty();
    if (state.error) {
      renderLocked(root, state);
      return;
    }

    renderDashboard(root, state.property, state.isDemo);

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
})();
