# Règles permanentes — Design Mathildekw.com

## Architecture

Ce dépôt est un site statique HTML/CSS/JavaScript publié sur GitHub Pages. Ne pas introduire React, Next.js ou un autre framework sans décision explicite.

## Source unique de vérité

- Les tokens et composants publics officiels vivent dans `global-shell.css`.
- La navigation publique officielle vit dans `global-shell.js`.
- La référence visuelle est `design-system.html`.
- Les règles de structure sont documentées dans `PAGE_TEMPLATES.md`.

## Interdictions

- Ne jamais créer un second header, menu principal ou footer public.
- Ne pas ajouter de palette, police, bouton ou espacement arbitraire lorsqu’un token ou composant existe.
- Ne pas copier le shell global dans une page HTML.
- Ne pas modifier une règle globale sans exécuter les tests fonctionnels et visuels.
- Ne jamais utiliser de dossier client réel dans les tests ou démonstrations.
- Ne jamais fusionner ou déployer automatiquement une modification visuelle.

## Workflow obligatoire

1. Travailler sur une branche dédiée.
2. Réutiliser les composants existants.
3. Exécuter `pnpm test`.
4. Exécuter `pnpm test:visual` pour toute modification de CSS, navigation ou layout.
5. Examiner les captures et différences.
6. Présenter la prévisualisation avant fusion et publication.

Une modification visuelle doit rester limitée, réversible et justifiée par une capture ou un défaut reproductible.
