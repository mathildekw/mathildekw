# Espace vendeur privé - MVP

Cette V1 ajoute un espace vendeur privé statique pour montrer et suivre la commercialisation d’un bien. Elle est conçue pour rester simple à modifier aujourd’hui, tout en pouvant être branchée plus tard à Google Analytics, Airtable, Google Sheets ou une base de données.

## Page d’accès propriétaire

Le lien du menu “Suivi vendeur” mène vers :

`/suivi-vendeur.html`

Cette page sert d’entrée propriétaire. Le vendeur peut saisir :

- l’identifiant du bien ;
- le code privé transmis par Mathilde KW.

Le formulaire redirige ensuite vers :

`/espace-vendeur.html?bien=identifiant-du-bien&token=code-prive`

Cette page d’accès est en `noindex` pour éviter une indexation inutile.

## Accès à la démo fictive

Page publique de démonstration :

`/demo-espace-vendeur.html`

Elle affiche des données fictives pour le bien :

`Maison familiale fictive — Papeete`

La démo est aussi en `noindex`, car elle sert surtout d’outil commercial en rendez-vous ou depuis la page d’accès.

## Créer un nouvel espace vendeur

1. Ouvrir `seller-dashboard-data.js`.
2. Copier un objet existant dans `window.MathildeClientSpaces.sellerProperties`.
3. Donner un `slug` unique, par exemple `maison-paea-familiale`.
4. Définir un `accessToken` simple, par exemple `client-2026-paea`.
5. Modifier les champs visibles : `title`, `status`, `price`, `location`, `launchDate`, `welcomeMessage`.

L’URL privée devient :

`/espace-vendeur.html?bien=maison-paea-familiale&token=client-2026-paea`

Sans le bon token, la page affiche un écran d’accès privé.

Le client peut aussi passer par `/suivi-vendeur.html` et saisir son identifiant + son code.

## Modifier les statistiques

Dans `seller-dashboard-data.js`, modifier le bloc `stats` :

- `pageViews`
- `whatsappClicks`
- `phoneClicks`
- `infoRequests`
- `visitRequests`
- `qualifiedProspects`
- `completedVisits`

Aujourd’hui, ces chiffres sont manuels. Plus tard, les vues et événements pourront venir de Google Analytics Data API.

## Ajouter ou modifier une action marketing

Modifier le tableau `marketingActions` :

```js
{ label: "Publication Facebook", status: "termine", date: "16 mai 2026", comment: "Publication orientée maison familiale et secteur pratique." }
```

Statuts acceptés :

- `termine`
- `en-cours`
- `prevu`

## Ajouter un retour de visite

Modifier le tableau `marketFeedback` :

```js
{
  date: "17 mai 2026",
  buyerProfile: "Acheteur sérieux",
  interest: "chaud",
  summary: "Souhaite organiser une deuxième visite.",
  objection: "Financement à confirmer",
  nextAction: "Relancer avec les documents de copropriété."
}
```

Niveaux d’intérêt :

- `chaud`
- `tiede`
- `froid`

Ne pas mettre de nom complet de prospect dans cette V1.

## Ajouter des documents

Modifier le tableau `documents` :

```js
{ label: "Plans", status: "Dossier Google Drive", url: "https://drive.google.com/..." }
```

Pour l’instant, ne pas exposer de vrais documents sensibles. Utiliser des liens Google Drive privés si besoin.

## Événements analytics trackés

La fonction `trackEvent(eventName, params)` est dans `site.js`. Elle appelle `window.gtag` si disponible, puis ne casse rien si Google Analytics n’est pas chargé.

Événements préparés :

- `property_page_view`
- `whatsapp_click`
- `phone_click`
- `contact_form_submit`
- `visit_request_submit`
- `seller_dashboard_view`
- `seller_dashboard_denied`
- `seller_document_placeholder_click`

Paramètres envoyés quand disponibles :

- `property_slug`
- `property_title`
- `page_location`
- `page_path`
- `page_title`

## Ce qui est automatisé maintenant

- Rendu de la démo depuis `seller-dashboard-data.js`
- Rendu d’un espace privé par `bien` + `token`
- Noindex sur la page privée `espace-vendeur.html`
- Page d’accès propriétaire `suivi-vendeur.html`
- Démo fictive avec maison à Papeete, sans reprise d’un vrai bien client
- Tracking de vue du dashboard
- Tracking des clics WhatsApp et téléphone
- Ajout automatique du raccourci “Suivi vendeur” dans les menus gérés par `site.js`
- Section commerciale ajoutée sur `vendre-bien-immobilier-tahiti.html`

## Ce qui reste manuel

- Les statistiques affichées
- Les actions marketing
- Les retours de visites
- Les documents
- Les prochaines étapes

## Automatisations futures possibles

- Google Analytics Data API : récupérer automatiquement les vues de page, clics WhatsApp, appels et formulaires.
- Airtable : gérer les actions marketing, retours de visites, documents et prochaines étapes dans une interface simple.
- Google Sheets : solution légère pour mettre à jour les données sans toucher au code.
- Supabase : vraie base de données pour comptes clients, historique, documents et droits d’accès.
- CRM immobilier : synchroniser prospects, visites et offres si une API existe.

## Limites de sécurité de cette V1

Cette V1 utilise un token côté URL et des données JavaScript statiques. Elle est utile pour une démonstration et un premier suivi vendeur, mais ce n’est pas un coffre-fort sécurisé.

À éviter :

- noms complets de prospects
- documents notariaux sensibles en accès public
- offres nominatives
- données financières privées

Pour un vrai espace client sécurisé, prévoir une authentification serveur et une base de données.

## Navigation

Le raccourci “Suivi vendeur” est ajouté :

- automatiquement dans `site.js` pour les menus `.menu` et `.home-menu`
- manuellement dans la page d’accès, la page démo et la page privée
- dans la section commerciale de `vendre-bien-immobilier-tahiti.html`

Pour modifier le libellé, chercher `Suivi vendeur` dans `site.js` et dans les pages HTML concernées.

## Évolution future vers espace acheteur

L’architecture utilise le namespace global :

`window.MathildeClientSpaces`

Cela permet d’ajouter plus tard :

- `buyerProfiles`
- `buyerVisits`
- `buyerFavorites`
- `buyerDocuments`

Une future page `/espace-acheteur.html` pourra réutiliser la même logique : données statiques au départ, puis branchement à une base de données.
