# Frontend — Portail Applicatif du Ministère

Statut : **Étape 7 / 8 — Frontend Angular**. `npm run build` au vert (Angular 20.3).

S'appuie sur : [09-backend.md](09-backend.md) (endpoints, BFF).

## 1. Pile

- **Angular 20** — composants *standalone*, *signals*, `@if/@for`, routes *lazy*.
- CSS maison, **fond blanc**, système de design coloré ([src/styles.css](../frontend/src/styles.css)) :
  tokens de couleur (violet, bleu, cyan, vert, ambre, rose), badges de statut, dégradés.
- Aucune bibliothèque UI tierce — contrôle total du rendu, bundle minimal.

## 2. Écrans

| Route | Écran | Rôle |
|---|---|---|
| `/connexion` | **Login** — page d'accueil institutionnelle, bouton « Se connecter » → `/oauth2/authorization/keycloak` | public |
| `/tableau-de-bord` | **Dashboard** — cartes d'applications groupées par catégorie, badges de statut colorés, bouton « Accéder » (désactivé si MAINTENANCE/INDISPONIBLE) | authentifié |
| `/application/:code` | **Détail** — fiche + accès | authentifié |
| `/profil` | **Profil** — identité, rôles, groupes (lecture seule) | authentifié |
| `/admin/applications` | **CRUD applications** + formulaire (statut, catégorie, sensible…) | `ADMIN_PORTAIL` |
| `/admin/politiques` | **Workflow des politiques d'accès** (voir §3) | `ADMIN_PORTAIL` |
| `/admin/categories` | CRUD catégories | `ADMIN_PORTAIL` |
| `/admin/domaines` | Liste blanche des domaines de redirection | `ADMIN_PORTAIL` |
| `/admin/configuration` | Titre, bannière, liens | `ADMIN_PORTAIL` |
| `/admin/audit` | **Journal d'audit** paginé, chips d'action/résultat colorés | `AUDITEUR_PORTAIL` |

## 3. Le workflow des politiques d'accès

Pièce maîtresse (`pages/admin/policies.ts` + `shared/workflow-stepper.ts`) :

- **Frise visuelle** en 3 étapes — *Demande créée* (violet) → *En attente d'un second
  administrateur* (ambre) → *Décision : approbation / rejet* (vert) — l'étape courante est mise
  en avant.
- Chaque politique est une carte à **bordure gauche colorée** selon son état
  (`ACTIVE_DIRECTE` bleu · `EN_ATTENTE_APPROBATION` ambre · `APPROUVEE` vert · `REJETEE` rose),
  avec sa propre frise.
- Badge d'effet : `AUTORISER` vert plein / `REFUSER` rose plein ; rappel « REFUSER l'emporte ».
- Sur une application **sensible**, l'ajout crée une politique *en attente* : boutons
  **Approuver** / **Rejeter** visibles ; le back refuse l'approbation par le demandeur (409 →
  message dédié).
- Ajout inline (type de règle, valeur, effet) ; retour toast selon `201` (active) ou `202`
  (en attente).

## 4. Sécurité côté client

| Sujet | Mise en œuvre |
|---|---|
| Jetons | jamais côté client — session gérée par le BFF (cookie `httpOnly`) |
| État de session | `GET /bff/session` → signals `authentifie`, `estAdmin`, `estAuditeur` |
| CSRF | cookie `XSRF-TOKEN` → en-tête `X-XSRF-TOKEN` (support intégré `HttpClient`) |
| `401` | intercepteur → `window.location = /oauth2/authorization/keycloak` |
| Autorisation | `authGuard`, `adminGuard`, `auditeurGuard` ; **revérifiée côté serveur** à chaque appel |
| Accès application | navigation **pleine page** vers l'URL renvoyée par l'API — jamais d'`iframe`, jamais d'URL cliente |
| Déconnexion | POST `/bff/logout` avec jeton CSRF → RP-Initiated Logout Keycloak |

## 5. Lancement

```bash
# 1. socle
docker compose -f infra/docker-compose.yml up -d      # Keycloak :8081 (+ MySQL portail)
# 2. API + BFF
cd backend && mvn spring-boot:run -pl portail-api      # :8082
              mvn spring-boot:run -pl portail-bff      # :8080
# 3. front (dev)
cd frontend && npm install && npm start                # :4200, proxy -> :8080
```

Connexion avec un utilisateur de test du realm (`ministre` / `agent1` / `auditeur1`,
mot de passe `Portail-Dev-2026!`).

En production : `npm run build` puis servir `dist/portail-frontend/` derrière le BFF (même
origine → cookies et CSP simples).

## 6. Reste à faire (étape 8 — durcissement)

- Servir le build Angular par le BFF (route `/` + fallback SPA) et resserrer la CSP.
- Tests de composants (`@angular/core/testing`) sur les guards, l'intercepteur, le stepper.
- Accessibilité RGAA (focus, contrastes, aria), i18n si besoin.
- Écran de gestion des catégories : suppression avec contrôle de référence.
