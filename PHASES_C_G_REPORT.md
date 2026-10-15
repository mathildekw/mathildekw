# Pacific Keys — livraison des phases C à G

Date de vérification locale : 15 octobre 2026 (Tahiti).

## Phase C — conversion commerciale

- Tunnel propriétaire existant conservé : dix étapes, Te Fenua avec repli manuel, consentements séparés, qualification explicable et rendez-vous.
- Un nouveau dépôt ne peut plus écraser silencieusement un ancien prospect partageant le même téléphone ou courriel. Il crée un dossier distinct marqué comme doublon potentiel.
- Les jetons de rendez-vous et de rapport restent propres à la nouvelle demande.
- Une synchronisation Google Sheets échouée ou non configurée est déposée dans une file persistante et idempotente.
- Génération serveur des relances arrivant à échéance, sans doublon d’action ouverte.

## Phase D — espace vendeur et dossiers promoteurs

- Nouveau portail propriétaire `/portail-foncier.html`, protégé par une invitation aléatoire hachée, temporaire et révocable.
- Le serveur ne renvoie que la chronologie marquée `owner` et les documents explicitement déclarés visibles.
- Le jeton est retiré immédiatement de l’adresse du navigateur.
- Nouveau dossier promoteur `/dossier-promoteur.html` avec modes teaser et complet, prévisualisation et export PDF A4 par impression.
- Le teaser masque les informations précises et rappelle qu’aucune identité propriétaire n’est communiquée.
- Tables ajoutées pour invitations, chronologie, documents partageables et scénarios financiers.

## Phase E — prospection et radar promoteurs

- Le moteur existant conserve l’ingestion paginée, le cache PostGIS, les empreintes anti-retraitement, la carte privée, l’étape OTIA manuelle, les statuts, les contacts sourcés, le briefing et le matching explicable.
- OTIA n’est pas automatisé et aucune identité propriétaire n’est extraite massivement.
- PGA, PPR, topographie et accès juridique restent explicitement inconnus lorsque les sources autorisées ne les fournissent pas.
- Le traitement continue d’être prévu côté Supabase et ne dépend pas du Mac après déploiement.

## Phase F — simulations financières

- Calcul détaillé du chiffre d’affaires, des coûts, de la marge, du taux de marge et de la charge foncière résiduelle.
- Comparaison des cinq scénarios demandés.
- Analyse de sensibilité basse, centrale et haute.
- Signalement automatique des hypothèses manquantes et des principaux risques.
- Fiscalité uniquement saisie manuellement ; aucune règle fiscale polynésienne non confirmée n’est codée en dur.

## Phase G — automatisation et qualité

- File d’intégration avec clé d’idempotence, verrouillage concurrent, reprise exponentielle et arrêt après huit échecs.
- Worker serveur ajouté pour reprendre les synchronisations Google Sheets.
- Contrôle administrateur centralisé avec `is_foncier_admin()` sur les fonctions privées.
- Jeux de tests entièrement synthétiques.

## Vérifications réalisées

- Huit suites automatisées réussies, incluant 22 assertions sur les workflows privés et 29 sur HORIZON 2.0.
- Vérification de syntaxe des nouveaux scripts navigateur.
- Analyse syntaxique des fonctions Edge jusqu’à l’appel Deno, non exécutable dans Node.
- Test navigateur des écrans sans jeton : refus propre, absence du jeton dans l’URL, `noindex`, aucune erreur console.
- Test responsive 390 × 844 : aucun débordement horizontal.

## Non activé et non présenté comme fonctionnel en production

- Aucune migration ni fonction Supabase n’a été déployée.
- Aucun compte propriétaire réel, document client ou dossier réel n’a été utilisé.
- Google Sheets reste non connecté tant que le webhook et son secret ne sont pas configurés et testés.
- Les notifications externes restent non configurées tant que le fournisseur et ses secrets ne sont pas validés.
- Les parcours connectés invitation, révocation, PDF privé, rendez-vous et reprise Sheets nécessitent un environnement Supabase de test avant publication.
- La clé publique Supabase du navigateur reste vide dans `site-config.js`.

## Ordre de mise en service recommandé

1. Créer un projet Supabase de préproduction et appliquer les migrations dans l’ordre.
2. Ajouter l’utilisatrice administratrice dans `foncier_admin_users`.
3. Déployer les fonctions Edge en préproduction uniquement.
4. Configurer les secrets, le webhook Sheets et les tâches planifiées.
5. Exécuter les tests connectés avec des données synthétiques.
6. Faire valider les textes de consentement et durées de conservation.
7. Obtenir l’accord explicite avant toute publication en production.
