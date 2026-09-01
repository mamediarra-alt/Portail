# Backend — Portail Ministériel

À générer après validation du cahier des charges et du modèle du domaine.

## Modules prévus

| Module | Rôle | Dépendances clés |
|---|---|---|
| `gateway` | API Gateway / BFF | `spring-cloud-starter-gateway`, `spring-boot-starter-oauth2-client`, `spring-session` |
| `portail-api` | API métier du portail | `spring-boot-starter-web`, `spring-boot-starter-oauth2-resource-server`, `spring-boot-starter-data-jpa`, `flyway`, `postgresql` |
| `common` | DTO, exceptions, sécurité partagée | — |

## Génération (à faire)

Projet Maven multi-modules, Java 21, Spring Boot 3.x. Le wrapper `mvnw` sera
inclus (pas besoin de Maven global).

## Conventions

- Migrations SQL versionnées (Flyway) dans `portail-api/src/main/resources/db/migration`.
- Contrats REST documentés en OpenAPI.
- Profil `local` non commité (`application-local.yml` ignoré par Git).
