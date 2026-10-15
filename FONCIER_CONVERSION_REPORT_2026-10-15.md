# Tunnel Foncier & Promotion — rapport de livraison

Date : 15 octobre 2026
Branche : `feat/foncier-conversion-tunnel`

## Parcours audité

1. Page publique Foncier & Promotion.
2. CTA vers le pré-diagnostic.
3. Questionnaire en dix étapes.
4. Sélection Te Fenua et saisie manuelle de secours.
5. Calcul d'une orientation indicative.
6. Enregistrement du prospect par fonction Supabase.
7. Scoring commercial P1, P2 ou P3.
8. Notifications internes et webhook optionnel.
9. Réservation d'un créneau en heure de Tahiti ou demande de rappel.
10. File de synchronisation Google Sheets et dashboard de conversion.

## Problèmes identifiés

- La promesse commerciale de la page était plus descriptive que directement orientée propriétaire.
- Les CTA utilisaient plusieurs intitulés concurrents.
- Le résultat ne récapitulait pas clairement les caractéristiques effectivement déclarées.
- Le canal de contact préféré n'était pas restauré lors d'un retour dans le formulaire.
- Une réponse modifiée après un premier enregistrement pouvait réutiliser l'ancien dossier sans nouvelle transmission.
- La détection des doublons signalait un doublon mais créait malgré tout une seconde fiche.
- Une synchronisation Google Sheets échouée ne réactivait pas toujours proprement un événement déjà présent dans la file.
- Les clics CTA et la progression détaillée par question n'étaient pas visibles dans les métriques.
- Le dashboard tentait de démarrer même lorsque la clé publique Supabase était absente.

## Améliorations réalisées

- Promesse principale : « Et si ton terrain intéressait un promoteur immobilier ? »
- CTA principal unique : « Découvrir le potentiel de mon terrain ».
- CTA placés dans le hero, après la démonstration, après les services, en bas de page et sous forme sticky discrète sur mobile.
- Bloc de bénéfices immédiatement lisible, sans promesse de prix ni de constructibilité.
- Résultat personnalisé avec commune, surface, accès, relief déclaré, situation foncière et projet envisagé.
- Séparation claire entre points intéressants, points à vérifier et pistes à examiner.
- CTA de rendez-vous et de rappel conservés après l'enregistrement réel du prospect.
- Empreinte de soumission pour retransmettre les réponses lorsqu'elles ont été modifiées.
- Mise à jour d'une fiche existante trouvée par téléphone ou email au lieu de créer une nouvelle fiche.
- Réactivation idempotente de la file Google Sheets en cas d'échec.
- Journalisation explicite des demandes de rappel.
- Mesure des clics CTA, coordonnées partagées, rappels et étapes terminées.
- Dashboard enrichi avec l'état réel des connexions et files en attente.

## Connexions réellement vérifiées

- L'URL Supabase configurée répond actuellement `HTTP 540 — Project paused`.
- Conséquence : aucun enregistrement réel, créneau, rappel, notification ou synchronisation ne peut être validé en production tant que le projet est en pause.
- La clé publique Supabase du dashboard est vide dans `site-config.js`. Le dashboard l'indique maintenant honnêtement au lieu de sembler fonctionnel.
- La connexion Google Sheets ne peut pas être déclarée opérationnelle. Le code conserve une file d'attente serveur et affiche `non connecté` en l'absence de configuration confirmée.

## Tests exécutés

- Vérification syntaxique des scripts navigateur : réussie.
- Suite fonctionnelle complète du dépôt : réussie.
- Tunnel de conversion : 16 assertions réussies.
- Workflows fonciers et confidentialité : 23 assertions réussies.
- Projet HORIZON : 42 assertions réussies sur les deux suites.
- Tests visuels ciblés Foncier et Diagnostic : 6 réussis.
- Tailles contrôlées : mobile, tablette et ordinateur.
- Absence de débordement horizontal : contrôlée automatiquement.
- Vérification en lecture de l'API déployée : échec confirmé et documenté, projet Supabase en pause.

## Configuration nécessaire avant mise en production

1. Réactiver le projet Supabase `rqjuvutlnpwecjkpkiuw`.
2. Appliquer la migration `20261015080000_conversion_tunnel_optimization.sql`.
3. Déployer les fonctions `foncier-leads` et `foncier-conversion`.
4. Configurer la clé publique Supabase destinée à l'authentification administratrice.
5. Vérifier ou configurer `FONCIER_GOOGLE_SHEETS_WEBHOOK` et son secret.
6. Vérifier ou configurer le webhook de notification interne externe si souhaité.
7. Exécuter ensuite un parcours réel avec des données de test synthétiques clairement identifiées, puis supprimer ou archiver le prospect de test.

## État de livraison

Le code et les tests locaux sont prêts. Aucun déploiement, aucune migration distante et aucun prospect fictif n'ont été envoyés en production depuis cette branche.
