(function () {
  "use strict";

  var privatePath = /^\/(?:admin-|admin\/|portail-foncier|espace-vendeur|demo-espace-vendeur|suivi-vendeur|etude-fonciere-privee|dossier-promoteur)/;
  if (privatePath.test(location.pathname) || window.__mkContentProtection) return;
  window.__mkContentProtection = true;

  function isEditable(node) {
    var element = node && (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
    return !!(element && element.closest("input, textarea, select, [contenteditable], [data-allow-copy]"));
  }

  function protectedSelection() {
    var selection = window.getSelection && window.getSelection();
    if (!selection || selection.isCollapsed) return false;
    return !isEditable(selection.anchorNode) && !isEditable(selection.focusNode);
  }

  function notify(message) {
    var notice = document.querySelector("[data-content-protection-notice]");
    if (!notice) {
      notice = document.createElement("div");
      notice.dataset.contentProtectionNotice = "";
      notice.className = "mk-content-protection-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.classList.add("is-visible");
    clearTimeout(notice._hideTimer);
    notice._hideTimer = setTimeout(function () { notice.classList.remove("is-visible"); }, 2400);
  }

  function install() {
    document.documentElement.classList.add("mk-content-protected");
    document.querySelectorAll("main img, main video").forEach(function (media) {
      media.draggable = false;
      media.setAttribute("draggable", "false");
    });

    document.addEventListener("dragstart", function (event) {
      if (event.target.closest && event.target.closest("main img, main video")) event.preventDefault();
    });
    document.addEventListener("contextmenu", function (event) {
      if (isEditable(event.target)) return;
      if (event.target.closest && event.target.closest("main, picture, img, video, canvas")) {
        event.preventDefault();
        notify("Contenu protégé — contacte Mathilde pour obtenir une autorisation d’utilisation.");
      }
    });
    document.addEventListener("copy", function (event) {
      if (!protectedSelection()) return;
      event.preventDefault();
      notify("La copie de ce contenu est désactivée.");
    });
    document.addEventListener("cut", function (event) {
      if (!isEditable(event.target)) event.preventDefault();
    });
  }

  var style = document.createElement("style");
  style.textContent = ".mk-content-protected main img,.mk-content-protected main video{-webkit-user-drag:none;-webkit-touch-callout:none}.mk-content-protected main :not(input):not(textarea):not(select):not([contenteditable]):not([data-allow-copy]){-webkit-user-select:none;user-select:none}.mk-content-protection-notice{position:fixed;left:50%;bottom:24px;z-index:2147483647;max-width:min(90vw,520px);padding:12px 18px;border-radius:999px;background:#17241f;color:#fff;font:600 14px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 12px 36px #0004;opacity:0;pointer-events:none;transform:translate(-50%,12px);transition:opacity .2s,transform .2s}.mk-content-protection-notice.is-visible{opacity:1;transform:translate(-50%,0)}@media print{.mk-content-protected main img,.mk-content-protected main picture,.mk-content-protected main video,.mk-content-protected main canvas{visibility:hidden!important}}@media(prefers-reduced-motion:reduce){.mk-content-protection-notice{transition:none}}";
  document.head.appendChild(style);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
