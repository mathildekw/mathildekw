# Configuration des leads des outils

Le site est statique. Les formulaires des simulateurs n’annoncent un succès que si un webhook répond correctement.

## Variable à configurer

Configurer un endpoint serveur sécurisé, puis reporter son URL dans `site-config.js` :

```js
window.MK_SITE_CONFIG = {
  leads: {
    webhookUrl: "https://ton-endpoint-securise.example/leads"
  }
}
```

Équivalent attendu côté hébergement / backend : `LEADS_WEBHOOK_URL`.

## Payload envoyé

Les outils envoient :

- source du lead
- timestamp
- coordonnées saisies
- paramètres et résultat du calcul si l’utilisateur demande une sélection

Les données financières ne sont pas envoyées à Google Analytics par le JavaScript des outils.

## Si aucun webhook n’est configuré

Le site affiche un message indiquant que la connexion automatique n’est pas encore configurée et propose WhatsApp. Il ne simule pas un enregistrement réussi.
