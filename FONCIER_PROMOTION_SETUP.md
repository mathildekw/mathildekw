# Pacific Keys — Foncier & Promotion

## Ce qui est livré

- `/foncier-promotion.html` : landing page publique.
- `/diagnostic-foncier.html` : tunnel propriétaire en 10 questions et résultat personnalisé.
- `/promoteur-foncier.html` : référencement des recherches promoteurs.
- `/admin-foncier.html` : CRM privé avec magic link Supabase.
- `supabase/migrations/20261015010000_foncier_promotion.sql` : données, RLS, pipeline, faisabilité, notifications, paramètres et matching.
- `supabase/functions/foncier-promotion/index.ts` : API publique et privée.

## Mise en production du backend

1. Appliquer la migration au projet Supabase existant.
2. Déployer la fonction `foncier-promotion` avec vérification JWT désactivée au niveau passerelle : la fonction protège elle-même toutes les routes `/admin/*` et laisse seulement les deux routes publiques recevoir des formulaires.
3. Conserver `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les secrets Supabase.
4. Copier la clé publique `anon` dans `site-config.js > foncier.anonKey`. Cette clé est conçue pour le navigateur ; la service role ne doit jamais y être placée.
5. Dans Supabase Auth, autoriser `https://mathildekw.com/admin-foncier.html` comme URL de redirection et désactiver les inscriptions publiques non souhaitées. Créer uniquement le compte administratrice.

Sans `anonKey`, le dashboard affiche volontairement « Configuration Supabase administrateur non activée ». Les formulaires publics utilisent déjà l’URL de l’Edge Function, mais ne pourront enregistrer les dossiers qu’après son déploiement.

## Google Sheets « Suivi KW Impact »

Le connecteur est prêt mais reste explicitement `Non connecté`. Avant de l’activer, relever les onglets, en-têtes et règles de dédoublonnage du fichier réel.

Secrets serveur attendus :

- `FONCIER_GOOGLE_SHEETS_WEBHOOK`
- `FONCIER_GOOGLE_SHEETS_SECRET`

Le webhook reçoit `{ kind, row }`. Il doit effectuer un upsert sur `row.reference`, jamais un ajout aveugle. Une réponse HTTP 2xx marque la synchronisation comme réussie ; toute autre réponse est enregistrée comme erreur. Ne jamais placer ces secrets dans `site-config.js`.

## Urbanisme

Tous les champs réglementaires démarrent à `À vérifier`. Le statut passe de `to_verify` à `validated` uniquement après contrôle manuel. Chaque validation doit conserver les sources documentaires et leur date. Le système ne calcule pas automatiquement de nombre de logements autorisé.
