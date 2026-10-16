# Audit de sécurité — ticket #1

Date de contrôle : 15 octobre 2026  
Périmètre : dépôt Git, tunnel Foncier, fonctions Supabase, migrations et navigation publique.

## Résultats

- Aucun secret Supabase privilégié n'est codé en dur dans le JavaScript public. La clé publiée dans `site-config.js` est une clé publiable ; les fonctions serveur lisent la clé `service_role` depuis les secrets d'exécution.
- Les migrations Foncier activent RLS sur les tables métier. Les écritures publiques passent par les Edge Functions, qui valident et normalisent les entrées ; les opérations d'administration exigent une session autorisée.
- Le dépôt contenait un `private-payload.json` chiffré. Même chiffré, un dossier privé ne doit pas être suivi dans un dépôt public : le fichier est retiré de l'index et désormais ignoré. Son historique est signalé ci-dessous.
- Les fichiers de liaison temporaires de Supabase (`supabase/.temp/`) restent locaux et sont désormais ignorés.
- `foncier-promotion.html` embarquait un second header. Il est remplacé par le shell global unique, explicitement chargé par la page.

## Historique et rotation

Le payload privé chiffré apparaît dans des commits antérieurs. Aucune réécriture destructive de l'historique n'a été effectuée. Avant toute purge d'historique, il faut confirmer que le contenu ne doit plus être récupérable et coordonner la rotation du mot de passe ou de la clé ayant servi au chiffrement.

Les recherches automatisées de motifs sensibles ne remplacent pas une rotation préventive des secrets ayant déjà été copiés ailleurs. Toute clé `service_role`, tout jeton GitHub ou tout mot de passe partagé hors des gestionnaires prévus doit être révoqué puis recréé dans le service concerné.

## Contrôles d'accès Supabase

- Le navigateur ne doit recevoir que l'URL du projet et la clé publiable.
- Les clés privilégiées restent dans les secrets des Edge Functions ou de l'hébergeur.
- Les tables métier restent protégées par RLS ; aucune politique publique de lecture générale ne doit être ajoutée.
- Les tests utilisent exclusivement des données synthétiques et ne nécessitent pas de dossier client.

## Limites de cet audit

Cet audit du dépôt ne modifie ni les politiques du projet Supabase en production, ni les secrets distants, ni l'historique Git. Ces actions nécessitent une validation séparée et une fenêtre de rotation contrôlée.
