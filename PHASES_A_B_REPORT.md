# Pacific Keys — Foncier & Promotion 2.0

## Livraison des phases A et B

Date de vérification : 15 octobre 2026 (Tahiti).

### Phase A — audit et fondations

- Site statique modulaire en HTML, CSS et JavaScript, complété par Supabase (PostgreSQL, Auth, Storage et Edge Functions).
- Source de vérité synthétique `horizon-model.mjs` : Projet HORIZON, territoire imaginaire, 2 600 m², relief indicatif de 8 m et maillage artificiel de 2 m.
- Séparation entre données déclarées, calculs, hypothèses et informations inconnues dans l’interface.
- Nouvelle migration de sécurité : liste explicite des administrateurs, politiques RLS privées, stockage privé et journal d’audit.
- Les routes administratives des fonctions serveur vérifient désormais le rôle administrateur, et pas uniquement l’existence d’un compte connecté.
- Les anciennes références cadastrales présentes dans les tests ont été remplacées par des valeurs entièrement synthétiques.

### Phase B — vitrine 3D premium

Route créée : `/laboratoire-horizon.html`.

- Comparateur Avant / Après à caméra, relief et échelle synchronisés, curseur tactile et vue du dessus.
- Bâtiment conceptuel démontable : vue éclatée, isolation des quatre niveaux, vue du toit et réassemblage.
- Carte des pentes calculée avec légende, seuil réglable, courbes de niveau, altitudes synthétiques et profil entre deux points réglables.
- Simulation solaire avec date, heure, trois périodes de comparaison, position du soleil et ombres calculées.
- Configurateur conceptuel : six familles de programme, nombre de bâtiments réglable et statut explicite des vérifications réglementaires et techniques.
- Simulateur financier indicatif ajouté comme fondation de la phase F ; aucune règle fiscale n’est codée en dur.
- Chargement différé des scènes, rendu suspendu hors écran, nettoyage WebGL prévu et densité réduite sur mobile.

### Tests exécutés

- Suite automatisée complète : finance, moteur foncier, adaptateur Te Fenua synthétique, prospection, tunnel, ancienne démo et HORIZON 2.0.
- Résultat : 7 suites réussies, dont 21 assertions spécifiques à HORIZON 2.0.
- Test navigateur réel sur ordinateur et mobile 390 × 844.
- Interactions vérifiées : curseur Avant / Après, vue éclatée, niveau isolé, carte des pentes, seuil, date et heure solaires, profil altimétrique, typologie et nombre de bâtiments.
- Aucun débordement horizontal sur ordinateur ou mobile et aucune erreur console observée.

### Limites et éléments non présentés comme opérationnels

- HORIZON est exclusivement synthétique et illustratif ; aucun dossier client n’est utilisé.
- Les pentes, altitudes, ombres et implantations ne constituent ni une étude certifiée ni une autorisation de construire.
- Le moteur 3D charge Three.js depuis `esm.sh` : une connexion réseau est nécessaire au premier chargement.
- La migration Supabase et les fonctions serveur sont préparées mais n’ont pas été déployées en production.
- Les phases C à G restent à livrer et à tester séparément avant toute mise en production.

Mention affichée dans la démonstration : « Démonstration fictive — simulation illustrative non contractuelle. »
