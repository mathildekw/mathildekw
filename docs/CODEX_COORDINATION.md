# Coordination GitHub ↔ Codex

## Ce qui est automatisé sans coût IA

1. ChatGPT crée une issue avec le modèle **Mission Codex**.
2. Le label `ai:ready` déclenche un contrôle déterministe de la structure du ticket.
3. GitHub confirme que la mission est dans la file, sans exécuter le texte du ticket.
4. Codex travaille sur une branche dédiée et ouvre une pull request.
5. Chaque pull request vers `main` exécute `pnpm test`. Les modifications visuelles déclenchent aussi Playwright.
6. Une validation humaine reste nécessaire avant toute fusion ou publication.

La validation de la file n'appelle aucun modèle IA, n'utilise aucun secret OpenAI et ne déploie rien.

## États

| Label | Signification |
|---|---|
| `ai:ready` | mission structurée en attente de prise en charge |
| `ai:working` | branche dédiée en cours |
| `ai:review` | pull request et preuves prêtes pour revue humaine |
| `ai:blocked` | autorisation, connexion ou décision nécessaire |
| `ai:approved` | validation humaine explicite obtenue ; ne signifie pas fusion automatique |

## Connexion Codex réelle

La documentation officielle distingue deux voies :

- connecter GitHub à Codex Cloud, autoriser uniquement ce dépôt et créer un environnement Codex ;
- installer une GitHub Action Codex avec une identité OpenAI séparée.

La seconde voie peut consommer des crédits et nécessite une authentification OpenAI. Elle n'est donc pas activée ici. Tant que la connexion Codex Cloud n'est pas validée, la file GitHub est opérationnelle mais la prise en charge d'une issue par Codex reste une action humaine dans l'application.

Sources officielles consultées :

- https://help.openai.com/en/articles/11390924
- https://developers.openai.com/blog/skills-agents-sdk
- https://developers.openai.com/api/docs/guides/workload-identity-federation/github-actions

## Permissions minimales

- Workflow de file : `contents: read`, `issues: write`.
- CI pull request : `contents: read` uniquement.
- Aucun secret disponible dans les tests de pull request.
- Aucun déclenchement sur `pull_request_target`.
- Les actions tierces sont épinglées par empreinte de commit.

## Protections recommandées pour `main`

À activer dans GitHub après validation :

- pull request obligatoire ;
- au moins une approbation humaine ;
- conversations résolues ;
- checks requis `functional` et, pour les changements visuels, `visual` ;
- interdiction du force-push et de la suppression de branche principale ;
- aucun contournement automatique par GitHub Actions.

## Procédure de prise en charge

1. Lire l'issue et vérifier son périmètre.
2. Remplacer `ai:ready` par `ai:working`.
3. Créer `codex/issue-N-description` depuis `origin/main`.
4. Implémenter seulement le périmètre autorisé.
5. Exécuter les tests demandés et les tests obligatoires du dépôt.
6. Pousser la branche et ouvrir une pull request liée à l'issue.
7. Remplacer `ai:working` par `ai:review`.
8. Attendre l'approbation humaine ; ne jamais fusionner ni déployer automatiquement.

## Arrêt et reprise

Retirer `ai:ready` empêche une nouvelle validation de file. Désactiver le workflow **Codex - Valider une mission** arrête la coordination GitHub sans toucher au site. Les branches et pull requests restent consultables et réversibles.
