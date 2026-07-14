# Flux video securise

Objectif : aucun client ne reçoit de lien video tant que le bon de visite n'est pas signe.

## Fichiers ajoutes

- `demande-visite-video.html` : page publique de demande de visite video.
- `video-visit.js` : appelle l'Edge Function Supabase.
- `supabase/migrations/20260714010000_video_visit_requests.sql` : table des demandes.
- `supabase/functions/video-visit/index.ts` : backend securise.
- `scripts/admin-mark-video-signed.mjs` : secours admin pour valider une signature manuellement.
- `scripts/create-video-invitation.mjs` : cree un lien prive de demande/signature a envoyer au prospect.

## Secrets a configurer dans Supabase Edge Functions

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_VIDEO_BUCKET=property-videos`
- `VIDEO_LINK_EXPIRES_SECONDS=10368000`
- `VIDEO_INVITE_EXPIRES_SECONDS=2592000`
- `VIDEO_VISIT_ADMIN_SECRET`
- `DOCUMENSO_API_TOKEN`
- `DOCUMENSO_TEMPLATE_ID`
- `DOCUMENSO_API_BASE_URL=https://app.documenso.com/api/v1`
- `FRONTEND_BASE_URL=https://mathildekw.com`

## Webhook Documenso

URL a renseigner dans Documenso :

`https://PROJECT.functions.supabase.co/video-visit/documenso-webhook`

Le webhook doit envoyer un evenement de document signe / complete.

## Parcours

1. La fiche publique indique seulement que la visite video est disponible sur demande.
2. Mathilde cree une invitation privee et l'envoie au prospect.
3. Le client remplit la page privee avec son token d'invitation.
4. Le backend cree une demande et lance Documenso si le modele est configure.
5. Documenso appelle le webhook quand le bon est signe.
6. Le backend cree un second token d'acces video.
7. La page demande au backend un lien Supabase signe uniquement si le token video est valide.

## Creer une invitation privee

Lien generique pour un bien :

```bash
npm run video-invite -- 979
```

Invitation nominative :

```bash
npm run video-invite -- 979 --name="Prenom Nom" --email="client@email.com" --phone="+689..."
```

Ce lien ne donne jamais acces a la video. Il sert seulement a ouvrir le formulaire et lancer la signature.

## Secours manuel

Quand une signature est verifiee manuellement :

```bash
npm run video-mark-signed -- ID_DEMANDE
```

La commande renvoie une URL d'acces client. Cette URL ne contient pas le chemin Supabase de la video.
