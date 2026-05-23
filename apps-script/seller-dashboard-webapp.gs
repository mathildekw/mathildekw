/**
 * Espace vendeur Mathilde KW - Google Apps Script Web App
 *
 * Installation:
 * 1. Ouvrir le Google Sheet "Mon CRM".
 * 2. Extensions > Apps Script.
 * 3. Coller ce fichier dans Code.gs.
 * 4. Déployer > Nouveau déploiement > Application Web.
 * 5. Exécuter en tant que: moi.
 * 6. Accès: toute personne disposant du lien.
 *
 * Le script ne renvoie que les champs propriétaires autorisés.
 * Les notes privées, noms internes, emails, téléphones prospects et colonnes internes
 * ne sont jamais inclus dans le JSON.
 */

const SHEET_NAMES = {
  CONFIG: "CONFIG_SITE",
  INDEX: "INDEX_MANDATS"
};

const DEFAULT_CONFIG = {
  DEFAULT_DEMO_MANDAT_ID: "MANDAT_DEMO_FICTIF",
  TOKEN_MODE: "private-token"
};

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const bien = clean(params.bien || params.mandat || params.id);
    const token = clean(params.token || params.code);

    if (!bien || !token) {
      return apiResponse(e, { ok: false, error: "invalid-token", message: "Accès privé invalide ou expiré." });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = readConfig_(ss);
    const index = readIndex_(ss);
    const entry = findMandat_(index, bien);

    if (!entry) {
      return apiResponse(e, { ok: false, error: "not-found", message: "Accès privé invalide ou expiré." });
    }

    if (!isActive_(entry)) {
      return apiResponse(e, { ok: false, error: "inactive", message: "Accès privé invalide ou expiré." });
    }

    if (!tokenMatches_(entry, token)) {
      return apiResponse(e, { ok: false, error: "invalid-token", message: "Accès privé invalide ou expiré." });
    }

    const tabName = clean(entry["Onglet mandat"] || entry["Onglet"] || entry["Sheet"] || entry["sheet"]);
    const mandatSheet = ss.getSheetByName(tabName || bien);
    if (!mandatSheet) {
      return apiResponse(e, { ok: false, error: "not-found", message: "Mandat introuvable." });
    }

    const property = parseMandatSheet_(mandatSheet, entry, config);
    return apiResponse(e, { ok: true, property });
  } catch (error) {
    return apiResponse(e, {
      ok: false,
      error: "server-error",
      message: "Les données de suivi sont momentanément indisponibles."
    });
  }
}

function apiResponse(e, payload) {
  const callback = e && e.parameter ? clean(e.parameter.callback) : "";
  if (callback && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function readConfig_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);
  const config = Object.assign({}, DEFAULT_CONFIG);
  if (!sheet) return config;

  const values = sheet.getDataRange().getDisplayValues();
  values.forEach(row => {
    const key = clean(row[0]);
    const value = clean(row[1]);
    if (key) config[key] = value;
  });
  return config;
}

function readIndex_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.INDEX);
  if (!sheet) throw new Error("INDEX_MANDATS introuvable");

  const values = sheet.getDataRange().getDisplayValues();
  const headerRowIndex = values.findIndex(row => row.some(cell => normalizeKey_(cell) === "idmandat"));
  if (headerRowIndex === -1) throw new Error("En-têtes INDEX_MANDATS introuvables");

  const headers = values[headerRowIndex].map(clean);
  return values.slice(headerRowIndex + 1)
    .filter(row => row.some(Boolean))
    .map(row => rowToObject_(headers, row));
}

function findMandat_(rows, bien) {
  const wanted = normalizeId_(bien);
  return rows.find(row => {
    return [
      row["ID_mandat"],
      row["ID mandat"],
      row["Slug site"],
      row["slug"],
      row["Onglet mandat"]
    ].some(value => normalizeId_(value) === wanted);
  });
}

function isActive_(entry) {
  const raw = clean(entry["Actif espace vendeur"] || entry["Visible propriétaire"] || entry["Actif"] || entry["Statut espace vendeur"] || "Oui");
  const status = clean(entry["Statut"] || "");
  const value = normalizeId_(raw);
  const normalizedStatus = normalizeId_(status);

  if (["non", "no", "false", "inactif", "inactive", "desactive", "expire"].includes(value)) return false;
  if (["archive", "inactif", "inactive", "expire"].includes(normalizedStatus)) return false;
  return true;
}

function tokenMatches_(entry, token) {
  const expected = clean(entry["Code privé"] || entry["Token"] || entry["token"] || entry["Code prive"] || entry["Code accès"]);
  return expected !== "" && String(expected) === String(token);
}

function parseMandatSheet_(sheet, indexEntry, config) {
  const values = sheet.getDataRange().getDisplayValues();
  const lookup = makeKeyValueLookup_(values);
  const stats = parseStats_(values);
  const plannedVisits = parseVisits_(values, false);
  const completedVisitFeedback = parseVisits_(values, true);
  const actions = parseActions_(values);
  const documents = parseDocuments_(values);
  const nextSteps = parseNextSteps_(values);

  return {
    slug: clean(indexEntry["ID_mandat"] || indexEntry["Slug site"] || lookup["ID mandat"] || sheet.getName()),
    mandatId: clean(indexEntry["ID_mandat"] || lookup["ID mandat"] || sheet.getName()),
    isDemo: [
      lookup["ID mandat"],
      indexEntry["ID_mandat"],
      indexEntry["Onglet mandat"],
      sheet.getName()
    ].some(value => normalizeId_(value) === normalizeId_(config.DEFAULT_DEMO_MANDAT_ID)),
    title: clean(lookup["Titre du bien"] || indexEntry["Bien"] || "Bien immobilier"),
    status: clean(lookup["Statut du mandat"] || indexEntry["Statut"] || "Suivi en cours"),
    price: clean(lookup["Prix affiché"] || indexEntry["Prix"] || ""),
    location: clean(lookup["Commune / secteur"] || indexEntry["Commune"] || ""),
    launchDate: clean(indexEntry["Date mise en ligne"] || indexEntry["Date de mise en ligne"] || ""),
    welcomeMessage: clean(lookup["Message propriétaire"] || "Ia ora na, bienvenue dans ton espace vendeur. Tu peux suivre ici les actions réalisées, les statistiques de visibilité, les retours du marché et les prochaines étapes."),
    stats,
    plannedVisits,
    completedVisitFeedback,
    marketingActions: actions,
    documents,
    nextSteps
  };
}

function makeKeyValueLookup_(values) {
  const lookup = {};
  values.forEach(row => {
    const key = clean(row[0]);
    const value = clean(row[1]);
    if (key && value) lookup[key] = value;
  });
  return lookup;
}

function parseStats_(values) {
  const table = findTable_(values, "Période");
  const stats = {
    whatsappClicks: 0,
    phoneClicks: 0,
    smsClicks: 0,
    videoRequests: 0,
    visitRequests: 0,
    qualifiedProspects: 0,
    plannedVisits: 0,
    completedVisits: 0
  };

  if (table) {
    table.rows.forEach(row => {
      stats.whatsappClicks += number_(cellByHeader_(table.headers, row, "Messages WhatsApp"));
      stats.phoneClicks += number_(cellByHeader_(table.headers, row, "Appels"));
      stats.smsClicks += number_(cellByHeader_(table.headers, row, "SMS"));
      stats.videoRequests += number_(cellByHeader_(table.headers, row, "Demandes vidéo"));
      stats.visitRequests += number_(cellByHeader_(table.headers, row, "Demandes visite"));
      stats.qualifiedProspects += number_(cellByHeader_(table.headers, row, "Prospects qualifiés"));
    });
  }

  const visits = findTable_(values, "Statut visite");
  if (visits) {
    visits.rows.forEach(row => {
      if (!isVisibleOwner_(tableRowObject_(visits.headers, row))) return;
      const status = normalizeId_(cellByHeader_(visits.headers, row, "Statut visite"));
      if (status.includes("realisee")) stats.completedVisits += 1;
      else if (status) stats.plannedVisits += 1;
    });
  }

  return stats;
}

function parseVisits_(values, completed) {
  const table = findTable_(values, "Statut visite");
  if (!table) return [];

  return table.rows
    .map(row => tableRowObject_(table.headers, row))
    .filter(isVisibleOwner_)
    .filter(item => {
      const status = normalizeId_(item["Statut visite"]);
      return completed ? status.includes("realisee") : !status.includes("realisee");
    })
    .map(item => ({
      date: clean(item["Date"]),
      time: clean(item["Heure"]),
      status: clean(item["Statut visite"]),
      buyerProfile: clean(item["Profil affiché propriétaire"]),
      interest: normalizeInterest_(item["Niveau intérêt"]),
      summary: clean(item["Retour propriétaire"]),
      objection: clean(item["Objection principale"]),
      nextAction: clean(item["Prochaine action"])
    }));
}

function parseActions_(values) {
  const table = findTable_(values, "Action");
  if (!table) return [];

  return table.rows
    .map(row => tableRowObject_(table.headers, row))
    .filter(isVisibleOwner_)
    .map(item => ({
      date: clean(item["Date"]),
      label: clean(item["Action"]),
      status: normalizeStatus_(item["Statut"]),
      comment: clean(item["Commentaire propriétaire"])
    }))
    .filter(item => item.label);
}

function parseDocuments_(values) {
  const table = findTable_(values, "Document");
  if (!table) return [];

  return table.rows
    .map(row => tableRowObject_(table.headers, row))
    .filter(item => clean(item["Document"]))
    .map(item => ({
      label: clean(item["Document"]),
      status: clean(item["Statut"] || (item["À relancer ?"] ? "À relancer" : "")),
      url: safeDocumentUrl_(item["Lien / emplacement"]),
      comment: clean(item["Commentaire"])
    }));
}

function parseNextSteps_(values) {
  const table = findTable_(values, "Date point");
  if (!table) return [];

  return table.rows
    .map(row => tableRowObject_(table.headers, row))
    .filter(isVisibleOwner_)
    .map(item => ({
      action: clean(item["Prochaine recommandation"]),
      date: clean(item["Date point"]),
      status: "Prévu",
      comment: clean(item["Point de vigilance"] || item["Résumé de la semaine"])
    }))
    .filter(item => item.action || item.comment);
}

function findTable_(values, requiredHeader) {
  const target = normalizeKey_(requiredHeader);
  const index = values.findIndex(row => row.some(cell => normalizeKey_(cell) === target));
  if (index === -1) return null;

  const headers = values[index].map(clean);
  const rows = [];
  for (let i = index + 1; i < values.length; i++) {
    const row = values[i];
    if (!row.some(Boolean)) break;
    if (String(row[0] || "").match(/^\d+\.\s/)) break;
    rows.push(row);
  }
  return { headers, rows };
}

function tableRowObject_(headers, row) {
  return rowToObject_(headers, row);
}

function rowToObject_(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    if (!header) return;
    obj[header] = row[index];
  });
  return obj;
}

function cellByHeader_(headers, row, headerName) {
  const wanted = normalizeKey_(headerName);
  const index = headers.findIndex(header => normalizeKey_(header) === wanted);
  return index === -1 ? "" : row[index];
}

function isVisibleOwner_(item) {
  const raw = clean(item["Visible propriétaire"] || item["Visible proprietaire"] || item["visible_owner"] || "Oui");
  return !["non", "no", "false", "prive", "private", "interne"].includes(normalizeId_(raw));
}

function safeDocumentUrl_(value) {
  const url = clean(value);
  if (!url) return "#";
  if (/^https:\/\/(drive\.google\.com|docs\.google\.com)\//i.test(url)) return url;
  return "#";
}

function normalizeStatus_(value) {
  const status = normalizeId_(value);
  if (status.includes("termine") || status.includes("realise")) return "termine";
  if (status.includes("cours")) return "en-cours";
  return "prevu";
}

function normalizeInterest_(value) {
  const interest = normalizeId_(value);
  if (interest.includes("chaud")) return "chaud";
  if (interest.includes("froid")) return "froid";
  return "tiede";
}

function number_(value) {
  const n = Number(String(value || "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeId_(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeKey_(value) {
  return normalizeId_(value).replace(/-/g, "");
}
