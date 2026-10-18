const KW_IMPACT_ID = '1uNmxR1H9cj_CuHE_sQxCqB_K4PqQfGonIhvr4WTCzqE';
const NOTIFICATION_EMAIL = 'mathilde.tuduri@kw-pacific.com';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const expected = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (!expected || !e || e.parameter.secret !== expected) return json_({ ok: false, error: 'unauthorized' });
    const payload = JSON.parse(e.postData.contents || '{}');
    const row = payload.row || payload.data || payload;
    const kind = String(payload.kind || row.kind || row.form_type || 'formulaire');
    const id = String(payload.unique_id || row.id || Utilities.getUuid());
    const received = row.created_at ? new Date(row.created_at) : new Date();
    const source = String(row.source || row.page_path || 'mathildekw.com');
    const firstName = String(row.first_name || row.prenom || '');
    const lastName = String(row.last_name || row.nom || '');
    const phone = String(row.phone || row.telephone || '');
    const email = String(row.email || '');
    const project = String(row.property_type || row.project_type || row.type || row.owner_goal || '');
    const commune = String(row.commune || row.city || row.location || row.island || '');
    const budget = Number(row.budget_xpf || row.estimated_budget || row.budget || 0) || '';
    const consent = Boolean(row.privacy_consent || row.privacy_consent_at || row.third_party_consent_at);
    const reference = String(row.reference || payload.reference || '');
    const ss = SpreadsheetApp.openById(KW_IMPACT_ID);
    upsert_(ss.getSheetByName('Formulaires site'), id, [id, received, kind, source, firstName, lastName, phone, email, project, commune, budget, consent ? 'Oui' : 'Non', 'Nouveau', reference, 'Email envoyé', JSON.stringify(row)]);
    const target = target_(kind);
    if (target) upsert_(ss.getSheetByName(target), id, detailRow_(target, id, received, kind, source, row, firstName, lastName, phone, email, reference));
    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: 'Nouveau formulaire ' + kind + (firstName || lastName ? ' — ' + (firstName + ' ' + lastName).trim() : ''),
      htmlBody: '<p><b>Type :</b> ' + esc_(kind) + '</p><p><b>Contact :</b> ' + esc_((firstName + ' ' + lastName).trim()) + '<br><b>Téléphone :</b> ' + esc_(phone) + '<br><b>Email :</b> ' + esc_(email) + '</p><p><b>Projet :</b> ' + esc_(project) + '<br><b>Secteur :</b> ' + esc_(commune) + '</p><p><a href="https://docs.google.com/spreadsheets/d/' + KW_IMPACT_ID + '/edit">Ouvrir Suivi KW Impact</a></p>'
    });
    return json_({ ok: true, id: id });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function target_(kind) {
  if (/seller|vendeur|estimation|land_lead/i.test(kind)) return 'Vendeurs site';
  if (/career|internship|candidature|stage/i.test(kind)) return 'Candidatures site';
  if (/referral|apport|broker|minitaux/i.test(kind)) return 'Apports site';
  if (/visit|visite|video/i.test(kind)) return 'Visites site';
  return null;
}

function detailRow_(target, id, received, kind, source, row, firstName, lastName, phone, email, reference) {
  const contact = (firstName + ' ' + lastName).trim();
  if (target === 'Vendeurs site') return [id, received, source, contact, phone, email, row.property_type || row.type || '', row.commune || '', row.surface || '', row.owner_goal || row.objectif || '', row.timeline || row.delai || '', row.comment || row.message || '', 'Nouveau', reference];
  if (target === 'Candidatures site') return [id, received, kind, contact, phone, email, row.location || '', row.current_professional_status || row.school || '', row.availability || [row.start_date, row.end_date].filter(Boolean).join(' → '), row.motivation || '', 'Nouveau', reference];
  if (target === 'Apports site') return [id, received, kind, contact || [row.referrer_first_name, row.referrer_last_name].filter(Boolean).join(' '), [row.owner_first_name, row.owner_last_name].filter(Boolean).join(' '), row.owner_phone || phone, row.owner_email || email, row.property_type || row.project_type || '', row.city || row.commune || '', row.third_party_consent_at || row.broker_consent ? 'Oui' : 'Non', row.status || 'Nouveau', reference];
  return [id, received, source, contact, phone, email, row.property_label || row.property_reference || row.property || '', row.request_type || kind, row.requested_at || row.preferred_date || '', row.message || '', row.status || 'Nouveau', reference];
}

function upsert_(sheet, id, values) {
  if (!sheet) throw new Error('Onglet manquant');
  const last = Math.max(sheet.getLastRow(), 1);
  const ids = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getDisplayValues().flat() : [];
  const found = ids.indexOf(id);
  const row = found >= 0 ? found + 2 : last + 1;
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
}

function esc_(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function json_(body) { return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON); }
