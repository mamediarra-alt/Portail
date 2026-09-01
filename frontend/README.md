# Frontend — Portail Ministériel

À générer après validation des maquettes et du cahier des charges.

## Pile

- Angular (dernière LTS), TypeScript strict.
- Communication avec le BFF uniquement (cookie de session `httpOnly`), jamais de token côté navigateur.
- Intercepteur HTTP : gestion CSRF, redirection vers login sur 401, corrélation des requêtes.

## Écrans prévus

- Connexion (redirection SSO)
- Tableau de bord / lanceur d'applications
- Profil utilisateur + préférences
- Administration des habilitations
- Journal d'audit (admin)

## Génération (à faire)

`npx @angular/cli@latest new frontend --routing --style=scss` (Angular CLI via npx,
pas d'installation globale).

## Qualité

- ESLint + règles sécurité, Prettier.
- `npm audit` en CI.
- Respect RGAA / WCAG (à confirmer le niveau avec le CDC).
