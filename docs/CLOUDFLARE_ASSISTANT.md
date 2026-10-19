# Assistant immobilier — configuration Workers AI

L’assistant public passe par la fonction Supabase `website-assistant`. Le navigateur ne contacte jamais Cloudflare directement et ne reçoit aucun secret.

## Secrets nécessaires dans Supabase

- `CLOUDFLARE_ACCOUNT_ID` : identifiant du compte Cloudflare.
- `CLOUDFLARE_AI_API_TOKEN` : jeton limité aux permissions Workers AI Read et Workers AI Edit.
- `CLOUDFLARE_AI_MODEL` : facultatif. Par défaut : `@cf/meta/llama-3.1-8b-instruct-fp8`.

Ne jamais placer ces valeurs dans `site-config.js`, un fichier HTML ou un secret GitHub accessible au navigateur.

## Déploiement

Après configuration des secrets :

```sh
supabase functions deploy website-assistant --no-verify-jwt
```

La fonction renvoie une erreur contrôlée lorsque l’offre gratuite atteint sa limite. L’interface propose alors de contacter Mathilde au lieu de promettre une réponse IA.

## Vérification

1. Envoyer une question synthétique depuis le widget.
2. Vérifier une réponse HTTP 200 et une réponse prudente en français.
3. Vérifier qu’aucun secret ne figure dans les sources chargées par le navigateur.
4. Simuler une réponse 429 et confirmer l’affichage du repli vers le contact.
