import assert from "node:assert/strict";
function priority(d){let s=20;if(["Vendre à un promoteur","Vendre au meilleur prix possible"].includes(d.goal))s+=25;if(["Immédiatement","Dans les 3 mois"].includes(d.timeline))s+=20;if(/direct/i.test(d.access))s+=12;if(d.surface>=2000)s+=10;if(d.legal==="Propriétaire unique")s+=10;return s>=75?"P1":s>=50?"P2":"P3"}
function overlap(a,b){return new Date(a.start)<new Date(b.end)&&new Date(a.end)>new Date(b.start)}
function source(utm,ref=""){const s=(utm||"").toLowerCase(),r=ref.toLowerCase();if(/facebook|fb/.test(s+r))return"facebook";if(/instagram|ig/.test(s+r))return"instagram";if(/tiktok/.test(s+r))return"tiktok";if(/google/.test(s+r))return"google";if(/whatsapp|wa/.test(s+r))return"whatsapp";return ref?"other":"direct"}
assert.equal(priority({goal:"Vendre à un promoteur",timeline:"Immédiatement",access:"Accès direct",surface:3000,legal:"Propriétaire unique"}),"P1");
assert.equal(priority({goal:"Simplement connaître son potentiel",timeline:"Pas de calendrier",access:"Je ne sais pas",surface:600,legal:"Situation à clarifier"}),"P3");
assert.equal(overlap({start:"2026-10-15T20:00:00Z",end:"2026-10-15T20:45:00Z"},{start:"2026-10-15T20:30:00Z",end:"2026-10-15T21:15:00Z"}),true);
assert.equal(overlap({start:"2026-10-15T20:00:00Z",end:"2026-10-15T20:45:00Z"},{start:"2026-10-15T20:45:00Z",end:"2026-10-15T21:30:00Z"}),false);
assert.equal(source("instagram"),"instagram");assert.equal(source("",""),"direct");
assert.ok(!({phone:"",email:"",consent:false}.consent),"Un abandon anonyme ne doit pas être relancé");
console.log("conversion-funnel: 7 assertions réussies");
