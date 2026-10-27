# Bon de visite électronique — terrain professionnel

Ce flux remplace tout prestataire facturant les signatures à l’unité.

## Parcours

1. Le prospect complète le formulaire Tally `RWGO0j`.
2. Tally appelle le webhook Supabase signé par HMAC.
3. Supabase conserve la demande et envoie un lien de vérification à l’adresse email déclarée.
4. Le prospect relit le document, saisit son nom et donne son consentement explicite.
5. Le backend fige l’empreinte SHA-256 du document et du dossier de preuve.
6. Un certificat PDF est enregistré dans un bucket privé et téléchargé par le prospect.
7. Si le webhook email Google est configuré, le certificat est également envoyé au prospect et à Mathilde.

Le bon de visite ne constitue ni un mandat, ni une offre, ni une promesse de vente et ne met aucune commission à la charge du prospect.

## Secrets Supabase

- `TALLY_TERRAIN_WEBHOOK_SECRET` : secret aléatoire partagé avec Tally.
- `TALLY_TERRAIN_FORM_ID=RWGO0j`
- `VISIT_EVIDENCE_PEPPER` : secret aléatoire utilisé pour pseudonymiser l’adresse IP.
- `VISIT_ALLOWED_ORIGIN=https://mathildekw.com`
- `FRONTEND_BASE_URL=https://mathildekw.com`
- `VISIT_EMAIL_WEBHOOK_URL` : facultatif, URL d’un Apps Script Google autorisé à envoyer le PDF final.
- `VISIT_EMAIL_WEBHOOK_SECRET` : facultatif, secret partagé avec ce webhook.

Les clés `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `SUPABASE_ANON_KEY` sont fournies par Supabase.

## Webhook Tally

Configurer dans Tally :

`https://rqjuvutlnpwecjkpkiuw.functions.supabase.co/visit-signature/tally-webhook`

Le secret Tally doit être identique à `TALLY_TERRAIN_WEBHOOK_SECRET`. Ne jamais le mettre dans le navigateur ou dans GitHub.

## Limites

- Le lien email utilise Supabase Auth. Les limites d’envoi de l’offre Supabase restent applicables.
- L’envoi automatique du PDF final nécessite le webhook email Google. Sans lui, le PDF est téléchargé immédiatement et la demande reste marquée `delivery_pending`.
- Ce dispositif fournit une signature électronique simple assortie d’un dossier de preuve. Il ne remplace pas une signature qualifiée pour les actes qui l’exigent.
