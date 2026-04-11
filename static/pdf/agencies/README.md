# Pages PDF par agence

Chaque sous-dossier correspond à l'`id` d'une agence dans `src/lib/assets/agencies.json`.

Pour chaque agence, déposer les 3 JPG suivants :

- `page-07-interlocutrices.jpg`
- `page-09-bareme.jpg`
- `page-10-bareme-gestion.jpg`

Si un fichier manque pour une agence, le générateur PDF retombe automatiquement sur la version partagée dans `static/pdf/` (legacy).

Les autres pages (1, 2, 8, 11) sont communes à toutes les agences et restent dans `static/pdf/`.
