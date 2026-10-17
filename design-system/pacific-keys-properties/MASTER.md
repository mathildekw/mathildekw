# Design system — Mathilde KW / Pacific Keys Properties

Ce fichier formalise l’identité retenue après la refonte architecturale 2026. Le glassmorphism est désormais un langage de profondeur centralisé, jamais un filtre décoratif appliqué partout. Les suggestions génériques bleu SaaS et les polices Cinzel/Josefin restent écartées afin de conserver l’identité humaine et locale de Mathilde.

## Principes

- Chaleureux, expert, local et premium sans ostentation.
- Une navigation, un rythme et des composants communs sur toutes les pages publiques.
- Contenu immobilier réel conservé ; aucune preuve sociale ou donnée commerciale inventée.
- Mobile d’abord : contenu essentiel immédiat, sections plus denses, aucune largeur fixe.
- Mouvement discret et fonctionnel, avec contenu visible sans JavaScript et respect de `prefers-reduced-motion`.
- Composition éditoriale inspirée d’un magazine d’architecture : asymétrie maîtrisée, grandes images réelles, surfaces franches et verre utilisé aux points de profondeur utiles.

## Système glass

- `glass-subtle` : petits contrôles et badges, blur 10 px.
- `glass-card` : cartes de contenu, blur 18 px et bordure lumineuse fine.
- `glass-elevated` : panneaux prioritaires et éléments flottants, blur 28 px.
- `glass-dark` : surfaces techniques sombres et Foncier & Promotion.
- `glass-nav` : navigation flottante, contraste stable au repos et au défilement.
- Fallback opaque obligatoire lorsque `backdrop-filter` n’est pas disponible.
- Le verre n’est jamais posé sur une photographie trop contrastée sans voile de lisibilité.

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
- Rayons : `12px`, `20px`, `30px`, `42px` ; bouton pilule seulement pour CTA courts.
- Accueil : hero lumineux en deux panneaux sur desktop, contenu puis image sur mobile ; les textes et preuves restent strictement identiques.

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

- Durées : 180 ms (feedback), 420 ms (transition), 760 ms (reveal éditorial).
- Propriétés privilégiées : `opacity` et `transform`.
- Apparition douce au défilement avec fade, translation et blur très bref ; contenu visible par défaut.
- Progression de lecture globale, header compact au scroll et halo pointeur réservés aux périphériques fins.
- Toute animation non essentielle est supprimée avec `prefers-reduced-motion: reduce`.

## Règles permanentes

- Réutiliser les tokens et composants existants avant d’ajouter une valeur ou une variante.
- Ne pas créer un nouveau header, une nouvelle palette ou une police par page.
- Ne pas changer les URL, métadonnées ou données structurées sans nécessité SEO démontrée.
- Toute évolution visuelle doit passer les audits de structure et la matrice Playwright multi-viewport.
