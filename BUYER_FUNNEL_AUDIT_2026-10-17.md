# Audit tunnel acquéreur — 17 octobre 2026

## Capacités confirmées

- Supabase, authentification du dashboard, notifications et synchronisation KW Impact existent déjà dans le dépôt. Le tunnel les étend sans recréer le CRM.
- Modelo présente publiquement une API Office pour les biens, contacts, fiches acquéreurs et tâches. L'accès requiert une URL, un code agence et une clé privée fournis depuis le compte Modelo. Aucun de ces secrets n'est présent dans le dépôt.
- Le rapprochement acquéreur / biens existe dans Modelo, mais aucun droit ni schéma d'API propre au compte KW Polynésie n'a été fourni. Le comptage reste donc désactivé.

## Capacités non confirmées

- Aucune documentation publique officielle Actelo identifiant une API, un webhook ou un import de contacts n'a été trouvée. La déclaration MiNiTAUX reste une tâche privée manuelle ouvrant le formulaire partenaire.
- Le jeton Hermes communiqué n'a pas été stocké ni utilisé : aucun contrat d'API Hermes n'existe dans le projet et son périmètre n'est pas documenté.
- Les conditions « première étude gratuite, sans engagement » et la rémunération de 35 000 F CFP doivent être confirmées contractuellement avant affichage/automatisation. Le montant n'apparaît pas dans le parcours public.

## Comportement livré

- Sans connecteur Passerelle autorisé, aucune quantité n'est inventée ; le visiteur voit que sa recherche est enregistrée.
- Les demandes Modelo et Actelo sont mises en file de traitement manuel et ne sont jamais présentées comme activées ou transmises.
- Les consentements sont séparés, datés, versionnés et non précochés.
- Les profils sont dédupliqués par email ou téléphone ; plusieurs recherches sont possibles par profil ; une mise en relation courtier est unique par profil et recherche.
