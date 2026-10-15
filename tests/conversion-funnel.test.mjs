import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
function priority(d){let s=20;if(["Vendre à un promoteur","Vendre au meilleur prix possible"].includes(d.goal))s+=25;if(["Immédiatement","Dans les 3 mois"].includes(d.timeline))s+=20;if(/direct/i.test(d.access))s+=12;if(d.surface>=2000)s+=10;if(d.legal==="Propriétaire unique")s+=10;return s>=75?"P1":s>=50?"P2":"P3"}
function overlap(a,b){return new Date(a.start)<new Date(b.end)&&new Date(a.end)>new Date(b.start)}
function source(utm,ref=""){const s=(utm||"").toLowerCase(),r=ref.toLowerCase();if(/facebook|fb/.test(s+r))return"facebook";if(/instagram|ig/.test(s+r))return"instagram";if(/tiktok/.test(s+r))return"tiktok";if(/google/.test(s+r))return"google";if(/whatsapp|wa/.test(s+r))return"whatsapp";return ref?"other":"direct"}
assert.equal(priority({goal:"Vendre à un promoteur",timeline:"Immédiatement",access:"Accès direct",surface:3000,legal:"Propriétaire unique"}),"P1");
assert.equal(priority({goal:"Simplement connaître son potentiel",timeline:"Pas de calendrier",access:"Je ne sais pas",surface:600,legal:"Situation à clarifier"}),"P3");
assert.equal(overlap({start:"2026-10-15T20:00:00Z",end:"2026-10-15T20:45:00Z"},{start:"2026-10-15T20:30:00Z",end:"2026-10-15T21:15:00Z"}),true);
assert.equal(overlap({start:"2026-10-15T20:00:00Z",end:"2026-10-15T20:45:00Z"},{start:"2026-10-15T20:45:00Z",end:"2026-10-15T21:30:00Z"}),false);
assert.equal(source("instagram"),"instagram");assert.equal(source("",""),"direct");
assert.ok(!({phone:"",email:"",consent:false}.consent),"Un abandon anonyme ne doit pas être relancé");
const root=new URL("../",import.meta.url);
const [landing,funnel,leads,conversion,migration]=await Promise.all([
  readFile(new URL("foncier-promotion.html",root),"utf8"),
  readFile(new URL("foncier-promotion.js",root),"utf8"),
  readFile(new URL("supabase/functions/foncier-leads/index.ts",root),"utf8"),
  readFile(new URL("supabase/functions/foncier-conversion/index.ts",root),"utf8"),
  readFile(new URL("supabase/migrations/20261015080000_conversion_tunnel_optimization.sql",root),"utf8")
]);
assert.match(landing,/Et si ton terrain intéressait un promoteur immobilier/);
assert.equal((landing.match(/data-foncier-cta=/g)||[]).length,6);
assert.match(funnel,/Voici les premiers éléments de lecture de ton terrain/);
assert.match(funnel,/submitted_fingerprint/);
assert.match(leads,/found\s*\?await db\("foncier_land_leads\?id=eq\."\+found\.id,\{method:"PATCH"/);
assert.match(leads,/resolution=merge-duplicates/);
assert.match(conversion,/callback_requested.*notification_deliveries/s);
assert.match(migration,/cta_clicked/);
assert.match(migration,/step_completion/);
console.log("conversion-funnel: 16 assertions réussies");
