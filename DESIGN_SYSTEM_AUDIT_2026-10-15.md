# Audit de cohérence visuelle — Mathildekw.com

## Périmètre

- 49 pages HTML racine inspectées, ainsi que les pages profondes `blog/` et `biens/`.
- Pages publiques immobilières, contenus SEO, annonces, Foncier & Promotion, diagnostic et laboratoire 3D.
- Les pages privées et administratives restent volontairement hors du shell public afin de préserver leur navigation métier et leurs permissions.

## Incohérences constatées

- Trois headers concurrents : `topbar`, `h26-header` et `fp-nav`.
- Trois footers concurrents : `footer`, `h26-footer` et `fp-footer`.
- Intitulés, ordre des liens, CTA et comportement mobile différents selon les familles de pages.
- Navigation Foncier centrée sur les ancres de la page, sans accès immédiat aux rubriques immobilières générales.
- Valeurs de couleurs et typographies répétées entre `styles.css`, `home-2026.css` et les feuilles Foncier.
- Menu de l’accueil non sticky, tandis que certains autres headers avaient des comportements différents.

## Architecture mise en place

- `global-shell.js` devient la source de vérité de la navigation publique.
- `global-shell.css` centralise les tokens et styles structurels du header/footer.
- Les pages historiques le chargent via `site.js`.
- Les pages Foncier le chargent via `site-config.js`.
- L’accueil et le laboratoire 3D le chargent directement.
- Les anciens headers et footers restent dans le HTML comme repli sans JavaScript, puis sont remplacés visuellement quand le shell global est prêt.

## Navigation universelle

Ordre unique : Accueil, Nos biens, Vendre, Estimer, Foncier & Promotion, Contact, puis CTA « Parler de mon projet ».

Le logo renvoie toujours vers l’accueil. La rubrique active est calculée depuis l’URL. Sur mobile, le menu bloque le scroll d’arrière-plan, se ferme après navigation, avec Échap, via l’arrière-plan ou lors du retour navigateur. Le focus revient au bouton après une fermeture au clavier.

## Design system

Tokens communs : encre, vert profond, crème, corail, vert lime, rouge KW, bordures, typographies serif/sans, hauteur et couche du header.

Le shell utilise un `z-index` de 10000 pour rester au-dessus des cartes et canvas WebGL. Les pages conservent leurs compositions, photographies, scènes 3D et formulaires propres.

## Tests

- Contrôle automatisé de la présence du chargeur sur toutes les pages publiques munies d’un header.
- Contrôle des destinations, états ARIA, fermeture Échap, retour navigateur, blocage du scroll et réduction des animations.
- Contrôle manuel à 390 px sur l’accueil, la liste des biens, le diagnostic foncier, le laboratoire HORIZON et la page Contact.
- Aucun débordement horizontal observé sur ces cinq familles de pages.

## Restant à faire avant mise en ligne

- Revue visuelle par Mathilde de la prévisualisation locale.
- Éventuels ajustements de libellés ou de couleur du CTA.
- Push et déploiement uniquement après autorisation explicite.
