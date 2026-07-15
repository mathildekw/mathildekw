(function(){
  var endpoint = "https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/video-visit";
  var form = document.querySelector("[data-video-visit-form]");
  var statusBox = document.querySelector("[data-video-status]");
  var resultBox = document.querySelector("[data-video-result]");
  var player = document.querySelector("[data-video-player]");
  var download = document.querySelector("[data-video-download]");

  function setStatus(message, kind){
    if(!statusBox)return;
    statusBox.textContent = message;
    statusBox.className = "status-box is-visible " + (kind || "ok");
  }

  function setStatusLink(message, href, label){
    if(!statusBox)return;
    statusBox.textContent = "";
    var text = document.createElement("span");
    text.textContent = message + " ";
    statusBox.appendChild(text);
    if(href){
      var link = document.createElement("a");
      link.href = href;
      link.textContent = label || "Signer maintenant";
      link.target = "_blank";
      link.rel = "noopener";
      statusBox.appendChild(link);
    }
    statusBox.className = "status-box is-visible ok";
  }

  function params(){
    return new URLSearchParams(window.location.search);
  }

  function preselectReference(){
    if(!form)return;
    var ref = params().get("ref");
    if(ref){
      var field = form.querySelector("[name='reference']");
      if(field)field.value = ref;
    }
  }

  function protectPrivateForm(){
    if(!form)return;
    if(params().get("request") && params().get("token"))return;
    if(params().get("verify"))return;
    if(params().get("invite"))return;

    form.style.display = "none";
    setStatus("Cette page est privee. Pour recevoir une invitation de visite video, contacte Mathilde par WhatsApp.", "error");
  }

  async function post(payload){
    var response = await fetch(endpoint, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    var data = await response.json().catch(function(){return{}});
    if(!response.ok)throw new Error(data.error || "Erreur serveur.");
    return data;
  }

  async function requestSignature(event){
    event.preventDefault();
    var data = new FormData(form);
    var button = form.querySelector("button[type='submit']");
    if(button)button.disabled = true;
    setStatus("Demande en cours d'envoi...", "ok");

    try{
      var result = await post({
        action: "request-signature",
        reference: data.get("reference"),
        inviteToken: params().get("invite"),
        fullName: data.get("fullName"),
        email: data.get("email"),
        phone: data.get("phone"),
        project: data.get("project"),
        financingStatus: data.get("financingStatus"),
        message: data.get("message")
      });
      form.reset();
      if(result.signingUrl){
        setStatusLink("Demande recue. Un email Documenso vient d'etre envoye pour signer le bon de visite. Verifie aussi les spams. Tu peux aussi signer directement ici :", result.signingUrl, "ouvrir la signature");
      }else{
        setStatus("Demande recue. Tu vas recevoir un email Documenso pour signer le bon de visite. La video sera disponible apres signature.", "ok");
      }
    }catch(error){
      setStatus(error.message || "Impossible d'envoyer la demande.", "error");
    }finally{
      if(button)button.disabled = false;
    }
  }

  async function verifySignedDocument(){
    var requestId = params().get("verify");
    if(!requestId)return;

    if(form)form.style.display = "none";
    setStatus("Verification de la signature Documenso...", "ok");

    try{
      var result = await post({action:"verify-signature", requestId:requestId});
      if(result.accessUrl){
        window.location.href = result.accessUrl;
        return;
      }
      setStatus("Signature validee. Ouverture de la video...", "ok");
    }catch(error){
      setStatus(error.message || "La signature n'est pas encore validee par Documenso.", "error");
    }
  }

  async function loadSignedVideo(){
    var requestId = params().get("request");
    var accessToken = params().get("token");
    if(!requestId || !accessToken)return;

    setStatus("Verification de la signature...", "ok");

    try{
      var result = await post({action:"access", requestId:requestId, accessToken:accessToken});
      if(player)player.src = result.signedUrl;
      if(download)download.href = result.signedUrl;
      if(resultBox)resultBox.classList.add("is-visible");
      setStatus("Signature validee. Acces video ouvert.", "ok");
    }catch(error){
      setStatus(error.message || "La video sera disponible apres signature du bon de visite.", "error");
    }
  }

  preselectReference();
  protectPrivateForm();
  if(form)form.addEventListener("submit", requestSignature);
  verifySignedDocument();
  loadSignedVideo();
})();
