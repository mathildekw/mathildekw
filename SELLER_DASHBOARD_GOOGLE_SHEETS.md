# Connecter l’espace vendeur à Google Sheets

Cette documentation explique comment connecter l’espace vendeur de `mathildekw.com` au Google Sheet **Mon CRM** via Google Apps Script.

Le principe :

- le propriétaire va sur `/suivi-vendeur.html` ;
- il entre son identifiant mandat + son code privé ;
- le site ouvre `/espace-vendeur.html?bien=MANDAT_ID&token=TOKEN` ;
- le site appelle l’URL Apps Script ;
- Apps Script lit le Google Sheet, vérifie le token, filtre les données privées et renvoie un JSON propre.

## 1. Importer l’Excel dans Google Sheets

1. Ouvre Google Drive.
2. Importe le fichier Excel `suivi_vendeurs_kw_template_v11_demo_fictif.xlsx`.
3. Ouvre le fichier importé.
4. Fais `Fichier > Enregistrer au format Google Sheets` si Google ne l’a pas déjà converti.
5. Renomme le fichier en **Mon CRM**.

Le site ne lit pas le fichier `.xlsx` local. Il lit uniquement le Google Sheet cloud via Apps Script.

## 2. Trouver le Google Sheet ID

Dans l’URL du Google Sheet :

```text
https://docs.google.com/spreadsheets/d/GOOGLE_SHEET_ID/edit
```

Copie la partie entre `/d/` et `/edit`.

Dans l’onglet `CONFIG_SITE`, remplis :

```text
GOOGLE_SHEET_ID = ton ID Google Sheet
DEFAULT_DEMO_MANDAT_ID = MANDAT_DEMO_FICTIF
OWNER_LOGIN_PAGE = /suivi-vendeur.html
OWNER_DASHBOARD_PAGE = /espace-vendeur.html
TOKEN_MODE = private-token
```

Pour l’instant, `APPS_SCRIPT_WEBAPP_URL` reste vide jusqu’au déploiement.

## 3. Préparer INDEX_MANDATS

L’onglet `INDEX_MANDATS` doit contenir une ligne par mandat.

Colonnes attendues ou recommandées :

```text
ID_mandat
Onglet mandat
Propriétaire
Bien
Commune
Statut
Prix
Dernière visite
Prochaine action
Priorité
Slug site
Code privé
Actif espace vendeur
```

Le script accepte plusieurs noms proches, mais ces intitulés sont les plus propres.

Exemple :

```text
ID_mandat = MANDAT_DEMO_FICTIF
Onglet mandat = MANDAT_DEMO_FICTIF
Bien = Villa démo avec jardin
Commune = Commune fictive
Statut = Démo
Prix = 88 000 000 XPF
Slug site = MANDAT_DEMO_FICTIF
Code privé = demo-vendeur
Actif espace vendeur = Oui
```

Le propriétaire pourra se connecter avec :

```text
Identifiant mandat : MANDAT_DEMO_FICTIF
Code privé : demo-vendeur
```

## 4. Créer le Google Apps Script

1. Ouvre le Google Sheet **Mon CRM**.
2. Clique sur `Extensions > Apps Script`.
3. Supprime le contenu de `Code.gs`.
4. Copie le contenu du fichier :

```text
apps-script/seller-dashboard-webapp.gs
```

5. Colle-le dans `Code.gs`.
6. Enregistre le projet, par exemple :

```text
Mathilde KW - Espace vendeur API
```

## 5. Déployer la Web App

Dans Apps Script :

1. Clique sur `Déployer > Nouveau déploiement`.
2. Type : `Application Web`.
3. Description : `Espace vendeur API`.
4. Exécuter en tant que : `Moi`.
5. Accès : `Toute personne disposant du lien`.
6. Clique sur `Déployer`.
7. Autorise les permissions Google demandées.
8. Copie l’URL de l’application Web.

L’URL ressemble à :

```text
https://script.google.com/macros/s/XXXXX/exec
```

## 6. Coller l’URL Web App

Dans `CONFIG_SITE`, colle l’URL dans :

```text
APPS_SCRIPT_WEBAPP_URL
```

Dans le site, colle aussi cette même URL dans :

```js
seller-dashboard-data.js
window.MathildeClientSpaces.config.appsScriptUrl = "https://script.google.com/macros/s/XXXXX/exec";
```

Tant que cette URL est vide côté site, l’espace vendeur utilise le fallback local `seller-dashboard-data.js`.

## 7. Créer un nouveau mandat

1. Duplique l’onglet `MODELE_MANDAT` ou un onglet `MANDAT_A_COMPLETER_XX`.
2. Renomme-le clairement, par exemple :

```text
MANDAT_MAISON_PAPEETE_01
```

3. Remplis les blocs roses :

- identité propriétaire ;
- infos bien ;
- compteurs simples ;
- visites ;
- actions marketing ;
- documents ;
- synthèse propriétaire.

4. Ajoute une ligne dans `INDEX_MANDATS`.

Exemple :

```text
ID_mandat = MANDAT_MAISON_PAPEETE_01
Onglet mandat = MANDAT_MAISON_PAPEETE_01
Slug site = MANDAT_MAISON_PAPEETE_01
Code privé = papeete-2026-privé
Actif espace vendeur = Oui
```

5. Donne au propriétaire :

```text
Identifiant mandat : MANDAT_MAISON_PAPEETE_01
Code privé : papeete-2026-privé
```

Ou directement :

```text
https://mathildekw.com/espace-vendeur.html?bien=MANDAT_MAISON_PAPEETE_01&token=papeete-2026-privé
```

## 8. Remplir les compteurs

Dans la section `3. CONTACTS / COMPTEURS SIMPLES`, remplis :

- Messages WhatsApp ;
- Appels ;
- SMS ;
- Demandes vidéo ;
- Demandes visite ;
- Prospects qualifiés ;
- Notes rapides.

Le propriétaire voit les chiffres agrégés. Il ne voit pas les notes privées.

## 9. Remplir les visites prévues

Dans la section `4. VISITES`, ajoute une ligne avec :

- Date ;
- Heure ;
- Statut visite ;
- Profil affiché propriétaire ;
- Niveau intérêt ;
- Prochaine action ;
- Visible propriétaire = Oui.

Le champ `Nom interne` n’est jamais affiché au propriétaire.

## 10. Remplir les retours de visites

Pour une visite réalisée, remplis :

- Statut visite = Réalisée ;
- Profil affiché propriétaire ;
- Niveau intérêt ;
- Retour propriétaire ;
- Objection principale ;
- Prochaine action ;
- Visible propriétaire = Oui.

À ne pas écrire dans les champs visibles :

- nom complet de l’acheteur ;
- téléphone ;
- email ;
- détails de négociation sensibles ;
- capacité financière précise.

## 11. Actions marketing

Dans `5. ACTIONS MARKETING`, remplis :

- Date ;
- Action ;
- Canal ;
- Statut ;
- Commentaire propriétaire ;
- Visible propriétaire.

Le champ `Note privée Mathilde` n’est jamais envoyé au site.

## 12. Documents

Dans `6. DOCUMENTS`, remplis :

- Document ;
- Statut ;
- Lien / emplacement ;
- À relancer ? ;
- Commentaire.

Le script n’autorise que les liens Google Drive ou Google Docs :

```text
https://drive.google.com/...
https://docs.google.com/...
```

Si le lien est vide ou non reconnu, le site affiche le document sans lien cliquable.

## 13. Zones à ne jamais modifier

Évite de modifier :

- les noms des sections ;
- les en-têtes de tableaux ;
- les colonnes `Visible propriétaire` ;
- les colonnes internes ;
- l’onglet `CONFIG_SITE` sauf pour remplir les valeurs demandées ;
- l’onglet `GUIDE_CODEX`.

Si tu renommes un onglet mandat, mets à jour la colonne `Onglet mandat` dans `INDEX_MANDATS`.

## 14. Données jamais affichées au propriétaire

Le script ne renvoie pas :

- `Nom interne` ;
- téléphone prospect ;
- email prospect ;
- `Note privée Mathilde` ;
- colonnes techniques ;
- champs marqués privé / interne / private ;
- notes de négociation sensibles.

Le site ne reçoit que les données filtrées.

## 15. Tests à faire

### Test accès OK

Avec :

```text
bien = MANDAT_DEMO_FICTIF
token = demo-vendeur
```

Ouvre :

```text
/espace-vendeur.html?bien=MANDAT_DEMO_FICTIF&token=demo-vendeur
```

Le dashboard doit s’afficher.

### Test mauvais token

Ouvre :

```text
/espace-vendeur.html?bien=MANDAT_DEMO_FICTIF&token=faux
```

Le site doit afficher :

```text
Accès privé invalide ou expiré.
```

### Test mandat inexistant

Ouvre :

```text
/espace-vendeur.html?bien=MANDAT_INCONNU&token=test
```

Le site doit afficher :

```text
Accès privé invalide ou expiré.
```

### Test mandat inactif

Dans `INDEX_MANDATS`, mets :

```text
Actif espace vendeur = Non
```

Le site doit afficher :

```text
Accès privé invalide ou expiré.
```

### Test API indisponible

Si l’URL Apps Script est mauvaise ou si Apps Script ne répond pas, le site doit afficher :

```text
Les données de suivi sont momentanément indisponibles.
```

### Test fallback local

Si `appsScriptUrl` est vide dans `seller-dashboard-data.js`, la démo doit continuer à fonctionner avec les données fictives locales.

## 16. Fichiers du site concernés

- `suivi-vendeur.html` : formulaire d’accès propriétaire.
- `espace-vendeur.html` : page dashboard privé.
- `seller-dashboard.js` : charge Apps Script ou fallback local.
- `seller-dashboard-data.js` : configuration + fallback local.
- `apps-script/seller-dashboard-webapp.gs` : code à coller dans Apps Script.

## 17. Mise à jour du site après déploiement

Après avoir déployé Apps Script :

1. Copie l’URL Web App.
2. Remplis `CONFIG_SITE > APPS_SCRIPT_WEBAPP_URL`.
3. Donne l’URL à Codex ou colle-la dans `seller-dashboard-data.js`.
4. Commit + push le changement.

Sans cette dernière étape côté site, le dashboard ne peut pas encore appeler Google Sheets en production.
