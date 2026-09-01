# Plan d'intégration des applications existantes

Statut : **cadre** — à instruire une fois le portail opérationnel et les stacks des
deux applications connues.

## Principe

Le portail est conçu **agnostique** : les applications restent autonomes et ne sont
intégrées qu'au moment voulu, via l'un des modes décrits ci-dessous. Aucune
réécriture des applications n'est visée.

## Modes d'intégration disponibles

| Mode | Prérequis application | Effort | Recommandé quand |
|---|---|---|---|
| `OIDC_NATIF` | Peut embarquer une lib OIDC/OAuth2 | Moyen | L'app est maintenable et modifiable |
| `SAML` | Supporte SAML 2.0 (SP) | Moyen | Écosystème legacy orienté SAML |
| `REVERSE_PROXY` | Aucun (identité injectée en en-têtes signés par le gateway) | Faible | L'app ne peut pas être modifiée |
| `LIEN_SIMPLE` | Aucun | Très faible | Intégration minimale, SSO de session partagé |

## Fiche par application (à compléter)

### Application 1 — _(nom)_
- Stack / langage : _(à préciser)_
- Authentification actuelle : _(interne / LDAP / autre)_
- Peut être modifiée : _(oui / non)_
- Mode retenu : _(à décider)_
- Client Keycloak à créer : _(id, redirect URIs, rôles)_
- Mapping des rôles portail → rôles application : _(tableau)_
- Points d'attention : _(sessions, cookies, CORS, URLs internes)_

### Application 2 — _(nom)_
- Stack / langage : _(à préciser)_
- Authentification actuelle : _(interne / LDAP / autre)_
- Peut être modifiée : _(oui / non)_
- Mode retenu : _(à décider)_
- Client Keycloak à créer : _(id, redirect URIs, rôles)_
- Mapping des rôles portail → rôles application : _(tableau)_
- Points d'attention : _(sessions, cookies, CORS, URLs internes)_

## Étapes types d'intégration d'une application

1. Recenser la stack, l'authentification actuelle, les URLs, les rôles.
2. Choisir le mode d'intégration.
3. Créer le `client` dans le realm Keycloak `ministere`.
4. Déclarer l'application dans le catalogue du portail (code, libellé, URL, mode, icône).
5. Configurer le routage dans le gateway (route + politique d'accès).
6. Câbler l'authentification côté application (OIDC/SAML) ou l'injection d'en-têtes (reverse proxy).
7. Mapper les rôles portail ↔ rôles application.
8. Tester : SSO, SLO, accès autorisé/refusé, expiration de session.
9. Test de sécurité ciblé (DAST, revue config).
10. Recette fonctionnelle puis bascule.
