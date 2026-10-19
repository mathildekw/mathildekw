(function(){"use strict";
  document.querySelectorAll("[data-checklist]").forEach(function(list){
    var key="mk_checklist_"+location.pathname;
    var boxes=[].slice.call(list.querySelectorAll('input[type="checkbox"]'));
    var count=list.querySelector("[data-check-count]");
    var meter=list.querySelector("[data-check-meter]");
    try{var saved=JSON.parse(localStorage.getItem(key)||"[]");boxes.forEach(function(box,index){box.checked=saved.includes(index)})}catch(error){}
    function update(){var completed=boxes.filter(function(box){return box.checked}).length;count.textContent=completed+" / "+boxes.length+" préparés";meter.style.width=Math.round(100*completed/boxes.length)+"%";localStorage.setItem(key,JSON.stringify(boxes.map(function(box,index){return box.checked?index:null}).filter(function(value){return value!==null}))) }
    boxes.forEach(function(box){box.addEventListener("change",update)});update();
  });
  var decision=document.querySelector("[data-decision-tool]");
  if(decision){decision.addEventListener("submit",function(event){event.preventDefault();if(!decision.reportValidity())return;var values=[].slice.call(new FormData(decision).values());var buy=values.filter(function(value){return value==="buy"}).length;var rent=values.filter(function(value){return value==="rent"}).length;var result=document.querySelector("[data-decision-result]");var title=result.querySelector("h2"),copy=result.querySelector("p");if(buy>=rent+2){title.textContent="L’achat mérite d’être approfondi.";copy.textContent="Tes réponses indiquent un projet plutôt stable. L’étape utile est maintenant de cadrer ton budget, ton horizon et les biens compatibles — sans considérer ce résultat comme une recommandation financière."}else if(rent>=buy+2){title.textContent="La location peut préserver ta flexibilité.";copy.textContent="Tes réponses montrent un besoin de mobilité ou d’incertitude à clarifier. Comparer sereinement les contraintes d’un achat et celles d’une location peut t’éviter une décision trop rapide."}else{title.textContent="Les deux options restent ouvertes.";copy.textContent="Ton profil est équilibré. Le bon choix dépendra surtout de ton budget confirmé, de ton calendrier et de tes projets personnels. Mathilde peut t’aider à structurer la comparaison."}result.hidden=false;result.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});if(window.MKAnalytics)window.MKAnalytics.track("buy_or_rent_result",{profile:buy>rent?"buy":rent>buy?"rent":"balanced"})})}
})();
