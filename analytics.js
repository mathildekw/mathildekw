(function () {
  "use strict";

  var measurementId = "G-C7YJNCBMD9";

  if (window.__mkGa4Initialized) return;
  window.__mkGa4Initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    script.dataset.mkGa4 = measurementId;
    script.onload = function () {
      document.documentElement.dataset.mkGa4 = "loaded";
    };
    script.onerror = function () {
      document.documentElement.dataset.mkGa4 = "blocked";
    };
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
    page_title: document.title,
    page_location: window.location.origin + window.location.pathname,
    page_path: window.location.pathname
  });

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || form.nodeName !== "FORM") return;
    window.gtag("event", "form_submit", {
      form_id: form.id || undefined,
      form_name: form.getAttribute("name") || form.dataset.joinType || undefined,
      page_path: window.location.pathname
    });
  }, true);

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (/^tel:/i.test(href)) window.gtag("event", "phone_click", { page_path: window.location.pathname });
    if (/wa\.me|whatsapp/i.test(href)) window.gtag("event", "whatsapp_click", { page_path: window.location.pathname });
  }, true);
})();
