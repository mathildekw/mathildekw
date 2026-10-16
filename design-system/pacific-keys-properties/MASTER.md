# Design system — Mathilde KW / Pacific Keys Properties

Ce fichier formalise l’identité réellement retenue après l’audit du site. Les suggestions génériques de type glassmorphism, bleu SaaS et polices Cinzel/Josefin ont été écartées car elles ne correspondent ni à l’existant ni au positionnement humain et local de Mathilde.

## Principes

- Chaleureux, expert, local et premium sans ostentation.
- Une navigation, un rythme et des composants communs sur toutes les pages publiques.
- Contenu immobilier réel conservé ; aucune preuve sociale ou donnée commerciale inventée.
- Mobile d’abord : contenu essentiel immédiat, sections plus denses, aucune largeur fixe.
- Mouvement discret et fonctionnel, avec contenu visible sans JavaScript et respect de `prefers-reduced-motion`.

## Identité

- Titres : `Cormorant Garamond`, repli Georgia/serif.
- Interface et texte : `DM Sans`, repli système sans-serif.
- Vert profond : `#052f2c`.
- Crème : `#f6f1e8`.
- Surface claire : `#fffdf8`.
- Corail : `#e5745f` ; état renforcé `#c95743`.
- Vert citron : `#c7ff63`, réservé aux accents Foncier & Promotion.
- Texte : `#173b38` ; texte secondaire `#61706d`.
- Focus : anneau corail contrasté de 3 px avec décalage de 3 px.

## Échelle et structure

- Largeur éditoriale maximale : `1180px` ; lecture longue : `760px`.
- Gouttières : `clamp(18px, 4vw, 64px)`.
- Sections : `clamp(56px, 8vw, 112px)` sur grand écran, `40–56px` sur mobile.
- Titres : un seul `h1` par page, puis `h2`, puis `h3` sans saut de niveau.
- Taille des titres via `clamp()` ; largeur de ligne limitée et `text-wrap: balance`.
- Rayon carte : `18px` ; bouton pilule seulement pour CTA courts.

## Composants

- Header global unique, sticky, navigation clavier complète et menu mobile piégeant correctement le focus.
- Boutons et contrôles tactiles d’au moins `44 × 44px`.
- Cartes avec bordure fine, ombre légère et déplacement vertical maximum de 2 px au survol.
- Formulaires avec labels visibles, texte de 16 px minimum sur mobile et erreurs explicites.
- Icônes structurelles exclusivement en SVG cohérents ; aucun emoji d’interface.
- Images avec dimensions réservées, `loading="lazy"` hors contenu prioritaire et `decoding="async"`.

## Responsive

- Points contrôlés : 320, 375, 430, 768, 1024 et 1440 px.
- Aucun débordement horizontal toléré.
- Réduction progressive des espacements, hauteurs de hero, cartes et galeries sur mobile.
- Les articles restent limités à 760 px et les tableaux/code deviennent défilables localement.

## Mouvement

- Durée courte : 180–360 ms.
- Propriétés privilégiées : `opacity` et `transform`.
- Apparition douce au défilement uniquement après initialisation JavaScript ; contenu visible par défaut.
- Toute animation non essentielle est supprimée avec `prefers-reduced-motion: reduce`.

## Règles permanentes

- Réutiliser les tokens et composants existants avant d’ajouter une valeur ou une variante.
- Ne pas créer un nouveau header, une nouvelle palette ou une police par page.
- Ne pas changer les URL, métadonnées ou données structurées sans nécessité SEO démontrée.
- Toute évolution visuelle doit passer les audits de structure et la matrice Playwright multi-viewport.
