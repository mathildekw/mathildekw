# Stabilisation du design — 15 octobre 2026

## Périmètre livré

Travail réalisé sur la branche isolée `chore/design-stability-system`. Aucune mise en production et aucun push n'ont été effectués.

## Causes structurelles identifiées

- Le site est une application statique composée de pages HTML, de CSS et de JavaScript natif. Ce n'est ni React ni Next.js.
- Plusieurs générations de pages ont coexisté avec leurs propres en-têtes, espacements et règles responsives.
- Le shell global existant masque les anciens en-têtes, mais il manquait une documentation obligatoire et des contrôles visuels reproductibles.
- Aucun test automatique ne détectait un second menu, l'absence du pied de page, un débordement horizontal ou une variation visuelle involontaire.
- Les nouveaux composants pouvaient introduire des valeurs graphiques arbitraires sans règle persistante dans le dépôt.

## Fondations ajoutées

- `AGENTS.md` : règles permanentes pour les futurs développements et agents.
- `PAGE_TEMPLATES.md` : structures de référence pour les pages publiques, tunnels, projets 3D et espaces privés.
- `design-system.html` et `design-system.css` : catalogue interne, non indexé, des composants et tokens officiels.
- `playwright.config.mjs` : trois tailles de référence (mobile, tablette et ordinateur).
- `tests/visual/public-pages.spec.mjs` : tests sur les principales routes publiques.
- `scripts/test-server.mjs` : serveur local stable, sans cache, réservé aux tests.
- `.github/workflows/visual-regression.yml` : exécution automatique des tests fonctionnels et visuels sur les branches et pull requests.

## Contrôles automatisés

Les tests vérifient notamment :

- la présence d'un seul header global ;
- la présence d'un seul footer global ;
- l'absence de débordement horizontal ;
- la stabilité visuelle des routes principales ;
- l'ouverture du menu mobile ;
- sa fermeture avec la touche Échap ;
- les vues mobile, tablette et ordinateur.

Routes couvertes : accueil, biens, estimation, Foncier & Promotion, diagnostic foncier, contact et référence du design system.

## Résultats vérifiés

- Tests fonctionnels existants : réussis.
- Couverture du shell global : 51 pages publiques.
- Tests visuels : 22 réussis, 2 ignorés intentionnellement sur ordinateur car réservés au menu mobile.
- Comparaison des captures relancée sans mise à jour : réussie.
- Vérification Git des espaces et conflits de patch : réussie.

## Correction mobile effectuée

La page de référence débordait de 27 px sur mobile. La cause était un bouton défini à `width: 100%` auquel le navigateur ajoutait encore le padding. Le modèle de boîte est maintenant centralisé en `border-box`, et le test de débordement valide la correction.

## Limites et prochaine validation

- Le système empêche les nouvelles régressions sur les routes couvertes ; il ne redessine volontairement pas toutes les anciennes sections en une seule modification.
- Les captures deviennent la référence visuelle seulement après validation humaine.
- Le workflow ne fusionne et ne déploie rien automatiquement.
- Le push de la branche et la création d'une prévisualisation restent soumis à l'autorisation de Mathilde.
