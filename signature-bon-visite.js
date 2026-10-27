(function () {
  "use strict";
  var status = document.querySelector("[data-signature-status]");
  var content = document.querySelector("[data-signature-content]");
  var form = document.querySelector("[data-signature-form]");
  var feedback = document.querySelector("[data-signature-feedback]");
  var signerError = document.querySelector("[data-signer-error]");
  var signerHelp = document.querySelector("[data-signer-help]");
  var submitButton = document.querySelector("[data-signature-submit]");
  var expectedSignerName = "";
  var requestId = new URLSearchParams(location.search).get("request") || "";
  var hash = new URLSearchParams(location.hash.slice(1));
  var accessToken = hash.get("access_token") || sessionStorage.getItem("mk_visit_access_token") || "";
  var apiUrl = "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/visit-signature";
  if (accessToken) sessionStorage.setItem("mk_visit_access_token", accessToken);
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("error", Boolean(isError));
  }

  function normalizeName(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
  }

  function clearInlineFeedback() {
    feedback.hidden = true;
    feedback.textContent = "";
    feedback.classList.remove("error", "success");
    signerError.hidden = true;
    signerError.textContent = "";
    form.elements.signerName.removeAttribute("aria-invalid");
  }

  function showFeedback(message, kind) {
    feedback.textContent = message;
    feedback.classList.toggle("error", kind === "error");
    feedback.classList.toggle("success", kind === "success");
    feedback.hidden = false;
    feedback.focus({ preventScroll: true });
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function call(action, body) {
    var response = await fetch(apiUrl + "/" + action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + accessToken },
      body: JSON.stringify(Object.assign({ action: action, requestId: requestId }, body || {}))
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || "La validation est momentanément indisponible.");
    return data;
  }

  function downloadCertificate(data) {
    if (!data.certificateBase64) return;
    var binary = atob(data.certificateBase64);
    var bytes = Uint8Array.from(binary, function (character) { return character.charCodeAt(0); });
    var url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = data.fileName || "bon-visite-signe.pdf";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  async function load() {
    if (!requestId || !accessToken) throw new Error("Ce lien est incomplet ou a expiré. Demande un nouvel email à Mathilde.");
    var data = await call("document");
    var documentData = data.document;
    document.querySelector("[data-property-label]").textContent = documentData.propertyLabel;
    document.querySelector("[data-property-reference]").textContent = documentData.propertyReference;
    document.querySelector("[data-consent-text]").textContent = documentData.consentText;
    var clauses = document.querySelector("[data-clauses]");
    var list = document.createElement("ul");
    documentData.clauses.forEach(function (clause) { var item = document.createElement("li"); item.textContent = clause; list.appendChild(item); });
    clauses.appendChild(list);
    expectedSignerName = documentData.prospect.fullName;
    form.elements.signerName.value = expectedSignerName;
    signerHelp.textContent = "Pour valider, conserve exactement ce nom : « " + expectedSignerName + " »";
    content.hidden = false;
    if (data.signedAt) {
      form.hidden = true;
      setStatus("Ce bon a déjà été signé.");
    } else setStatus("Ton adresse email est vérifiée. Relis le document avant de le signer.");
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearInlineFeedback();
    var signerName = form.elements.signerName.value;
    if (!signerName.trim()) {
      signerError.textContent = "Renseigne ton nom complet.";
      signerError.hidden = false;
      form.elements.signerName.setAttribute("aria-invalid", "true");
      form.elements.signerName.focus();
      return;
    }
    if (normalizeName(signerName) !== normalizeName(expectedSignerName)) {
      signerError.textContent = "Ce nom ne correspond pas à ta demande. Utilise exactement : « " + expectedSignerName + " ».";
      signerError.hidden = false;
      form.elements.signerName.setAttribute("aria-invalid", "true");
      form.elements.signerName.focus();
      return;
    }
    if (!form.elements.consent.checked) {
      showFeedback("Coche la confirmation avant de signer le bon de visite.", "error");
      form.elements.consent.focus();
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = "Signature en cours…";
    setStatus("Enregistrement de ta validation…");
    showFeedback("Enregistrement sécurisé de ta signature…", "loading");
    try {
      var data = await call("sign", { signerName: signerName, consent: true });
      setStatus("Le bon de visite est signé.");
      showFeedback(data.delivery === "sent" ? "C’est signé. Une copie vient de t’être envoyée par email." : "C’est signé. Ton certificat de preuve est enregistré et va être téléchargé.", "success");
      submitButton.hidden = true;
      downloadCertificate(data);
    } catch (error) {
      setStatus(error.message, true);
      showFeedback(error.message, "error");
      submitButton.disabled = false;
      submitButton.textContent = "Signer et confirmer le bon de visite";
    }
  });

  load().catch(function (error) { setStatus(error.message, true); });
})();
