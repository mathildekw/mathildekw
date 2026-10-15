# Audit production et prévisualisation — 15 octobre 2026

## Décision de publication

Prévisualisation locale uniquement. Aucun commit, push ou déploiement n'a été effectué pendant cet audit.

## Production et cache

- Commit local et `origin/main` avant corrections : `079298243b506ad3667e3e5834170de58a68f2db`.
- Les empreintes SHA-256 de `index.html`, `foncier-promotion.html`, `laboratoire-horizon.html`, `horizon-model.mjs` et `site-config.js` en production étaient identiques aux fichiers du commit courant.
- Hébergement détecté : GitHub Pages.
- Politique de cache observée : `Cache-Control: max-age=600`, soit jusqu'à 10 minutes. Aucun contenu divergent n'a été observé entre les requêtes contrôlées.

## Corrections préparées

- Projet HORIZON unifié à 2 600 m², altitude synthétique 18–26 m et dénivelé synthétique 8 m.
- Valeurs 29 m / 11 m supprimées du visualiseur et de la page Projet HORIZON.
- Nouvelle section premium Foncier & Promotion sur l'accueil, avec visualisation 3D chargée à la demande, CTA diagnostic et accès au laboratoire.
- Canonique SEO ajoutée au laboratoire HORIZON.
- Noms accessibles ajoutés aux contrôles du laboratoire et du formulaire promoteur.
- Le fichier public de démonstration vendeur est explicitement marqué comme réservé aux données fictives ; son second exemple est désormais déclaré comme démonstration.

## Tests exécutés

### Automatisés

`pnpm test` : succès complet.

- Calculatrices financières : OK.
- Moteur foncier : 3 scénarios validés.
- Adaptateur Te Fenua : 3 parcelles synthétiques validées.
- Prospection : dédoublonnage, score et opposition validés.
- Tunnel de conversion : 7 assertions.
- Démonstration HORIZON : 13 assertions.
- HORIZON 2 : 29 assertions.
- Workflows fonciers : 22 assertions.

### Parcours navigateur réels

- Diagnostic propriétaire en production : 10 étapes complétées avec un profil de test fictif ; pré-diagnostic affiché correctement.
- Enregistrement propriétaire : échec confirmé et correctement annoncé à l'utilisateur.
- Formulaire promoteur en production : validation complète avec société et demande fictives.
- Enregistrement promoteur : échec confirmé et correctement annoncé à l'utilisateur.
- Laboratoire 3D ordinateur : avant/après, côte à côte, vue éclatée, vue du toit, pentes et courbes testés ; 3 scènes WebGL actives, aucune erreur console.
- Laboratoire 3D mobile à 390 × 844 : aucune largeur débordante, commandes côte à côte et vue éclatée actionnables, aucune erreur console.
- Accueil corrigé : scène HORIZON chargée à l'intersection, aucun fallback, aucune largeur débordante.
- Liens et ressources internes de toutes les pages HTML racines : aucun fichier manquant.
- Pages clés : un H1, langue, description, images alternatives et boutons nommés vérifiés. Après correction, aucun contrôle non étiqueté sur le laboratoire et le formulaire promoteur.

## Connexions et limites opérationnelles

- Supabase `rqjuvutlnpwecjkpkiuw` répond `Project paused` (HTTP 540). C'est la cause vérifiée des deux échecs d'enregistrement.
- La clé publique d'authentification foncière n'est pas configurée dans `site-config.js`; les écrans privés ne peuvent donc pas être considérés opérationnels.
- Le webhook général de leads est vide.
- La synchronisation Google Sheets / Suivi KW Impact n'a pas pu être démontrée de bout en bout. Elle doit rester affichée comme non connectée tant que le backend, les secrets et l'autorisation Google ne sont pas actifs.
- Aucune synchronisation réussie n'a été simulée et aucun prospect de test n'a été enregistré.

## Confidentialité

- Les pages HORIZON contrôlées ne contiennent ni coordonnée géographique réelle, ni référence cadastrale, ni identité propriétaire, ni donnée issue d'un dossier client.
- Aucun secret de service Supabase n'est présent dans les ressources publiques inspectées.
- Les scripts d'administration utilisent des variables d'environnement pour la clé `SUPABASE_SERVICE_ROLE_KEY`; aucune valeur n'est versionnée.
- Risque résiduel : l'ancien espace vendeur statique utilise un jeton côté navigateur. Il ne contient actuellement que des exemples fictifs, mais il ne doit jamais recevoir de données réelles. Les dossiers réels doivent passer exclusivement par le portail sécurisé côté serveur.

## Avant une mise en production

1. Examiner visuellement la section d'accueil sur la prévisualisation locale.
2. Réactiver Supabase et configurer les secrets serveur.
3. Rejouer les deux soumissions avec des données de recette, puis vérifier les lignes créées et la déduplication CRM.
4. Vérifier explicitement la synchronisation Suivi KW Impact et l'outbox en cas d'indisponibilité Google.
5. Committer et pousser seulement après accord explicite.
