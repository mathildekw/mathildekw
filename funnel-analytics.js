(function(){"use strict";
var cfg=(window.MK_SITE_CONFIG&&window.MK_SITE_CONFIG.foncier)||{},endpoint=cfg.conversionApiUrl||"";
function id(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
var session=sessionStorage.getItem("pk_funnel_session")||id();sessionStorage.setItem("pk_funnel_session",session);
var params=new URLSearchParams(location.search),utm={};["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].forEach(function(k){if(params.get(k))utm[k]=params.get(k).slice(0,120)});
if(Object.keys(utm).length)localStorage.setItem("pk_funnel_utm",JSON.stringify(utm));else try{utm=JSON.parse(localStorage.getItem("pk_funnel_utm")||"{}") }catch(e){utm={}}
function source(){var s=(utm.utm_source||"").toLowerCase(),r=document.referrer.toLowerCase();if(/facebook|fb/.test(s+r))return"facebook";if(/instagram|ig/.test(s+r))return"instagram";if(/tiktok/.test(s+r))return"tiktok";if(/google/.test(s+r))return"google";if(/whatsapp|wa/.test(s+r))return"whatsapp";return document.referrer?"other":"direct"}
var variant=localStorage.getItem("pk_funnel_variant");if(!/[ABC]/.test(variant||"")){variant=["A","B","C"][Math.floor(Math.random()*3)];localStorage.setItem("pk_funnel_variant",variant)}
var copy={A:"Ton terrain intéresse-t-il un promoteur ?",B:"Et si ton terrain valait davantage grâce à son potentiel immobilier ?",C:"Tu possèdes un terrain en bord de route à Tahiti ?"},hero=document.querySelector("[data-ab-headline]");if(hero){hero.textContent=copy[variant];hero.dataset.variant=variant}
function track(name,metadata){if(!endpoint)return Promise.resolve(false);return fetch(endpoint.replace(/\/$/,"")+"/public/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event_name:name,session_id:session,page_path:location.pathname,traffic_source:source(),utm:utm,ab_variant:variant,metadata:metadata||{}}),keepalive:true}).then(function(r){return r.ok}).catch(function(){return false})}
window.PKFunnel={track:track,context:{session_id:session,traffic_source:source(),utm:utm,ab_variant:variant}};
if(document.body.classList.contains("fp")&&!document.getElementById("land-form"))track("landing_view");
})();
