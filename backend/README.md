# Backend — Portail Applicatif du Ministère

Projet Maven multi-modules. Java 17, Spring Boot 3.5.5.

## Modules

| Module | Rôle | État |
|---|---|---|
| `portail-api` | API métier du portail : catalogue, contrôle d'accès, audit, administration. OAuth2 Resource Server (JWT Keycloak). Port 8082. | **implémenté** (compile + tests OK) |
| `portail-bff` | Passerelle / BFF (Spring Cloud Gateway) : session navigateur, cookie `httpOnly`, CSRF, en-têtes, OAuth2 Login, `TokenRelay` vers `portail-api`. Port 8080. | **implémenté** (compile OK) |

## Démarrage rapide

```bash
export JAVA_HOME="/c/Program Files/Java/jdk-17"
mvn test                              # 6 tests unitaires
mvn spring-boot:run -pl portail-api   # nécessite MySQL portail_db accessible
```

Détails, endpoints, configuration et sécurité : [../docs/09-backend.md](../docs/09-backend.md).

## Conventions

- Schéma géré par **Flyway** (`portail-api/src/main/resources/db/migration`) ;
  `spring.jpa.hibernate.ddl-auto=validate`.
- Contrats REST exposés en OpenAPI (`/swagger-ui.html`).
- Secrets par variables d'environnement ; `application-local.yml` ignoré par Git.
- Aucune logique métier d'EDUSN ou du Restaurant dans ce backend.
