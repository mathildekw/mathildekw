# Équipe IA — architecture, activation et limites

## État réel

Cette livraison prépare une infrastructure exécutable mais ne l'active pas en production : aucun push, workflow distant, modèle payant ou déploiement n'a été lancé.

Les contrôles déterministes fonctionnent localement et sont prévus pour GitHub Actions. La couche utilisant un modèle IA, le développement automatique et la publication de contenus restent désactivés.

## Architecture

1. `config/ai-team.json` définit les agents, les fréquences, les pages surveillées et les budgets.
2. `scripts/ai-team/run-audit.mjs` exécute des contrôles reproductibles sans données clients et sans modèle IA.
3. Les workflows GitHub planifient les contrôles ordinateur éteint.
4. Les rapports complets sont conservés comme artefacts GitHub.
5. Le bilan hebdomadaire crée une branche et une pull request. Il ne fusionne rien.
6. `admin-equipe-ia.html` affiche uniquement le dernier rapport approuvé présent dans le site.

## Fréquences prévues

- Quotidien : 06:20, heure de Tahiti.
- Hebdomadaire : lundi à 07:00, heure de Tahiti.
- Mensuel : le 1er à 07:30, heure de Tahiti.

Les expressions GitHub utilisent UTC et tiennent compte du fuseau fixe UTC-10 de Tahiti.

## Agents

### Exécutables sans modèle

- AI Project Manager : rassemble et priorise les anomalies lors du bilan hebdomadaire.
- Conversion Optimizer : structure disponible ; données analytiques réelles encore nécessaires.
- Design Director : structure disponible ; revue visuelle automatisée avancée encore à brancher.
- SEO Growth Agent : contrôle disponibilité, title, description et H1.
- Security & QA Guardian : liens internes, motifs de secrets et tests critiques.
- Land Intelligence Agent : disponibilité et capacité d'interrogation du service cadastral Te Fenua autorisé.

### Désactivés par sécurité

- AI Developer : nécessite un modèle, un budget, une clé serveur et une politique de fichiers autorisés.
- Real Estate Content Strategist : nécessite un modèle et une validation éditoriale.

Un agent désactivé n'est jamais présenté comme actif dans le dashboard.

## Coûts

La configuration initiale interdit les appels aux modèles :

- budget quotidien : 0 USD ;
- budget mensuel : 0 USD ;
- appels IA : 0 ;
- retries IA : 1 maximum si la couche est un jour activée.

GitHub Actions peut être gratuit dans la limite du quota inclus au compte GitHub. Il faut vérifier le forfait et les minutes disponibles dans les paramètres Billing avant activation. Aucun coût externe n'est engagé par le code seul.

## Sécurité

- Permissions quotidiennes et mensuelles : lecture du dépôt uniquement.
- Permission d'écriture accordée uniquement au workflow hebdomadaire afin de créer une branche et une PR.
- Actions tierces limitées aux actions GitHub officielles, verrouillées sur un SHA précis.
- Aucun événement `pull_request_target`.
- Aucun secret de production transmis au code audité.
- Aucun formulaire réel soumis par les tâches planifiées.
- Aucune donnée client utilisée.
- Aucun auto-merge et aucun auto-déploiement.

## Activation contrôlée

1. Faire relire les fichiers `.github/workflows/`.
2. Pousser les changements sur une branche dédiée.
3. Ouvrir une PR et vérifier les tests.
4. Dans GitHub, protéger `main` : PR obligatoire, au moins une approbation, checks obligatoires, interdiction du force-push et de la suppression.
5. Autoriser GitHub Actions à créer des pull requests si le dépôt l'interdit par défaut.
6. Fusionner seulement après validation humaine.
7. Lancer manuellement `AI Team - Surveillance quotidienne` une première fois.
8. Vérifier l'artefact avant de laisser les planifications actives.

## Arrêt d'urgence

- Désactiver les workflows dans l'onglet Actions de GitHub, ou supprimer leurs planifications dans une PR.
- Laisser `modelCalls.enabled` à `false` bloque la couche payante.
- Aucun arrêt du site public n'est nécessaire : la surveillance est indépendante.

## Limites connues

- Supabase est en pause et `anonKey` n'est pas configurée : le dashboard ne peut pas encore être protégé par l'authentification privée existante.
- En attendant, le dashboard ne contient que des résultats techniques non sensibles et porte `noindex,nofollow,noarchive`. Il ne doit pas être publié avant mise en place de son contrôle d'accès.
- Google Analytics/Search Console ne sont pas connectés : aucune statistique de conversion ou SEO n'est inventée.
- Le suivi KW Impact n'est pas utilisé par les agents.
- Les contrôles navigateur avancés, captures comparatives et audits Lighthouse cloud ne sont pas encore activés.
- Les boutons d'activation/désactivation d'un agent ne sont pas simulés : la configuration passe volontairement par une PR relue.
- Aucune notification email n'est envoyée. Les rapports apparaissent dans GitHub Actions et dans les PR hebdomadaires.

## Première validation locale

Le 15 octobre 2026, l'audit hebdomadaire local a exécuté 16 contrôles : 16 réussites, 0 avertissement, 0 échec. Le service Te Fenua contrôlé répondait avec des métadonnées exploitables. Le coût IA était de 0 USD.
