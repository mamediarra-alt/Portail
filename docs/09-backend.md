# Backend — Portail Applicatif du Ministère

Statut : **Étape 6 / 8 — Backend** : `portail-api` (métier) **et** `portail-bff` (passerelle /
session OAuth2). Les deux modules compilent ; `mvn test` → 6/6.

S'appuie sur : [06-diagramme-classes.md](06-diagramme-classes.md) (entités, services),
[07-diagrammes-sequence.md](07-diagrammes-sequence.md) (flux), [08-base-de-donnees.md](08-base-de-donnees.md)
(schéma MySQL).

État : **compile et tests unitaires au vert** (`mvn test` → 6/6). Java 17, Spring Boot 3.5.5.

---

## 1. Structure

```
backend/
├── pom.xml                        parent (Spring Boot 3.5.5, Java 17, Spring Cloud 2025.0.0)
└── portail-api/
    ├── pom.xml
    └── src/main/
        ├── java/gouv/ministere/portail/
        │   ├── PortailApiApplication.java
        │   ├── config/       SecurityConfig, OpenApiConfig
        │   ├── domain/       entités JPA + énumérations (Application, CategorieApplication,
        │   │                 PolitiqueAcces, DomaineAutorise, EvenementAudit, ConfigurationPortail)
        │   ├── repository/   Spring Data JPA
        │   ├── security/     IdentiteUtilisateur, ConvertisseurRolesRealm, UtilisateurCourant
        │   ├── service/      ServiceControleAcces, ServiceCatalogue, ServiceAcces,
        │   │                 ValidateurUrlCible, ServiceAudit, ServiceAdministrationCatalogue,
        │   │                 ServicePolitiqueAcces, ServiceConfiguration (+ records de commande)
        │   ├── error/        exceptions métier
        │   └── web/          contrôleurs REST + DTO imbriqués + GestionnaireExceptions
        │       └── admin/    contrôleurs d'administration
        └── resources/
            ├── application.yml
            └── db/migration/ V1__schema_initial.sql, V2__donnees_reference.sql
```

Correspondance avec l'étape 3 : chaque service du diagramme de classes a sa classe `@Service` ;
chaque entité a sa table (V1). Aucune logique métier d'EDUSN / Restaurant.

## 2. Endpoints

| Méthode | Chemin | Rôle requis | Cas d'utilisation |
|---|---|---|---|
| `GET` | `/api/catalogue` | authentifié | UC03 — catalogue filtré (`Cache-Control: no-store`) |
| `GET` | `/api/applications/{code}` | authentifié | UC04 — détail (404 indifférencié) |
| `POST` | `/api/acces/{code}` | authentifié | UC05 — contrôle + URL de redirection |
| `GET` | `/api/moi` | authentifié | UC06 — profil (projection des claims) |
| `GET` | `/api/config` | authentifié | lecture configuration d'affichage |
| `GET` `POST` `PUT` `DELETE` | `/api/admin/applications[/{code}]` | `ADMIN_PORTAIL` | UC07 |
| `GET` `PUT` | `/api/admin/categories` | `ADMIN_PORTAIL` | UC08 |
| `GET` `PUT` | `/api/admin/domaines-autorises` | `ADMIN_PORTAIL` | support RG08 |
| `GET` `POST` | `/api/admin/applications/{code}/politiques` | `ADMIN_PORTAIL` | UC09 |
| `POST` | `/api/admin/politiques/{id}/approbation` \| `/rejet` | `ADMIN_PORTAIL` | UC09 — « quatre yeux » |
| `PUT` | `/api/admin/config/{cle}` | `ADMIN_PORTAIL` | UC10 |
| `GET` | `/api/admin/audit` | `AUDITEUR_PORTAIL` ou `ADMIN_PORTAIL` | UC11 — lecture seule, paginée |
| `GET` | `/actuator/health`, `/swagger-ui.html`, `/v3/api-docs` | public | exploitation / doc |

Erreurs : format **RFC 7807** (`ProblemDetail`). Messages neutres — le motif réel
(`MotifRefus`, anomalie de configuration) part dans les journaux, jamais au client.
`403` accès refusé · `404` introuvable/interdit (indifférencié) · `409` conflit ou application
indisponible · `422` validation métier / URL hors liste blanche · `400` format invalide.

## 3. Sécurité (couche API)

- **OAuth2 Resource Server** : valide le JWT Keycloak (signature via JWKS, `iss`, `aud`, `exp`).
  `issuer-uri` = `…/realms/ministere`.
- **`STATELESS`** : aucune session côté API. La session navigateur et la protection **CSRF**
  sont au BFF (étape 6b) ; l'API ne reçoit que des jetons Bearer relayés.
- **RBAC** : `realm_access.roles` → autorités `ROLE_*` (`ConvertisseurRolesRealm`) ;
  `@EnableMethodSecurity` + règles par chemin dans `SecurityConfig`.
- **Contrôle d'accès serveur** systématique (`ServiceControleAcces`) pour le catalogue, le
  détail et l'accès — jamais dérivé d'un état client.
- **Anti open-redirect** (`ValidateurUrlCible` + table `domaine_autorise`) : URL cible en
  `https` **et** domaine en liste blanche, vérifié à la configuration **et** avant chaque
  redirection.
- **Audit append-only** (`ServiceAudit`, transaction `REQUIRES_NEW`) : un échec fonctionnel
  n'annule pas la trace ; export SIEM via le logger `AUDIT.SIEM`.
- **En-têtes** : `frame-options: DENY`, `X-Content-Type-Options: nosniff` ; `server.error`
  masque message et stacktrace.
- **Double validation** des politiques sur `Application.sensible` (`ServicePolitiqueAcces`) ;
  le demandeur ne peut pas approuver.

## 4. Configuration (variables d'environnement)

| Variable | Défaut | Rôle |
|---|---|---|
| `PORTAIL_DB_URL` | `jdbc:mysql://localhost:3306/portail_db?...` | Datasource applicative |
| `PORTAIL_DB_USER` / `PORTAIL_DB_PASSWORD` | `portail_app` / — | Compte applicatif (CRUD) |
| `PORTAIL_DB_MIGRATION_URL` / `_USER` / `_PASSWORD` | `…/portail_db` / `portail_migration` / — | Compte Flyway |
| `PORTAIL_OIDC_ISSUER_URI` | `http://localhost:8081/realms/ministere` | Émetteur des jetons |
| `PORTAIL_API_PORT` | `8082` | Port HTTP |

Secrets hors dépôt (`.gitignore` couvre `application-local.yml`, `.env*`). `ddl-auto: validate` :
Hibernate ne modifie jamais le schéma ; **Flyway** en est la seule source.

## 5. Construire et lancer

**Prérequis** : JDK 17+ (présent : `C:\Program Files\Java\jdk-17`), **Maven 3.9+**.
`winget`/`msstore` étant indisponible sur le poste, installer Maven par l'une de ces voies :

- décompresser `apache-maven-3.9.9-bin.zip` (archive.apache.org) et ajouter son `bin` au `PATH` ;
- ou ouvrir le dossier `backend/` dans **IntelliJ IDEA** / **VS Code (Extension Pack for Java)**
  qui embarquent Maven et importent le `pom.xml` directement.

```bash
# à la racine backend/
export JAVA_HOME="/c/Program Files/Java/jdk-17"

mvn test                     # compile + tests unitaires (6/6 au vert)
mvn spring-boot:run -pl portail-api

# la base doit être accessible ; au démarrage, Flyway applique V1 puis V2
```

**Base de données** : la base `portail_db` créée à la main dans Workbench (étape 5) doit être
**supprimée** puis laissée à Flyway, OU conservée en activant
`spring.flyway.baseline-on-migrate=true` + `baseline-version=1`. Le schéma géré par Flyway
utilise `BIGINT` signé et des colonnes `VARCHAR` + `CHECK` (au lieu d'`ENUM`) pour rester
aligné avec la validation Hibernate ; `infra/db/portail_db.sql` a été mis à jour à l'identique.

Vérification rapide une fois lancé :

```bash
curl -s http://localhost:8082/actuator/health          # {"status":"UP"}
curl -s http://localhost:8082/api/catalogue            # 401 (jeton requis)
```

## 6. Tests

`ServiceControleAccesTest` (JUnit 5 + Mockito) couvre l'algorithme d'autorisation : archivage,
masquage, absence de politique, rôle requis, priorité du `REFUSER`, blocage par statut.
`mvn test` → **Tests run: 6, Failures: 0, Errors: 0**.

À compléter (étape 6b / durcissement) : tests `@WebMvcTest` par contrôleur avec
`spring-security-test` (jetons simulés), test d'intégration `@SpringBootTest` +
Testcontainers MySQL + Keycloak.

## 7. Module `portail-bff` (passerelle / BFF)

`backend/portail-bff/` — Spring Cloud Gateway (WebFlux), pile réactive. Port **8080**.
Point d'entrée unique du navigateur ; ne contient aucune logique métier.

| Fichier | Rôle |
|---|---|
| `PortailBffApplication` | démarrage |
| `config/SecurityConfig` | OAuth2 Login (Authorization Code + PKCE), cookie de session `httpOnly`, CSRF cookie `XSRF-TOKEN` + en-tête `X-XSRF-TOKEN`, en-têtes (CSP `frame-ancestors 'none'`, HSTS, Referrer-Policy, X-Frame-Options DENY), `/bff/logout` → RP-Initiated Logout Keycloak, entrée : navigation HTML → redirection Keycloak / XHR → `401` |
| `web/SessionController` | `GET /bff/session` → `{authentifie, nom, email, roles}` sans jeton, sans redirection |
| `application.yml` | client `keycloak` (`portail-bff`), route `/api/**` → `portail-api` avec **`TokenRelay`** (le BFF détient les jetons et pose l'`Authorization: Bearer`), `RemoveRequestHeader=Cookie` vers l'aval |

Chemins :

- `GET /oauth2/authorization/keycloak` — démarre la connexion
- `GET /login/oauth2/code/keycloak` — rappel OIDC
- `POST /bff/logout` — déconnexion (CSRF requis)
- `GET /bff/session` — état de session (public)
- `/api/**` — relayé vers `portail-api` avec le jeton d'accès

Realm Keycloak ([../infra/keycloak/realm-export.json](../infra/keycloak/realm-export.json)) mis à jour :
rôle `AUDITEUR_PORTAIL`, secret du client `portail-bff`, 3 utilisateurs de test
(`ministre` = AGENT+ADMIN_PORTAIL, `agent1` = AGENT, `auditeur1` = AGENT+AUDITEUR_PORTAIL ;
mot de passe `Portail-Dev-2026!`).

Lancement (ordre) : Keycloak (`docker compose -f infra/docker-compose.yml up -d`) → `portail-api`
(port 8082) → `portail-bff` (port 8080). Puis ouvrir `http://localhost:8080/` (redirige vers
Keycloak), ou `curl http://localhost:8080/bff/session`.

## 8. Reste à faire

| Élément | Étape |
|---|---|
| Réglage `aud` (audience) attendu dans le validateur JWT de `portail-api` | durcissement |
| Session BFF partagée (Spring Session + Redis) pour le multi-instance | durcissement |
| `V3__…` : partitionnement mensuel de `evenement_audit` (rétention) | durcissement |
| Tests `@WebMvcTest` / `@WebFluxTest` + intégration Testcontainers (MySQL + Keycloak) | durcissement |
| Frontend Angular (servi par le BFF en production) | 7 |

## 8. Vérification de cohérence (étape 6a)

- **Classes → code** : les 7 services et 6 entités de l'étape 3 sont implémentés à l'identique.
- **Séquences → code** : S1 (`ServiceCatalogue`+`ServiceControleAcces`), S3/S5 (`ServiceAcces`
  + `ValidateurUrlCible` + `ServiceAudit`), S4 (algorithme dans `ServiceControleAcces`,
  couvert par les tests), S6 (`ServiceAdministrationCatalogue`, `ServicePolitiqueAcces`).
- **Règles de gestion** : RG02 (aucune entité utilisateur), RG03/RG09 (contrôle serveur),
  RG06/RG07/RG08 (`ValidateurUrlCible`), RG10 (`@PreAuthorize` via `SecurityConfig`), RG11
  (code immuable + `ck_application_code_format`), RG12 (`archivee`), RG13/RG14 (`ServiceAudit`
  sur tous les points sensibles), Q2 (`ServicePolitiqueAcces`).
- **Périmètre** : aucun contrôleur, service ou entité ne porte de métier d'application cible ;
  aucune connexion hors `portail_db`.
