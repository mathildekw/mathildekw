/**
 * Webhook Google Apps Script pour « Suivi KW Impact ».
 * Supabase reste la source principale. Le marqueur [SUPABASE:<uuid>] garantit
 * qu'une reprise réseau met à jour la ligne existante au lieu de la dupliquer.
 *
 * Configuration requise dans Apps Script :
 * - Script property PK_WEBHOOK_SECRET
 * - Script property PK_SPREADSHEET_ID = 1uNmxR1H9cj_CuHE_sQxCqB_K4PqQfGonIhvr4WTCzqE
 * Déployer comme application Web exécutée par la propriétaire du classeur.
 */

const TARGET_TAB = "Journal";
const TIMEZONE = "Pacific/Tahiti";

function doPost(event) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty("PK_WEBHOOK_SECRET");
    const providedSecret = event && event.parameter ? event.parameter.key : "";
    if (!expectedSecret || providedSecret !== expectedSecret) return reply({ ok: false, error: "unauthorized" }, 401);

    const payload = JSON.parse((event.postData && event.postData.contents) || "{}");
    if (payload.kind !== "land_lead" || !payload.unique_id || !payload.row) {
      return reply({ ok: false, error: "invalid_payload" }, 400);
    }

    const spreadsheetId = properties.getProperty("PK_SPREADSHEET_ID");
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(TARGET_TAB);
    if (!sheet) return reply({ ok: false, error: "missing_target_tab" }, 500);

    const lead = payload.row;
    const marker = `[SUPABASE:${payload.unique_id}]`;
    const existing = sheet.createTextFinder(marker).matchCase(true).findNext();
    const now = new Date();
    const values = [[
      Utilities.formatDate(now, TIMEZONE, "dd/MM/yyyy"),
      momentLabel(now),
      [lead.first_name, lead.last_name].filter(Boolean).join(" "),
      ["Terrain", lead.commune, lead.surface ? `${lead.surface} m²` : "", lead.cadastre || ""].filter(Boolean).join(" · "),
      [lead.phone, lead.email].filter(Boolean).join(" / "),
      "Foncier",
      "Mathildekw.com — Diagnostic foncier",
      pipelineLabel(lead.pipeline),
      `Priorité ${lead.priority_level || "P3"} · score ${lead.qualification_score || 0}/100`,
      "",
      lead.next_action || "Premier contact propriétaire",
      lead.next_follow_up ? Utilities.formatDate(new Date(lead.next_follow_up), TIMEZONE, "dd/MM/yyyy HH:mm") : "",
      "",
      "",
      `${marker} Consentement traitement: ${lead.privacy_consent ? "oui" : "non"}. Canal préféré: ${lead.preferred_channel || "non précisé"}.`,
      lead.comment || ""
    ]];

    if (existing) {
      sheet.getRange(existing.getRow(), 1, 1, values[0].length).setValues(values);
      return reply({ ok: true, action: "updated", row: existing.getRow() }, 200);
    }

    const rowNumber = Math.max(2, sheet.getLastRow() + 1);
    sheet.getRange(rowNumber, 1, 1, values[0].length).setValues(values);
    return reply({ ok: true, action: "created", row: rowNumber }, 201);
  } catch (error) {
    console.error(error);
    return reply({ ok: false, error: String(error).slice(0, 300) }, 500);
  } finally {
    lock.releaseLock();
  }
}

function pipelineLabel(value) {
  return ({
    new: "Nouveau lead", qualify: "À qualifier", contacted: "Premier contact",
    appointment: "Rendez-vous prévu", study: "Étude en cours",
    mandate_proposal: "Proposition de mandat", mandate_signed: "Mandat signé",
    promoter_presentation: "Présentation promoteurs", offer: "Offre reçue",
    agreement: "Compromis", sold: "Vente réalisée", follow_up: "À relancer",
    not_relevant: "Non pertinent", abandoned: "Abandonné"
  })[value] || "Nouveau lead";
}

function momentLabel(date) {
  const hour = Number(Utilities.formatDate(date, TIMEZONE, "H"));
  if (hour < 11) return "Matin";
  if (hour < 14) return "Midi";
  if (hour < 18) return "Aprem";
  return "Soir";
}

function reply(body, status) {
  // Apps Script Web Apps always return HTTP 200 through ContentService. The
  // explicit status is included in JSON and checked by the Supabase connector.
  return ContentService.createTextOutput(JSON.stringify({ ...body, status }))
    .setMimeType(ContentService.MimeType.JSON);
}
