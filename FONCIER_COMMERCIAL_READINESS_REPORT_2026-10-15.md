# Mise en service commerciale Foncier — rapport du 15 octobre 2026

## Statut général

Les corrections sont préparées sur la branche locale `feat/foncier-commercial-readiness`. Rien n'a été déployé ni poussé pendant cette mission.

## Audit Supabase

- Projet `mathildekw-backend` actif et sain.
- 34 tables `foncier_*` inspectées : RLS activée et politiques présentes.
- Lecture anonyme testée : aucune donnée privée retournée.
- Écriture anonyme directe testée : refusée par RLS (`42501`).
- Aucune clé `service_role` ou `sb_secret_*` présente dans le code navigateur.
- La clé publiée dans `site-config.js` est une clé **publishable**, prévue pour le navigateur ; les droits restent imposés par RLS.
- Aucun compte Supabase Auth ni administrateur foncier n'existe encore. La migration prépare l'attribution automatique du rôle administrateur à l'adresse autorisée lors de sa première connexion par lien magique.

## Corrections préparées

- Nouvelle fonction publique `foncier-leads-v2` : déduplication par téléphone/email normalisés et empreinte de soumission, blocage des répétitions pendant 10 minutes, alertes P1, outbox idempotente.
- Nouveau dashboard `foncier-admin` : propriétaires, terrains, diagnostic, score, priorité, pipeline, historique, prochaines actions, relances, rendez-vous, promoteurs, matching et état des intégrations.
- Nouvelle fonction `foncier-maintenance` : génération des relances échues et reprise automatique de la synchronisation Google Sheets avec temporisation progressive.
- Migration commerciale : index de déduplication, automatismes rendez-vous/CRM, relances, configuration du classeur KW Impact et planification toutes les 15 minutes.
- Connecteur Apps Script préparé pour l'onglet `Journal`, avec identifiant Supabase invisible et mise à jour idempotente.
- Le tunnel envoie désormais une empreinte stable de soumission.

## Tests réellement exécutés

- Tunnel fictif soumis deux fois sur la production actuelle : un seul prospect créé, mais deux activités et deux alertes ont révélé le défaut corrigé dans `foncier-leads-v2`.
- Prospect fictif, activités et notifications supprimés après le test ; vérification finale : zéro ligne restante pour cet identifiant.
- Simulation de migration Supabase réussie : seule `20261015100000_foncier_commercial_readiness.sql` serait appliquée, aucune migration n'a été exécutée.
- Tests automatisés locaux : 117 assertions réussies.
  - Tunnel de conversion : 16.
  - Préparation commerciale : 27.
  - Workflows fonciers : 23.
  - Navigation globale : 51 pages.
- Vérification syntaxique JavaScript et `git diff --check` réussies.

## Google Sheets « Suivi KW Impact »

- Classeur identifié : `1uNmxR1H9cj_CuHE_sQxCqB_K4PqQfGonIhvr4WTCzqE`.
- Fuseau confirmé : `Pacific/Tahiti`.
- Onglet cible : `Journal`.
- En-têtes contrôlés sans lire de données clients : date, moment, contact, bien/projet, téléphone/email, catégorie, source, statut, résultat, prix/budget, prochaine action, relance, réseaux, recommandation, notes, angle de relance.
- Le classeur n'a pas été modifié.
- État réel : connecteur préparé mais non actif tant que le Web App Apps Script et ses secrets ne sont pas configurés.

## Rendez-vous et notifications

- Le schéma, les contrôles de conflit et la mise à jour automatique du CRM sont préparés.
- Le fuseau métier reste `Pacific/Tahiti`.
- Les notifications internes et alertes P1 sont prêtes après migration.
- Aucun fournisseur de notification externe n'est configuré ; aucun email/SMS/WhatsApp automatique ne sera prétendu envoyé.

## Configuration encore nécessaire avant mise en service

1. Autoriser le déploiement de la migration et des trois fonctions Edge.
2. Créer la première session administrateur par lien magique avec l'adresse autorisée.
3. Déployer le script Apps Script dans « Suivi KW Impact » puis renseigner `FONCIER_GOOGLE_SHEETS_WEBHOOK` et `FONCIER_GOOGLE_SHEETS_SECRET`.
4. Renseigner `FONCIER_CRON_SECRET` pour la maintenance planifiée.
5. Facultatif : choisir/configurer un canal de notification externe.
6. Rejouer le parcours bout en bout après configuration, puis supprimer les données fictives.

## Coûts récurrents

- Aucun coût supplémentaire certain pour les correctifs eux-mêmes.
- Supabase Free et Apps Script peuvent suffire aux faibles volumes, dans leurs quotas respectifs.
- Un fournisseur externe d'email, SMS ou automatisation peut entraîner des coûts selon le service choisi.
