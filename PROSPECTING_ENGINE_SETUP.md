# Moteur serveur de prospection foncière

Le moteur s’exécute dans Supabase, indépendamment du Mac. Le code GitHub doit être déployé une fois avant le démarrage des tâches.

## Fonctions livrées

- Ingestion paginée par lots de 200, curseur persistant et reprise après erreur.
- Actualisation hebdomadaire et empreinte SHA-256 anti-retraitement.
- Cache PostGIS des parcelles et routes autorisées.
- Distance routière et façade géométrique indicatives.
- Score explicable sans présenter PGA, PPR, topographie ou accès juridique comme connus.
- Carte privée, fiches, statuts, étape OTIA manuelle, contacts sourcés, oppositions, relances et modèles.
- Matching promoteurs et briefing hebdomadaire.
- Synchronisation Sheets uniquement pour un contact autorisé et sans opposition.

## Activation Supabase

1. Appliquer `20261015030000_prospecting_engine.sql`, puis `20261015031000_prospecting_cron_setup.sql`.
2. Déployer `supabase/functions/foncier-prospecting`. La fonction contrôle elle-même le JWT privé et le secret cron.
3. Configurer `FONCIER_CRON_SECRET` (32 caractères minimum), `FONCIER_ALLOWED_ORIGIN=https://mathildekw.com` et, seulement quand le connecteur réel existe, `FONCIER_GOOGLE_SHEETS_WEBHOOK` et `FONCIER_GOOGLE_SHEETS_SECRET`.
4. Exécuter une fois :

```sql
select public.configure_foncier_prospecting_cron(
  'https://rqjuvutlnpwecjkpkiuw.functions.supabase.co',
  'REMPLACER_PAR_LE_MEME_SECRET_ALEATOIRE_DE_32_CARACTERES'
);
```

Le worker reprend un lot toutes les cinq minutes. Après un parcours complet, la commune est reprogrammée sept jours plus tard. Le briefing est généré le lundi à 07:00 à Tahiti, soit 17:00 UTC.

5. Renseigner la clé publique `anonKey` dans `site-config.js` — jamais la service role.
6. Ouvrir `/admin-prospection-fonciere.html` et créer la première recherche.

## Intégrations et limites

Google Sheets reste `not_connected` tant que le webhook n’a pas réellement écrit. L’UUID du contact sert de clé d’upsert.

PGA et PPR restent désactivés faute de licence déclarée. La topographie reste `unavailable`. L’accès juridique est toujours à confirmer. Aucune identité propriétaire n’est extraite de Te Fenua ou d’OTIA ; OTIA est une étape exclusivement manuelle.
