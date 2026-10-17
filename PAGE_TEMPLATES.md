# Modèles de pages officiels

Chaque nouvelle page publique charge `site-config.js`. Celui-ci initialise le shell, puis `mk-design-system.css` et `mk-motion-system.js`. Les contenus restent dans les pages ; présentation, surfaces et mouvement restent centralisés.

## Primitives officielles

- `.mk-glass-subtle`, `.mk-glass-card`, `.mk-glass-elevated`, `.mk-glass-dark`
- `.mk-ambient` pour les halos décoratifs non interactifs
- `.mk-reveal` pour les révélations progressives accessibles
- Les composants historiques sont mappés vers ces primitives dans `mk-design-system.css` pendant la migration.

## Accueil

Hero éditorial, trois parcours maximum, preuves, expertise Foncier, biens, présentation de Mathilde et CTA final.

## Service

Hero compact, problème, méthode, preuves, FAQ et CTA. Utilisé pour vendre, estimer et les contenus locaux.

## Annonce immobilière

Galerie, informations essentielles, description, caractéristiques, qualification et contact. Le menu global reste au-dessus de la galerie.

## Foncier & Promotion

Univers immersif autorisé, avec palette sombre dans le contenu uniquement. Le header public demeure clair et identique au reste du site.

## Présentation 3D

Une scène lourde visible à la fois, commandes tactiles, légende, fallback et avertissement synthétique/non contractuel.

## Tunnel de conversion

Une question principale par étape, progression visible, retour possible, erreurs explicites et navigation globale accessible.

## Contact

Coordonnées, canaux directs et formulaire court. Aucun bouton flottant ne doit recouvrir les champs sur mobile.

## Espace privé

Shell métier distinct autorisé uniquement après authentification. Il réutilise les tokens, n’expose aucun lien administrateur publiquement et propose un retour vers le site public.
