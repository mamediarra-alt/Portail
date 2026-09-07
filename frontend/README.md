# Frontend — Portail Applicatif du Ministère

SPA **Angular 20** (standalone, signals, lazy routes). Aucune donnée métier d'EDUSN ou du
Restaurant : uniquement l'orchestration (connexion, catalogue, accès, profil, administration,
audit).

## Démarrer en local

```bash
npm install
npm start          # http://localhost:4200 — proxie /api, /bff, /oauth2 vers le BFF (:8080)
```

Prérequis côté serveur : Keycloak (:8081), `portail-api` (:8082), `portail-bff` (:8080).
Voir [../docs/09-backend.md](../docs/09-backend.md).

## Build

```bash
npm run build      # dist/portail-frontend  (à servir par le BFF en production)
```

## Structure

| Dossier | Rôle |
|---|---|
| `core/` | `SessionService`, `ApiService`, `ToastService`, intercepteur 401, guards (`authGuard`, `adminGuard`, `auditeurGuard`), modèles |
| `layout/` | `Shell` — en-tête, navigation, pied |
| `shared/` | `WorkflowStepper` (frise de validation des politiques), `ToastHost`, libellés/couleurs |
| `pages/` | `Login`, `Dashboard`, `AppDetail`, `Profile` |
| `pages/admin/` | `Admin` + `AdminApplications`, `AdminPolicies`, `AdminCategories`, `AdminDomains`, `AdminConfig`, `AdminAudit` |

## Sécurité côté client

- Aucun jeton stocké : le BFF gère la session (cookie `httpOnly`).
- CSRF : cookie `XSRF-TOKEN` → en-tête `X-XSRF-TOKEN` (support intégré de `HttpClient`).
- `401` → relance automatique du parcours OIDC (`/oauth2/authorization/keycloak`).
- Le masquage d'un bouton n'est **pas** une sécurité : chaque appel est revérifié côté serveur.
- « Accéder » = navigation **pleine page** vers l'URL renvoyée par l'API (jamais une URL saisie).
