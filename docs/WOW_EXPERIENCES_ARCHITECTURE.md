# Architecture — expériences immobilières premium

## Audit synthétique

- Stack : site statique HTML/CSS/JavaScript, publié par GitHub Pages.
- UI : shell global partagé, tokens Mathilde KW/Pacific Keys, Cormorant Garamond + DM Sans.
- Données : Supabase avec RLS et fonctions Edge ; aucune clé privilégiée côté navigateur.
- Parcours réutilisés : tunnel acquéreur, estimation, foncier, division, financement et rendez-vous.
- Mesure : analytics consentis via les fonctions existantes.
- Connecteurs : KW Impact préparé côté serveur mais ne doit pas être présenté comme connecté sans confirmation réelle.

## Architecture commune retenue

1. **Mon Tahiti idéal** produit un résultat anonyme côté navigateur. Seuls des événements agrégés peuvent être mesurés avec consentement. Le transfert vers le tunnel acquéreur est volontaire et ne contient aucune coordonnée personnelle.
2. **Immersive Properties** sera un rendu progressif au-dessus des données d’annonce existantes. Le mode classique restera la source accessible et rapide. La démonstration utilisera exclusivement des données synthétiques.
3. **Concierge immobilier** utilisera une interface séparée du moteur. Sans fournisseur IA et budget approuvés, seul un routeur déterministe vers les parcours vérifiés pourra être activé ; il ne sera pas présenté comme une IA générative.

## Contrats communs

- Navigation et footer : `global-shell.js` et `global-shell.css` uniquement.
- Transfert acquéreur : `sessionStorage` pour les critères non personnels, puis consentement explicite dans le formulaire existant.
- Rendez-vous : routes publiques existantes, confirmation uniquement après réponse serveur.
- Analytics : événements sans contenu de conversation, coordonnées ou réponses sensibles.
- Sécurité : aucun accès au CRM, aux dossiers privés ou aux clés de service depuis le navigateur.
- Performance : amélioration progressive, contenu utilisable sans animation, `prefers-reduced-motion`, une seule expérience lourde chargée à la fois.

## État des phases

- Phase A : audit et architecture commune terminés.
- Phase B : quiz lifestyle, classement explicable, carte, partage et passerelle acquéreur implémentés ; validation de prévisualisation requise avant fusion.
- Phases C à F : non commencées sur cette branche afin d’éviter des changements concurrents sur les composants communs.
