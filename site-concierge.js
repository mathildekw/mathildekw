(function () {
  "use strict";
  if (window.__mkConciergeLoaded) return;
  window.__mkConciergeLoaded = true;

  var config = Object.assign({
    apiUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/website-assistant",
    emailCaptureUrl: "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/form-intake"
  }, window.MK_SITE_CONFIG && window.MK_SITE_CONFIG.assistant || {});
  var sessionId = sessionStorage.getItem("mk_ai_session") || (crypto.randomUUID ? crypto.randomUUID() : "session-" + Date.now());
  sessionStorage.setItem("mk_ai_session", sessionId);
  var history = [];

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>\"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
    });
  }

  function track(name, metadata) {
    if (window.MKAnalytics && typeof window.MKAnalytics.track === "function") window.MKAnalytics.track(name, metadata || {});
  }

  function init() {
    if (!document.body || document.body.matches("[data-private-page],.admin-page")) return;
    var root = document.createElement("div");
    root.className = "mk-concierge";
    root.innerHTML = '<button class="mk-ai-launcher" type="button" aria-label="Discuter avec l’assistant du site" aria-expanded="false" aria-controls="mk-ai-panel"><span aria-hidden="true">M</span><b>Besoin d’aide&nbsp;?</b></button>' +
      '<section class="mk-ai-panel" id="mk-ai-panel" aria-label="Assistant immobilier IA" hidden>' +
        '<header><div><small>Assistant IA</small><strong>Comment puis-je t’aider&nbsp;?</strong></div><button type="button" data-ai-close aria-label="Fermer l’assistant">×</button></header>' +
        '<div class="mk-ai-messages" role="log" aria-live="polite"><div class="mk-ai-message assistant">Ia ora na ! Je suis le guide de mathildekw.com. Écris-moi ce que tu souhaites faire et je t’orienterai vers le bon service ou la bonne page. Si le site ne contient pas une réponse vérifiée, je te proposerai de contacter Mathilde.</div></div>' +
        '<div class="mk-ai-suggestions"><button type="button">Je veux vendre</button><button type="button">Je cherche un bien</button><button type="button">J’ai un terrain</button></div>' +
        '<form class="mk-ai-form"><label class="sr-only" for="mk-ai-question">Ton message pour l’assistant</label><textarea id="mk-ai-question" name="message" rows="1" maxlength="600" placeholder="Écris ton message à l’assistant…" required></textarea><button type="submit" aria-label="Envoyer le message à l’assistant">→</button></form>' +
        '<p class="mk-ai-note">Assistant automatisé : ne communique aucune donnée confidentielle. <a href="/politique-confidentialite.html">Confidentialité</a></p>' +
      '</section>';
    document.body.appendChild(root);

    var launcher = root.querySelector(".mk-ai-launcher");
    var panel = root.querySelector(".mk-ai-panel");
    var form = root.querySelector(".mk-ai-form");
    var input = form.querySelector("textarea");
    var messages = root.querySelector(".mk-ai-messages");
    function open() { panel.hidden = false; launcher.setAttribute("aria-expanded", "true"); track("assistant_opened"); input.focus(); }
    function close() { panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); launcher.focus(); }
    launcher.addEventListener("click", function () { panel.hidden ? open() : close(); });
    root.querySelector("[data-ai-close]").addEventListener("click", close);
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !panel.hidden) close(); });
    root.querySelectorAll(".mk-ai-suggestions button").forEach(function (button) { button.addEventListener("click", function () { input.value = button.textContent; form.requestSubmit(); }); });

    function addMessage(role, copy) {
      var bubble = document.createElement("div");
      bubble.className = "mk-ai-message " + role;
      bubble.innerHTML = escapeHtml(copy).replace(/\n/g, "<br>");
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var question = input.value.trim();
      if (!question || !config.apiUrl) return;
      input.value = "";
      addMessage("user", question);
      track("assistant_message_sent");
      history.push({ role: "user", content: question });
      var waiting = addMessage("assistant loading", "Je réfléchis…");
      form.querySelector("button").disabled = true;
      try {
        var response = await fetch(config.apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId, page_path: location.pathname, messages: history.slice(-8) }) });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || "Service momentanément indisponible");
        waiting.className = "mk-ai-message assistant";
        waiting.innerHTML = escapeHtml(data.answer).replace(/\n/g, "<br>");
        if (data.action && /^\/[A-Za-z0-9_./?=&%-]*$/.test(data.action.href || "")) {
          var action = document.createElement("a");
          action.className = "mk-ai-action";
          action.href = data.action.href;
          action.textContent = data.action.label || "Continuer";
          action.addEventListener("click", function () { track("assistant_route_clicked", { destination: data.action.href, category: data.category || data.guarded || "unknown" }); });
          waiting.appendChild(action);
        }
        if (data.category === "UNKNOWN") track("assistant_unknown_request");
        history.push({ role: "assistant", content: data.answer });
      } catch (error) {
        waiting.className = "mk-ai-message assistant error";
        waiting.innerHTML = 'Je ne peux pas répondre pour le moment. <a href="/contact.html">Contacte directement Mathilde</a>.';
      } finally { form.querySelector("button").disabled = false; input.focus(); }
    });
    scheduleEmailCapture();
  }

  function scheduleEmailCapture() {
    var storageKey = "mk_offers_prompt_v1";
    var previous = Number(localStorage.getItem(storageKey) || 0);
    if (previous && Date.now() - previous < 30 * 86400000) return;
    var remaining = 180000;
    var started = Date.now();
    var timer;
    function pause() { if (timer) { clearTimeout(timer); remaining -= Date.now() - started; timer = null; } }
    function resume() { if (timer || document.hidden) return; started = Date.now(); timer = setTimeout(showEmailCapture, Math.max(0, remaining)); }
    document.addEventListener("visibilitychange", function () { document.hidden ? pause() : resume(); });
    resume();

    function showEmailCapture() {
      localStorage.setItem(storageKey, String(Date.now()));
      var dialog = document.createElement("dialog");
      dialog.className = "mk-offers-dialog";
      dialog.innerHTML = '<form class="mk-offers-card"><button class="mk-offers-close" type="button" aria-label="Fermer">×</button><p class="eyebrow">Nouvelles opportunités</p><h2>Tu veux rester informé des nouvelles offres Keller Williams&nbsp;?</h2><p>Laisse ton email pour recevoir les nouveautés immobilières susceptibles de t’intéresser.</p><label for="mk-offers-email">Ton adresse email</label><input id="mk-offers-email" name="email" type="email" autocomplete="email" required placeholder="ton@email.com"><label class="mk-offers-consent"><input name="consent" type="checkbox" value="yes" required><span>J’accepte de recevoir ces informations et je peux me désinscrire à tout moment.</span></label><input name="website" class="sr-only" tabindex="-1" autocomplete="off"><button class="mk-offers-submit" type="submit">Me tenir informé·e</button><p class="mk-offers-status" role="status"></p><a class="mk-offers-privacy" href="/politique-confidentialite.html">Politique de confidentialité</a></form>';
      document.body.appendChild(dialog);
      var form = dialog.querySelector("form");
      dialog.querySelector(".mk-offers-close").addEventListener("click", function () { dialog.close(); });
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        var button = form.querySelector(".mk-offers-submit");
        var status = form.querySelector(".mk-offers-status");
        button.disabled = true; status.textContent = "Enregistrement…";
        try {
          var email = form.elements.email.value.trim().toLowerCase();
          var response = await fetch(config.emailCaptureUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "kw_offers_email", source: location.href, payload: { email: email, consent: true, consent_at: new Date().toISOString(), page_path: location.pathname, website: form.elements.website.value } }) });
          if (!response.ok) throw new Error();
          status.textContent = "Merci ! Ton email est bien enregistré.";
          button.hidden = true;
          setTimeout(function () { dialog.close(); }, 1600);
        } catch (error) { status.textContent = "L’enregistrement n’a pas abouti. Réessaie dans un instant."; button.disabled = false; }
      });
      dialog.addEventListener("close", function () { dialog.remove(); });
      dialog.showModal();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
