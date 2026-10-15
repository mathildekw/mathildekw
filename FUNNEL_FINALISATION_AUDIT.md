# Audit final — tunnel Foncier & Promotion

Date : 15 octobre 2026. État : **implémenté localement, non publié et backend non déployé**.

## Fonctionnel dans le code

- Questionnaire en dix étapes, sauvegarde locale, référence cadastrale facultative, sélection Te Fenua avec repli manuel, question de visibilité conditionnelle.
- Qualification commerciale P1/P2/P3 explicable, distincte de toute faisabilité réglementaire.
- Enregistrement serveur avec dédoublonnage téléphone/email ; le lead interne est conservé si Google Sheets échoue.
- Rendez-vous de 45 minutes en heure de Tahiti, téléphone/visio/sur place, exclusion serveur des chevauchements, succès seulement après insertion.
- Demande de rappel, abandon consentant limité à 30 jours, tâches de suivi, notification interne et journal de livraison externe.
- Rapports PDF propriétaire/interne avec date, sources, limites et absence de valeur ou capacité constructible inventée.
- Événements de conversion, UTM, origine, tests A/B/C persistants et dashboard privé sans chiffres fictifs.
- Consentements traitement, reprise et marketing séparés ; accès administrateur par session Supabase.

## Non opérationnel tant que non déployé/configuré

- Migrations et fonctions Supabase `foncier-leads`, `foncier-conversion` et `foncier-report`.
- Clé publique Supabase du dashboard (`foncier.anonKey` est vide).
- Notification externe (`FONCIER_NOTIFICATION_WEBHOOK` et secret).
- Google Sheets « Suivi KW Impact » (`FONCIER_GOOGLE_SHEETS_WEBHOOK` et secret). Le mécanisme conserve le lead et marque l’erreur, mais l’interface de relance manuelle reste à relier au webhook réel.
- Tests réels notification, rendez-vous, PDF, dashboard, dédoublonnage, matching et panne Sheets : impossibles avant déploiement d’un environnement de test.

## Sécurité et publication

- Les jetons rendez-vous/rapport sont hachés ; les PDF sont privés et sans cache. Les secrets restent côté serveur et les événements analytiques n’envoient pas les coordonnées.
- Avant publication : limiter l’administration à l’adresse autorisée, vérifier les politiques RLS, définir les secrets, tester CORS et faire confirmer juridiquement la durée de 24 mois et le texte de confidentialité en Polynésie française.
- Aucune donnée cadastrale, notification ou synchronisation n’a été simulée comme réussie.
- Ne pas publier avant les tests connectés et l’accord explicite de Mathilde.
