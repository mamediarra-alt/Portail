# Portail Ministériel

Portail d'accès unifié (SSO) regroupant plusieurs applications métier de ministères.

## Objectif

Fournir un point d'entrée unique, sécurisé et centralisé vers des applications
existantes développées avec des technologies hétérogènes. Le portail gère
l'authentification unique (SSO), les habilitations, la navigation inter-applications
et la traçabilité.

## Périmètre initial

1. Construire le portail : **modélisation → conception → sécurité**.
2. Une fois le portail prêt et éprouvé, **intégrer les deux applications existantes**.

## Stack technique

| Couche | Technologie |
|---|---|
| Front-end | Angular |
| API / passerelle | Spring Boot, Spring Cloud Gateway (pattern BFF) |
| Sécurité / SSO | Keycloak (OIDC + SAML 2.0), Spring Security |
| Base de données | PostgreSQL |
| Conteneurisation | Docker / Docker Compose |

## Structure du dépôt

```
portail/
├── docs/                       Documentation projet
│   ├── 00-cahier-des-charges.md   <-- à compléter avec le CDC fourni
│   ├── 01-architecture.md
│   ├── 02-securite.md
│   ├── 03-modelisation.md
│   └── 04-plan-integration-apps.md
├── backend/                    Spring Boot (gateway + portail-api)  [à générer]
├── frontend/                   Application Angular                  [à générer]
├── infra/
│   ├── keycloak/               Configuration du realm Keycloak
│   └── docker-compose.yml      Keycloak + PostgreSQL
└── README.md
```

## Démarrage (à venir)

Le code applicatif sera généré après validation du cahier des charges et du
modèle du domaine. Voir `docs/` pour l'avancement.

## Prérequis poste de développement

- Git
- JDK 21+ (Java 25 présent)
- Node.js 20+ / npm (Node 24 présent)
- Docker Desktop **(à installer)**
