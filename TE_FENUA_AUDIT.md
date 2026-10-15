# Audit Te Fenua — 15 octobre 2026

## Activation publique

### Autorisé et intégré

- Parcelles cadastrales DAF, couche `CAD_parcelles_open/FeatureServer/0`.
- Fiche ArcGIS publique : `8fe5ef1c506244edacac5cc922a4ec20`.
- Licence déclarée : **Licence Ouverte Etalab 2.0**.
- Champs utilisés : `OBJECTID`, `Identifiant_complet`, `iu_parcelle`, `section_parcelle`, `commune`, `commune_associee`, `ile`, `surface_m2`.
- Projection de sortie demandée : WGS84 / EPSG:4326 pour l’affichage.
- Pagination et requêtes spatiales supportées. Limite constatée : 2 000 enregistrements par réponse ; l’interface publique limite volontairement les résultats à 20.

La valeur `surface_m2` est libellée « Surface en m² » par le service. Elle est présentée comme donnée publique indicative, jamais comme contenance cadastrale certifiée ni comme mesure recalculée.

### Disponible mais non activé publiquement

- BD topo DAF : Licence Ouverte / Open Licence, compatible ODC-BY et CC-BY 4.0. Elle contient notamment les routes (`layer 8`) et bâtiments (`layer 17`). Son usage sera réservé à la prochaine étape de préanalyse spatiale avec attribution.
- PGA DCA, couche `Zonage_PGA_vue_test` : service public et interrogeable, mais `licenseInfo` et `termsOfUse` absents de la fiche ArcGIS inspectée. Affichage public non activé.
- PPR DCA, couche `Aléa_et_zonage_PPR_public` : service public et présenté comme donnée de référence, mais aucune licence de réutilisation n’est déclarée dans la fiche ArcGIS inspectée. Affichage public non activé.

Une accessibilité technique publique ne suffit pas à établir un droit de réutilisation commerciale. Une confirmation écrite de la DCA est requise avant activation PGA/PPR.

## Garde-fous

- Aucune donnée nominative de propriétaire n’est recherchée.
- La sélection doit être confirmée manuellement.
- Si ArcGIS ou le fond de carte est indisponible, la saisie manuelle reste accessible.
- La proximité d’une route ne sera jamais décrite comme preuve d’un accès juridique.
- Un zonage ne sera jamais transformé automatiquement en affirmation de constructibilité.
- Les sources et la date de consultation sont conservées avec la sélection.
