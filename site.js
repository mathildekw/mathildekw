function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, 140);
}

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
        "Telephone / WhatsApp : " + (data.get("telephone") || ""),
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
