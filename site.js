function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, 140);
}

function classifyEvent(name) {
  if (!name) return "interaction";
  if (name.indexOf("whatsapp") !== -1 || name.indexOf("call") !== -1 || name.indexOf("email") !== -1) return "contact";
  if (name.indexOf("estimation") !== -1 || name.indexOf("form") !== -1) return "seller_lead";
  if (name.indexOf("visit") !== -1 || name.indexOf("virtual_tour") !== -1 || name.indexOf("t2") !== -1) return "buyer_lead";
  if (name.indexOf("share") !== -1 || name.indexOf("save_contact") !== -1 || name.indexOf("google_review") !== -1) return "trust";
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
  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
  }
}

function encodeMessage(text) {
  return encodeURIComponent(text).replace(/%20/g, "+");
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
  var target = event.target.closest("[data-share]");
  if (!target) return;
  event.preventDefault();
  var shareData = {
    title: document.title || "Mathilde Tuduri - KW Polynesie",
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
  var form = document.querySelector("[data-estimation-form]");
  if (!form) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var message = [
      "Ia ora na Mathilde, je souhaite faire estimer mon bien immobilier a Tahiti.",
      "",
      "Nom : " + (data.get("nom") || ""),
      "Telephone : " + (data.get("telephone") || ""),
      "Email : " + (data.get("email") || ""),
      "Commune : " + (data.get("commune") || ""),
      "Type de bien : " + (data.get("type") || ""),
      "Objectif : " + (data.get("objectif") || ""),
      "Message : " + (data.get("message") || "")
    ].join("\n");
    trackEvent("submit_form_estimation", {
      event_category: "seller_lead",
      form_location: window.location.pathname,
      property_type: data.get("type") || "",
      property_city: data.get("commune") || "",
      seller_goal: data.get("objectif") || ""
    });
    trackEvent("click_whatsapp_estimation", { event_category: "seller_lead", form_location: window.location.pathname, source: "estimation_form" });
    window.location.href = "https://wa.me/33782475958?text=" + encodeMessage(message);
  });
});
