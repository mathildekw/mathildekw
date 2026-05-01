function trackEvent(name, params) {
  if (!name) return;
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params || {});
  }
}

function encodeMessage(text) {
  return encodeURIComponent(text).replace(/%20/g, "+");
}

document.addEventListener("click", function (event) {
  var target = event.target.closest("[data-event]");
  if (!target) return;
  trackEvent(target.getAttribute("data-event"), {
    link_url: target.href || "",
    link_text: (target.textContent || "").trim()
  });
  if (target.getAttribute("data-event-secondary")) {
    trackEvent(target.getAttribute("data-event-secondary"), {
      link_url: target.href || "",
      link_text: (target.textContent || "").trim()
    });
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
    trackEvent("click_form_estimation", { form_location: window.location.pathname });
    window.location.href = "https://wa.me/33782475958?text=" + encodeMessage(message);
  });
});
