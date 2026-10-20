(function(){
  "use strict";

  var body=document.body;
  var status=document.querySelector("[data-status]");
  var favorite=document.querySelector("[data-favorite]");
  var share=document.querySelector("[data-share]");
  var favoriteKey="mk_demo_aora_favorite";

  function track(name,properties){
    if(window.MKAnalytics)window.MKAnalytics.track(name,Object.assign({demo:true},properties||{}));
  }

  function announce(message){
    if(status)status.textContent=message;
  }

  function favoriteIsSaved(){
    try{return localStorage.getItem(favoriteKey)==="yes"}catch(error){return false}
  }

  function renderFavorite(){
    if(!favorite)return;
    var saved=favoriteIsSaved();
    favorite.textContent=saved?"Retirer des favoris":"Ajouter aux favoris";
    favorite.setAttribute("aria-pressed",String(saved));
  }

  document.querySelectorAll("[data-mode-button]").forEach(function(button){
    button.onclick=function(){
      body.dataset.mode=button.dataset.modeButton;
      document.querySelectorAll("[data-mode-button]").forEach(function(item){item.setAttribute("aria-pressed",String(item===button))});
      track("immersive_mode_changed",{mode:button.dataset.modeButton});
    };
  });

  if(favorite)favorite.onclick=function(){
    var saved=favoriteIsSaved();
    try{localStorage.setItem(favoriteKey,saved?"no":"yes")}catch(error){announce("Le favori ne peut pas être enregistré sur cet appareil.");return}
    renderFavorite();
    announce(saved?"Démonstration retirée des favoris de cet appareil.":"Démonstration ajoutée aux favoris de cet appareil.");
    track(saved?"immersive_favorite_removed":"immersive_favorite_added");
  };

  if(share)share.onclick=async function(){
    var data={title:"Démonstration immobilière immersive",text:"Découvre cette démonstration fictive de Mathilde KW.",url:location.href};
    try{
      if(navigator.share){
        await navigator.share(data);
        track("immersive_shared",{method:"native"});
        return;
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(data.url);
        announce("Lien copié.");
        track("immersive_shared",{method:"clipboard"});
        return;
      }
      throw new Error("share_unavailable");
    }catch(error){
      if(error&&error.name==="AbortError")return;
      var whatsapp="https://wa.me/?text="+encodeURIComponent(data.text+" "+data.url);
      window.open(whatsapp,"_blank","noopener,noreferrer");
      announce("WhatsApp est prêt : tu gardes la main sur l’envoi.");
      track("immersive_shared",{method:"whatsapp_fallback"});
    }
  };

  renderFavorite();
  track("immersive_property_viewed");
})();
