# Transformation premium — état de livraison

Date : 15 octobre 2026. État : **développé et testé localement, non publié**.

## Livré

- Nouvelle landing Foncier & Promotion premium, responsive et reliée au tunnel unique existant avec attribution UTM.
- Projet HORIZON entièrement synthétique : aucune coordonnée, parcelle, référence cadastrale, photographie ou donnée client.
- Terrain 3D procédural avec relief, limites, courbes de niveau, route et environnement fictifs.
- Contrôles souris/tactiles : rotation, zoom, déplacement, vue du dessus, relief amplifié, limites, courbes et recentrage.
- Quatre scénarios sur une géométrie identique : townhouses, résidentiel, commercial et mixte.
- Page dossier réutilisable, analyse, méthode, galerie et prévisualisation/export PDF via l’impression du navigateur.
- Chargement différé de chaque scène, rendu mobile allégé, limitation du pixel ratio, nettoyage des ressources et fallback sans WebGL.
- Modèle de données privé pour les études et fichiers, partage temporaire révocable, validation explicite avant statut public.
- Administration de base : création, modification, statuts, prévisualisation synthétique, partage privé et révocation.

## Tests réussis

- Suite existante : finance, moteur foncier, Te Fenua et prospection.
- Tunnel de conversion : 7 assertions.
- Démonstration HORIZON/confidentialité : 13 assertions.
- Navigation réelle : landing et page projet chargées sans erreur console.
- WebGL : scène rendue, changement de scénario confirmé.
- Responsive 390 × 844 : aucune largeur débordante, 3D et CTA disponibles.
- Vérification de syntaxe JavaScript et TypeScript.

## À configurer ou compléter avant production

- Déployer les migrations et la fonction `foncier-studies`.
- Définir `foncier.anonKey` et le secret serveur `FONCIER_ADMIN_EMAILS`.
- Tester réellement l’authentification, le partage privé et la révocation après déploiement Supabase.
- L’interface d’import de fichiers n’est pas encore câblée : le bucket privé et les règles sont prêts, mais photos, GLB/GLTF et documents doivent encore recevoir un flux d’upload signé.
- Le PDF HORIZON utilise la prévisualisation d’impression du navigateur. Le rapport serveur existant couvre les dossiers propriétaires ; un moteur de brochure multipage incluant des captures 3D validées manuellement reste à développer pour les études réelles.
- La 3D dépend actuellement d’ESM.sh pour Three.js. Avant production, auto-héberger une version figée si une disponibilité sans dépendance externe est exigée.
- Réaliser la validation juridique finale des textes, durées de conservation et droits de réutilisation des futures sources Te Fenua.

## Publication

Aucun push GitHub, déploiement Supabase ou déploiement du site n’a été effectué. Une validation explicite reste nécessaire.
