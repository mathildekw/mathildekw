function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, 140);
}

(function injectT2GalleryCtaStyles() {
  if (window.__mathildeT2GalleryCtaStyles) return;
  window.__mathildeT2GalleryCtaStyles = true;
  var css = [
    "@media (max-width: 860px) {",
    "  .t2-landing-page .t2-gallery { padding-bottom: 0 !important; }",
    "  .t2-landing-page .t2-gallery-action {",
    "    position: static !important;",
    "    inset: auto !important;",
    "    width: calc(100% - 20px) !important;",
    "    max-width: none !important;",
    "    margin: 8px auto 10px !important;",
    "    display: grid !important;",
    "    grid-template-columns: 1fr 1fr !important;",
    "    align-items: center !important;",
    "    gap: 8px !important;",
    "    padding: 8px !important;",
    "    border: 1px solid rgba(255,255,255,.62) !important;",
    "    border-radius: 18px !important;",
    "    background: linear-gradient(135deg, rgba(23,20,18,.94), rgba(42,33,27,.90)) !important;",
    "    box-shadow: 0 10px 28px rgba(35,24,17,.16) !important;",
    "    backdrop-filter: blur(10px) !important;",
    "    text-align: initial !important;",
    "  }",
    "  .t2-landing-page .t2-gallery-action [data-gallery-caption] { display: none !important; }",
    "  .t2-landing-page .t2-gallery-action .cta-gallery,",
    "  .t2-landing-page .t2-gallery-action .cta-gallery-call {",
    "    width: 100% !important;",
    "    min-height: 38px !important;",
    "    display: inline-flex !important;",
    "    align-items: center !important;",
    "    justify-content: center !important;",
    "    padding: 8px 10px !important;",
    "    border-radius: 999px !important;",
    "    font-size: 12px !important;",
    "    font-weight: 900 !important;",
    "    line-height: 1 !important;",
    "    text-decoration: none !important;",
    "    white-space: nowrap !important;",
    "  }",
    "  .t2-landing-page .t2-gallery-action .cta-gallery-call { background: rgba(255,255,255,.96) !important; color: #171412 !important; }",
    "  .t2-landing-page .t2-gallery-action .cta-gallery { background: var(--kw-red, #c8102e) !important; color: #fff !important; }",
    "  .t2-landing-page .t2-gallery-thumbs { margin-top: 0 !important; position: relative !important; z-index: 2 !important; }",
    "  .t2-landing-page .t2-gallery-nav { z-index: 4 !important; }",
    "  .t2-landing-page .t2-gallery-counter, .t2-landing-page .badge, .t2-landing-page .t2-gallery-hint { z-index: 5 !important; }",
    "}"
  ].join("\n");
  var style = document.createElement("style");
  style.id = "t2-gallery-cta-placement-fix";
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();

(function injectT2QuestionHelper() {
  if (window.__mathildeT2QuestionHelper) return;
  window.__mathildeT2QuestionHelper = true;

  function init() {
    if (window.location.pathname.indexOf("appartement-t2-punaauia-pk11.html") === -1) return;
    if (document.querySelector("[data-t2-question-helper]")) return;
    var summary = document.querySelector("#infos-t2 .t2-summary-grid");
    if (!summary || !summary.parentNode) return;

    var css = [
      ".t2-question-helper { margin: 18px auto 0; padding: 16px; border: 1.5px solid rgba(35,24,17,.08); border-radius: 22px; background: linear-gradient(135deg,#fff 0%,#fff7f5 100%); box-shadow: 0 12px 32px rgba(35,24,17,.07); }",
      ".t2-question-helper__top { display:flex; gap:12px; align-items:flex-start; justify-content:space-between; }",
      ".t2-question-helper__title { display:grid; gap:3px; }",
      ".t2-question-helper__title strong { color:#171412; font-size:16px; line-height:1.15; }",
      ".t2-question-helper__title span { color:var(--muted,#756a62); font-size:12px; line-height:1.35; }",
      ".t2-question-helper__badge { display:inline-flex; align-items:center; justify-content:center; min-width:38px; height:38px; border-radius:999px; background:#171412; color:#fff; font-size:18px; flex:0 0 auto; }",
      ".t2-question-helper__chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }",
      ".t2-question-helper__chips[hidden] { display:none !important; }",
      ".t2-question-helper button, .t2-question-helper a { -webkit-tap-highlight-color: transparent; }",
      ".t2-question-helper__chip { border:1px solid rgba(200,16,46,.15); background:#fff; color:#3e342d; border-radius:999px; min-height:34px; padding:7px 11px; font-weight:900; font-size:12px; cursor:pointer; }",
      ".t2-question-helper__chip.is-soft { background:#fff8f6; }",
      ".t2-question-helper__more { border:0; background:transparent; color:#8e1b2d; font-weight:900; font-size:12px; padding:7px 2px; cursor:pointer; }",
      ".t2-question-helper__answer { margin-top:12px; padding:12px; border-radius:16px; background:#171412; color:#fff; font-size:13px; line-height:1.45; display:none; }",
      ".t2-question-helper__answer.is-visible { display:block; }",
      ".t2-question-helper__answer p { margin:0; color:rgba(255,255,255,.88); }",
      ".t2-question-helper__cta { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }",
      ".t2-question-helper__cta a { display:inline-flex; align-items:center; justify-content:center; min-height:34px; padding:7px 12px; border-radius:999px; text-decoration:none; font-weight:900; font-size:12px; }",
      ".t2-question-helper__cta .whatsapp { background:var(--kw-red,#c8102e); color:#fff; }",
      ".t2-question-helper__cta .call { background:#fff; color:#171412; }",
      "@media (max-width:860px){ .t2-question-helper{margin-top:14px;padding:14px;border-radius:18px}.t2-question-helper__top{gap:9px}.t2-question-helper__title strong{font-size:15px}.t2-question-helper__chips{gap:7px}.t2-question-helper__chip{font-size:12px;min-height:33px;padding:7px 10px}.t2-question-helper__badge{min-width:34px;height:34px;font-size:16px} }"
    ].join("\n");
    var style = document.createElement("style");
    style.id = "t2-question-helper-style";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);

    var answers = {
      prix: "Le T2 est affiché à 39,5M XPF. Pour savoir s'il correspond à ton projet et à ton financement, le plus simple est d'échanger directement avec Mathilde.",
      surface: "Il fait 59,93 m² habitables, avec une varangue de 14,63 m².",
      location: "La location saisonnière type Airbnb n'est pas autorisée dans la copropriété. En revanche, la location longue durée est possible et fonctionne très bien sur ce secteur.",
      video: "La vidéo est envoyée sur demande après un échange rapide, pour vérifier que le bien correspond vraiment à ton projet.",
      visite: "Oui, les visites sont organisées sur demande. Le mieux est d'appeler Mathilde ou d'envoyer un WhatsApp pour valider le projet et les disponibilités.",
      investir: "Le bien peut être intéressant en longue durée selon ton financement et ton objectif. Mathilde peut t'aider à vérifier la cohérence du projet.",
      charges: "Bonne question : pour les charges et les éléments de copropriété, Mathilde préfère te répondre directement avec les informations à jour.",
      adresse: "Le bien est situé à Punaauia PK11. Les informations plus précises sont transmises dans le cadre d'un échange sérieux."
    };

    var helper = document.createElement("div");
    helper.className = "t2-question-helper";
    helper.setAttribute("data-t2-question-helper", "true");
    helper.innerHTML = [
      '<div class="t2-question-helper__top">',
      '  <div class="t2-question-helper__title"><strong>💬 Question rapide sur ce T2 ?</strong><span>Quelques réponses utiles, puis Mathilde te confirme les détails par appel ou WhatsApp.</span></div>',
      '  <span class="t2-question-helper__badge" aria-hidden="true">?</span>',
      '</div>',
      '<div class="t2-question-helper__chips">',
      '  <button class="t2-question-helper__chip" type="button" data-t2-helper-question="prix">Prix</button>',
      '  <button class="t2-question-helper__chip" type="button" data-t2-helper-question="surface">Surface</button>',
      '  <button class="t2-question-helper__chip" type="button" data-t2-helper-question="location">Location</button>',
      '  <button class="t2-question-helper__chip" type="button" data-t2-helper-question="video">Vidéo</button>',
      '  <button class="t2-question-helper__chip" type="button" data-t2-helper-question="visite">Visiter</button>',
      '  <button class="t2-question-helper__more" type="button" data-t2-helper-more>+ autres questions</button>',
      '</div>',
      '<div class="t2-question-helper__chips" hidden data-t2-helper-extra>',
      '  <button class="t2-question-helper__chip is-soft" type="button" data-t2-helper-question="investir">Investir</button>',
      '  <button class="t2-question-helper__chip is-soft" type="button" data-t2-helper-question="charges">Charges / copro</button>',
      '  <button class="t2-question-helper__chip is-soft" type="button" data-t2-helper-question="adresse">Adresse exacte</button>',
      '</div>',
      '<div class="t2-question-helper__answer" data-t2-helper-answer></div>'
    ].join("");

    summary.parentNode.insertBefore(helper, summary.nextSibling);

    var answerBox = helper.querySelector("[data-t2-helper-answer]");
    var extra = helper.querySelector("[data-t2-helper-extra]");
    var more = helper.querySelector("[data-t2-helper-more]");
    if (more && extra) {
      more.addEventListener("click", function () {
        var hidden = extra.hasAttribute("hidden");
        if (hidden) extra.removeAttribute("hidden"); else extra.setAttribute("hidden", "");
        more.textContent = hidden ? "- moins" : "+ autres questions";
        if (typeof trackEvent === "function") trackEvent("click_t2_helper_more", { event_category: "buyer_lead" });
      });
    }
    helper.querySelectorAll("[data-t2-helper-question]").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-t2-helper-question");
        var text = answers[key] || "Bonne question : Mathilde peut te répondre directement pour éviter une information incomplète.";
        answerBox.innerHTML = '<p>' + text + '</p><div class="t2-question-helper__cta"><a class="whatsapp" href="https://wa.me/33782475958?text=Ia%20ora%20na%20Mathilde%2C%20j%27ai%20une%20question%20sur%20le%20T2%20%C3%A0%20Punaauia%20PK11.%20Peux-tu%20m%27aider%20%C3%A0%20voir%20s%27il%20correspond%20%C3%A0%20mon%20projet%20%3F" target="_blank" rel="noopener" data-event="click_t2_helper_whatsapp">📱 WhatsApp</a><a class="call" href="tel:+68988078247" data-event="click_t2_helper_call">📞 Appeler</a></div>';
        answerBox.classList.add("is-visible");
        if (typeof trackEvent === "function") trackEvent("click_t2_helper_question", { event_category: "buyer_lead", question: key });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(function loadClarity() {
  if (window.clarity || window.__mathildeClarityLoaded) return;
  window.__mathildeClarityLoaded = true;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "whwpwxoeln");
})();

function getTrafficParams() {
  var search = new URLSearchParams(window.location.search);
  return {
    utm_source: cleanText(search.get("utm_source") || ""),
    utm_medium: cleanText(search.get("utm_medium") || ""),
    utm_campaign: cleanText(search.get("utm_campaign") || ""),
    utm_content: cleanText(search.get("utm_content") || ""),
    utm_term: cleanText(search.get("utm_term") || "")
  };
}

function classifyEvent(name) {
  if (!name) return "interaction";
  if (name.indexOf("whatsapp") !== -1 || name.indexOf("call") !== -1 || name.indexOf("email") !== -1) return "contact";
  if (name.indexOf("estimation") !== -1 || name.indexOf("form") !== -1 || name.indexOf("checklist") !== -1 || name.indexOf("sell_") !== -1 || name.indexOf("price_only") !== -1 || name.indexOf("discreet") !== -1) return "seller_lead";
  if (name.indexOf("visit") !== -1 || name.indexOf("virtual_tour") !== -1 || name.indexOf("t2") !== -1) return "buyer_lead";
  if (name.indexOf("share") !== -1 || name.indexOf("save_contact") !== -1 || name.indexOf("google_review") !== -1) return "trust";
  if (name.indexOf("scroll") !== -1 || name.indexOf("engaged") !== -1 || name.indexOf("section") !== -1) return "engagement";
  if (name.indexOf("field") !== -1 || name.indexOf("form_start") !== -1) return "form";
  if (name.indexOf("navigation") !== -1 || name.indexOf("outbound") !== -1) return "navigation";
  return "interaction";
}

function buildEventParams(target, extra) {
  var href = target && target.href ? target.href : "";
  var params = {
    event_category: classifyEvent(extra && extra.event_name ? extra.event_name : target && target.getAttribute("data-event")),
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title || "",
    link_url: href,
    link_text: cleanText(target ? target.textContent : ""),
    link_domain: href ? (function () { try { return new URL(href).hostname; } catch (e) { return ""; } })() : "",
    outbound: href ? !href.startsWith(window.location.origin) && !href.startsWith("/") : false
  };
  if (extra) {
    Object.keys(extra).forEach(function (key) {
      if (extra[key] !== undefined && extra[key] !== null) params[key] = extra[key];
    });
  }
  return params;
}

function trackEvent(name, params) {
  if (!name) return;
  var payload = params || {};
  if (!payload.event_category) payload.event_category = classifyEvent(name);
  if (!payload.page_location) payload.page_location = window.location.href;
  if (!payload.page_path) payload.page_path = window.location.pathname;
  if (!payload.page_title) payload.page_title = document.title || "";
  Object.assign(payload, getTrafficParams());
  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }
  trackMetaEvent(name, payload);
  if (typeof window.clarity === "function") {
    try {
      window.clarity("event", name);
    } catch (e) {}
  }
}

function trackMetaEvent(name, payload) {
  if (typeof window.fbq !== "function") return;
  var metaPayload = {
    content_name: payload && payload.page_title ? cleanText(payload.page_title) : document.title || "",
    content_category: payload && payload.event_category ? payload.event_category : classifyEvent(name),
    page_path: window.location.pathname
  };
  if (name.indexOf("submit_form") !== -1 || name === "form_submit") {
    window.fbq("track", "Lead", metaPayload);
    return;
  }
  if (name.indexOf("whatsapp") !== -1 || name.indexOf("call") !== -1 || name.indexOf("email") !== -1) {
    window.fbq("track", "Contact", metaPayload);
    return;
  }
  if (name.indexOf("virtual_tour") !== -1 || name.indexOf("t2_virtual") !== -1) {
    window.fbq("trackCustom", "VirtualTourIntent", metaPayload);
  }
}

function encodeMessage(text) {
  return encodeURIComponent(text).replace(/%20/g, "+");
}

var startedForms = new WeakSet();
var submittedForms = new WeakSet();
var abandonedForms = new WeakSet();

function getFormName(form) {
  if (!form) return "no_form";
  if (form.hasAttribute("data-estimation-form")) return "estimation";
  if (form.hasAttribute("data-usa-form")) return "usa_invest";
  if (form.hasAttribute("data-t2-virtual-form")) return "t2_virtual_visit";
  return form.getAttribute("name") || form.getAttribute("id") || "form";
}

function markFormSubmitted(form) {
  if (form) submittedForms.add(form);
}

document.addEventListener("click", function (event) {
  var target = event.target.closest("[data-event]");
  if (!target) return;
  var eventName = target.getAttribute("data-event");
  trackEvent(eventName, buildEventParams(target, { event_name: eventName }));
  var secondary = target.getAttribute("data-event-secondary");
  if (secondary) {
    trackEvent(secondary, buildEventParams(target, { event_name: secondary, primary_event: eventName }));
  }
});

document.addEventListener("click", function (event) {
  var target = event.target.closest("a, button, summary");
  if (!target || target.hasAttribute("data-event")) return;
  var href = target.href || "";
  var eventName = "click_untracked";
  if (target.matches("summary")) eventName = "click_faq_toggle";
  else if (href) eventName = href.startsWith(window.location.origin) || href.startsWith("/") ? "click_navigation" : "click_outbound";
  trackEvent(eventName, buildEventParams(target, { event_name: eventName, element_type: target.tagName.toLowerCase() }));
});

document.addEventListener("click", function (event) {
  var target = event.target.closest("[data-share]");
  if (!target) return;
  event.preventDefault();
  var shareData = {
    title: document.title || "Mathilde KW - KW Polynesie",
    text: "Contacte Mathilde pour ton projet immobilier a Tahiti.",
    url: target.getAttribute("data-share-url") || window.location.href
  };
  if (navigator.share) {
    navigator.share(shareData).catch(function () {});
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareData.url).then(function () {
      alert("Lien copie");
    });
  } else {
    alert(shareData.url);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  trackEvent("page_ready", {
    event_category: "engagement",
    referrer: document.referrer || "",
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    page_language: document.documentElement.lang || "",
    device_type: window.innerWidth < 768 ? "mobile" : "desktop"
  });

  if (window.location.pathname.indexOf("appartement-t2-punaauia-pk11.html") !== -1 && typeof window.fbq === "function") {
    var propertyPayload = {
      content_name: "T2 à Punaauia PK11 avec vue Moorea",
      content_category: "Bien immobilier",
      content_ids: ["appartement-t2-punaauia-pk11"],
      content_type: "product",
      value: 39500000,
      currency: "XPF"
    };
    window.fbq("track", "ViewContent", propertyPayload);
    if (window.location.hash === "#visite-virtuelle") {
      window.fbq("trackCustom", "ViewVirtualTour", propertyPayload);
    }
  }

  document.querySelectorAll("[data-t2-gallery]").forEach(function (gallery) {
    var main = gallery.querySelector("[data-gallery-main]");
    var indexLabel = gallery.querySelector("[data-gallery-index]");
    var action = gallery.querySelector("[data-gallery-action]");
    var caption = gallery.querySelector("[data-gallery-caption]");
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-thumb]"));
    if (!main || !thumbs.length) return;
    var current = 0;
    var photoInteractions = 0;

    function showPhoto(index, source) {
      current = (index + thumbs.length) % thumbs.length;
      var thumb = thumbs[current];
      photoInteractions += source ? 1 : 0;
      main.style.opacity = ".55";
      window.setTimeout(function () {
        main.src = thumb.getAttribute("data-full");
        main.alt = thumb.getAttribute("data-alt") || "";
        main.style.opacity = "1";
      }, 80);
      if (indexLabel) indexLabel.textContent = String(current + 1);
      if (caption) caption.textContent = thumb.getAttribute("data-caption") || "Cette photo te plaît ? Demande la fiche complète avant de programmer une visite.";
      thumbs.forEach(function (item, itemIndex) {
        item.classList.toggle("is-active", itemIndex === current);
      });
      if (action && photoInteractions >= 3) {
        gallery.classList.add("is-gallery-engaged");
        action.setAttribute("data-engaged", "true");
      }
      if (source) {
        trackEvent("view_t2_gallery_photo", {
          event_category: "buyer_lead",
          gallery_index: current + 1,
          gallery_source: source,
          image_url: thumb.getAttribute("data-full") || "",
          gallery_interactions: photoInteractions
        });
        if (photoInteractions === 3) {
          trackEvent("t2_gallery_cta_prompt", {
            event_category: "buyer_lead",
            gallery_index: current + 1,
            form_location: window.location.pathname
          });
        }
      }
    }

    gallery.querySelectorAll("[data-gallery-next]").forEach(function (button) {
      button.addEventListener("click", function () {
        showPhoto(current + 1, "next");
      });
    });
    gallery.querySelectorAll("[data-gallery-prev]").forEach(function (button) {
      button.addEventListener("click", function () {
        showPhoto(current - 1, "prev");
      });
    });
    thumbs.forEach(function (thumb, index) {
      thumb.addEventListener("click", function () {
        showPhoto(index, "thumb");
      });
    });
  });

  document.querySelectorAll(".nav-toggle").forEach(function (toggle) {
    if (!toggle.textContent.trim() || toggle.textContent.trim() === "☰") {
      toggle.textContent = "Menu";
    }
    toggle.addEventListener("click", function () {
      var nav = toggle.closest(".nav");
      var menu = nav ? nav.querySelector(".menu") : null;
      if (!menu) return;
      var isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.textContent = isOpen ? "Fermer le menu" : "Menu";
    });
  });

  function closeOpenMenusOnScroll() {
    document.querySelectorAll(".nav .menu.open").forEach(function (menu) {
      var nav = menu.closest(".nav");
      var toggle = nav ? nav.querySelector(".nav-toggle") : null;
      menu.classList.remove("open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      }
    });
    document.querySelectorAll(".home-menu.open").forEach(function (menu) {
      var toggle = document.querySelector(".menu-toggle[aria-controls='" + menu.id + "']") || document.querySelector(".menu-toggle");
      menu.classList.remove("open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      }
    });
  }

  var navBars = Array.prototype.slice.call(document.querySelectorAll(".topbar, .home-nav"));
  var lastScrollY = window.scrollY;
  var menuScrollStart = window.scrollY;

  function hasOpenMenu() {
    return Boolean(document.querySelector(".nav .menu.open, .home-menu.open"));
  }

  function updateAutoHideNav() {
    if (!navBars.length) return;
    var currentY = window.scrollY;
    var delta = currentY - lastScrollY;
    if (Math.abs(delta) < 8) return;

    var shouldHide = delta > 0 && currentY > 110 && !hasOpenMenu();
    navBars.forEach(function (bar) {
      bar.classList.toggle("is-nav-hidden", shouldHide);
    });
    lastScrollY = currentY;
  }

  window.addEventListener("scroll", function () {
    if (Math.abs(window.scrollY - menuScrollStart) < 12) return;
    menuScrollStart = window.scrollY;
    closeOpenMenusOnScroll();
    updateAutoHideNav();
  }, { passive: true });

  var form = document.querySelector("[data-estimation-form]");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      markFormSubmitted(form);
      var message = [
        "Ia ora na Mathilde, je souhaite une estimation gratuite de mon bien a Tahiti.",
        "",
        "Nom : " + (data.get("nom") || ""),
        "Telephone : " + (data.get("telephone") || ""),
        "Email : " + (data.get("email") || ""),
        "Commune : " + (data.get("commune") || ""),
        "Type de bien : " + (data.get("type") || ""),
        "Objectif : " + (data.get("objectif") || ""),
        "Surface approximative : " + (data.get("surface") || ""),
        "Secteur / repere : " + (data.get("adresse") || ""),
        "Message : " + (data.get("message") || ""),
        "",
        "Peux-tu me dire la prochaine etape pour recevoir une premiere analyse ?"
      ].join("\n");
      trackEvent("submit_form_estimation", {
        event_category: "seller_lead",
        form_location: window.location.pathname,
        property_type: data.get("type") || "",
        property_city: cleanText(data.get("commune") || ""),
        seller_goal: data.get("objectif") || "",
        filled_fields_count: Array.from(data.values()).filter(function (value) { return String(value || "").trim(); }).length
      });
      trackEvent("click_whatsapp_estimation", { event_category: "seller_lead", form_location: window.location.pathname, source: "estimation_form" });
      window.location.href = "https://wa.me/33782475958?text=" + encodeMessage(message);
    });
  }

  var usaForm = document.querySelector("[data-usa-form]");
  if (usaForm) {
    usaForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(usaForm);
      markFormSubmitted(usaForm);
      var message = [
        "Ia ora na Mathilde, je souhaite recevoir les infos sur l'investissement immobilier aux Etats-Unis.",
        "",
        "Prenom : " + (data.get("prenom") || ""),
        "Numero de telephone : " + (data.get("telephone") || ""),
        "Budget approximatif : " + (data.get("budget") || ""),
        "Message : " + (data.get("message") || "")
      ].join("\n");
      trackEvent("form_submit", {
        event_category: "form",
        form_name: "usa_invest",
        form_location: window.location.pathname,
        investor_budget: data.get("budget") || "",
        filled_fields_count: Array.from(data.values()).filter(function (value) { return String(value || "").trim(); }).length
      });
      trackEvent("submit_form_usa", {
        event_category: "investor_lead",
        form_location: window.location.pathname,
        investor_budget: data.get("budget") || "",
        filled_fields_count: Array.from(data.values()).filter(function (value) { return String(value || "").trim(); }).length
      });
      trackEvent("cta_whatsapp_click", { event_category: "contact", form_location: window.location.pathname, source: "usa_form" });
      trackEvent("click_whatsapp_usa", { event_category: "investor_lead", form_location: window.location.pathname, source: "usa_form" });
      window.location.href = "https://wa.me/33782475958?text=" + encodeMessage(message);
    });
  }

  var t2VirtualForm = document.querySelector("[data-t2-virtual-form]");
  if (t2VirtualForm) {
    t2VirtualForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(t2VirtualForm);
      markFormSubmitted(t2VirtualForm);
      var message = [
        "Ia ora na Mathilde, je souhaite recevoir les informations sur le T2 a Punaauia PK11.",
        "",
        "Prenom : " + (data.get("prenom") || ""),
        "Telephone : " + (data.get("telephone") || ""),
        "Projet : " + (data.get("projet") || ""),
        "Message : " + (data.get("message") || ""),
        "",
        "Je souhaite etre recontacte pour la fiche complete, la visite virtuelle ou une visite privee."
      ].join("\n");
      trackEvent("form_submit", {
        event_category: "form",
        form_name: "t2_virtual_visit",
        form_location: window.location.pathname,
        buyer_project: data.get("projet") || "",
        filled_fields_count: Array.from(data.values()).filter(function (value) { return String(value || "").trim(); }).length
      });
      trackEvent("submit_form_t2_virtual", {
        event_category: "buyer_lead",
        form_location: window.location.pathname,
        buyer_project: data.get("projet") || "",
        filled_fields_count: Array.from(data.values()).filter(function (value) { return String(value || "").trim(); }).length
      });
      trackEvent("click_whatsapp_t2_virtual_form", { event_category: "buyer_lead", form_location: window.location.pathname, source: "t2_virtual_form" });
      window.location.href = "https://wa.me/33782475958?text=" + encodeMessage(message);
    });
  }
});

(function () {
  var scrollMarks = [25, 50, 75, 90];
  var seenScroll = {};
  function maxScrollPercent() {
    var doc = document.documentElement;
    var scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    return Math.min(100, Math.round((window.scrollY / scrollable) * 100));
  }
  window.addEventListener("scroll", function () {
    var current = maxScrollPercent();
    scrollMarks.forEach(function (mark) {
      if (!seenScroll[mark] && current >= mark) {
        seenScroll[mark] = true;
        trackEvent("scroll_depth", { event_category: "engagement", scroll_percent: mark, value: mark });
        if (mark === 50 || mark === 90) {
          trackEvent("scroll_" + mark, { event_category: "engagement", scroll_percent: mark, value: mark });
        }
      }
    });
  }, { passive: true });

  [15, 30, 60, 120].forEach(function (seconds) {
    window.setTimeout(function () {
      trackEvent("engaged_time", { event_category: "engagement", engagement_seconds: seconds, value: seconds });
    }, seconds * 1000);
  });

  document.addEventListener("focusin", function (event) {
    var field = event.target.closest("input, select, textarea");
    if (!field) return;
    var form = field.closest("form");
    var formName = getFormName(form);
    if (form && !startedForms.has(form)) {
      startedForms.add(form);
      trackEvent("form_start", { event_category: "form", form_name: formName, form_location: window.location.pathname });
    }
    trackEvent("field_focus", {
      event_category: "form",
      form_name: formName,
      field_name: field.name || field.id || "",
      field_type: field.tagName.toLowerCase() === "select" ? "select" : (field.type || field.tagName.toLowerCase())
    });
  });

  document.addEventListener("change", function (event) {
    var field = event.target.closest("input, select, textarea");
    if (!field) return;
    trackEvent("field_change", {
      event_category: "form",
      field_name: field.name || field.id || "",
      field_type: field.tagName.toLowerCase() === "select" ? "select" : (field.type || field.tagName.toLowerCase()),
      has_value: !!String(field.value || "").trim()
    });
  });

  if ("IntersectionObserver" in window) {
    var seenSections = new WeakSet();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seenSections.has(entry.target)) return;
        seenSections.add(entry.target);
        var title = entry.target.querySelector("h1, h2, h3, .sec-title, .eyebrow");
        trackEvent("section_view", {
          event_category: "engagement",
          section_id: entry.target.id || "",
          section_title: cleanText(title ? title.textContent : entry.target.className)
        });
      });
    }, { threshold: 0.45 });
    document.querySelectorAll("section, .sec, .hero, .hero-path, .journey-panel, .contact-card").forEach(function (section) {
      observer.observe(section);
    });
  }

  var lastFaqUserAction = 0;
  document.addEventListener("click", function (event) {
    if (event.target.closest("summary")) lastFaqUserAction = Date.now();
  }, true);

  document.addEventListener("keydown", function (event) {
    if ((event.key === "Enter" || event.key === " ") && event.target.closest("summary")) {
      lastFaqUserAction = Date.now();
    }
  }, true);

  document.addEventListener("toggle", function (event) {
    if (!event.target.matches("details")) return;
    if (Date.now() - lastFaqUserAction > 1500) return;
    trackEvent(event.target.open ? "faq_open" : "faq_close", {
      event_category: "engagement",
      question: cleanText(event.target.querySelector("summary") ? event.target.querySelector("summary").textContent : "")
    });
  }, true);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "hidden") return;
    document.querySelectorAll("form").forEach(function (form) {
      if (!startedForms.has(form) || submittedForms.has(form) || abandonedForms.has(form)) return;
      abandonedForms.add(form);
      trackEvent("form_abandon", {
        event_category: "form",
        form_name: getFormName(form),
        form_location: window.location.pathname,
        max_scroll_percent: maxScrollPercent(),
        time_on_page_seconds: Math.round(performance.now() / 1000)
      });
    });
    trackEvent("page_hidden", {
      event_category: "engagement",
      max_scroll_percent: maxScrollPercent(),
      time_on_page_seconds: Math.round(performance.now() / 1000)
    });
  });
})();
