# Architecture — Portail Ministériel

Statut : **proposition initiale** (à affiner après le cahier des charges).

## 1. Vue d'ensemble

```
                          ┌───────────────────────────┐
                          │      Navigateur (agent)    │
                          │      Angular SPA           │
                          └─────────────┬─────────────┘
                                        │ HTTPS
                                        │ OIDC Authorization Code + PKCE
                                        ▼
                          ┌───────────────────────────┐
                          │   API Gateway / BFF        │
                          │   Spring Cloud Gateway     │
                          │   - session cookie httpOnly │
                          │   - relais de token         │
                          │   - politiques d'accès      │
                          │   - rate limiting           │
                          └───┬─────────┬─────────┬─────┘
                              │         │         │
              ┌───────────────┘         │         └───────────────┐
              ▼                         ▼                         ▼
   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
   │  Portail-API       │   │  Application 1     │   │  Application 2     │
   │  Spring Boot       │   │  (stack A)         │   │  (stack B)         │
   │  Resource Server   │   │  client OIDC       │   │  client OIDC       │
   └─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘
             │                        │                        │
             ▼                        ▼                        ▼
   ┌────────────────────┐   ┌────────────────────────────────────────────┐
   │  MySQL portail_db  │   │           Keycloak (realm « ministere »)   │
   │  (données portail) │   │  IdP · SSO · MFA · RBAC · audit auth        │
   └────────────────────┘   │  Fédération LDAP/AD de l'État (option)      │
                            └────────────────────────────────────────────┘
```

## 2. Composants

### 2.1 Front-end — Angular SPA
- Application mono-page : tableau de bord, lanceur d'applications, profil, admin habilitations.
- **Ne stocke jamais de token** : dialogue avec le BFF via cookie de session `httpOnly` + `Secure` + `SameSite=Lax/Strict`.
- Protection CSRF (double submit cookie ou token synchronizer) sur les appels mutables.

### 2.2 API Gateway / BFF — Spring Cloud Gateway
- Point d'entrée unique. Termine la session navigateur, porte le token d'accès OAuth2 vers les services en aval (token relay).
- Responsabilités transverses : TLS, CORS strict, rate limiting, en-têtes de sécurité (HSTS, CSP, X-Content-Type-Options, Referrer-Policy), corrélation des requêtes (trace-id), journalisation d'accès.

### 2.3 Portail-API — Spring Boot
- Logique métier du portail : catalogue d'applications, habilitations, préférences, journal d'activité.
- `spring-security-oauth2-resource-server` : valide les JWT émis par Keycloak (signature, `iss`, `aud`, expiration).
- Autorisation par rôles/scopes (`@PreAuthorize`).

### 2.4 Keycloak — IAM / SSO
- Realm dédié `ministere`.
- Un `client` OIDC par application intégrée + un client pour le BFF.
- MFA (OTP / WebAuthn), politiques de mot de passe, brute-force detection.
- Rôles realm + rôles client → mappés dans les tokens.
- Fédération possible : LDAP/Active Directory du ministère, ou identity brokering vers un IdP national.
- Événements d'authentification exportés vers la journalisation centralisée.

### 2.5 Base de données — MySQL

- Une base **`portail_db`** dédiée au portail (MySQL 8, conçue avec MySQL Workbench,
  schéma géré par Flyway). Keycloak a sa propre base. Voir `08-base-de-donnees.md`.
- Comptes séparés : `portail_app` (CRUD, aucun DDL), `portail_migration` (Flyway).
- Chiffrement au repos (volume/SGBD), sauvegardes chiffrées. Journal d'audit append-only.

## 3. Modes d'intégration des applications existantes

| Mode | Quand l'utiliser | Impact sur l'app |
|---|---|---|
| **Client OIDC natif** | L'app peut ajouter une librairie OIDC | Faible : config client + validation token |
| **Reverse proxy + en-têtes** | L'app ne peut pas être modifiée | Nul : le gateway injecte identité/rôles en en-têtes signés |
| **SAML 2.0** | L'app ne parle que SAML | Config fournisseur de service |
| **Lien simple + SSO de session** | Intégration minimale | Nul |

Décision par application à trancher dans `04-plan-integration-apps.md`.

## 4. Environnements

| Env | Usage |
|---|---|
| `local` | Poste développeur (Docker Compose : Keycloak + MySQL `portail_db`) |
| `dev` / `recette` | Intégration continue, tests |
| `préproduction` | Iso-production, tests de charge et sécurité |
| `production` | Infrastructure de l'État |

## 5. Décisions d'architecture (ADR)

Les décisions structurantes sont consignées sous forme d'ADR courts dans
`docs/adr/` (à créer au fil de l'eau).

| # | Décision | Statut |
|---|---|---|
| 001 | SSO centralisé via Keycloak (OIDC/SAML) | Retenu |
| 002 | Pattern BFF avec Spring Cloud Gateway | Retenu |
| 003 | SPA Angular sans stockage de token côté navigateur | Retenu |
| 004 | Base du portail sur MySQL (`portail_db`), schéma géré par Flyway | Retenu |
| 005 | Intégration des applications réelles reportée en fin de projet (entrée de catalogue + client Keycloak) | Retenu |
| 006 | Contrôle d'accès de niveau portail par `PolitiqueAcces` + double validation des applications sensibles | Retenu |
