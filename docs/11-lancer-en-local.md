# Lancer le portail en local — mode démo (sans Keycloak)

Objectif : **voir l'application fonctionner tout de suite**, sans Docker ni Keycloak.

Le profil Spring **`dev`** remplace Keycloak par un **écran de connexion à code de
démonstration**. Code par défaut : **`demo`** (variable `PORTAIL_DEMO_CODE` pour le changer).
Une fois connecté, la session est celle de **« Ministre (dev) »** (rôles `AGENT`,
`ADMIN_PORTAIL`, `AUDITEUR_PORTAIL`). Sans le cookie de connexion, `/api/**` renvoie 401.
**À n'utiliser qu'en local.**

Ports : Angular **4300** · BFF **8085** (en dev ; 8080 est souvent pris par une autre appli) ·
API **8082** · MySQL **3306**. Le proxy Angular (`proxy.conf.json`) pointe déjà sur 8085.

---

## 1. Réinitialiser la base `portail_db` (une fois, dans MySQL Workbench)

La base créée à la main n'a pas le bon format de colonnes ni l'historique Flyway.
On la vide et on laisse l'API la reconstruire au démarrage.

Coller dans un onglet de requête Workbench (connexion `root` ou `diarra`) et exécuter :

```sql
DROP DATABASE IF EXISTS portail_db;
CREATE DATABASE portail_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Les comptes `portail_app` / `portail_migration` restent valables (déjà créés).
Si besoin de les recréer :

```sql
CREATE USER IF NOT EXISTS 'portail_app'@'%'       IDENTIFIED BY 'MotDePasseApp#2026';
CREATE USER IF NOT EXISTS 'portail_migration'@'%' IDENTIFIED BY 'MotDePasseMig#2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON portail_db.* TO 'portail_app'@'%';
GRANT ALL PRIVILEGES ON portail_db.* TO 'portail_migration'@'%';
FLUSH PRIVILEGES;
```

## 2. Démarrer l'API (terminal 1)

```bash
cd backend
export JAVA_HOME="/c/Program Files/Java/jdk-17"     # Git Bash ; sinon $env:JAVA_HOME en PowerShell
mvn spring-boot:run -pl portail-api "-Dspring-boot.run.profiles=dev"
```

Au démarrage, Flyway crée le schéma (`V1`, `V2`) et charge 2 applications de démonstration
(`V900`). L'API écoute sur **http://localhost:8082**.
Vérifier : `curl http://localhost:8082/actuator/health` → `{"status":"UP"}`.

## 3. Démarrer le BFF (terminal 2)

```bash
cd backend
export JAVA_HOME="/c/Program Files/Java/jdk-17"
mvn spring-boot:run -pl portail-bff "-Dspring-boot.run.profiles=dev"
```

Le BFF écoute sur **http://localhost:8085** (profil dev) et relaie `/api/**` vers l'API.

## 4. Démarrer le frontend (terminal 3)

```bash
cd frontend
npm install     # la première fois seulement
npm start
```

Ouvrir **http://localhost:4300**.

## 5. Ce que vous devez voir

- Page **tableau de bord** avec 2 cartes : *Application de démonstration 1* (Active) et
  *Application de démonstration 2* (Maintenance — bouton « Accéder » désactivé).
- Menu **Administration** : CRUD applications, **workflow des politiques d'accès** (frise
  colorée, double validation sur l'appli « sensible »), catégories, domaines autorisés,
  configuration, **journal d'audit** (les accès et actions s'y ajoutent en temps réel).
- Menu **Profil** : « Ministre (dev) » avec ses 3 rôles.
- Cliquer « Accéder » sur l'appli 1 → redirection vers `https://demo.exemple.gouv/app1/`
  (URL fictive : la page n'existe pas, mais l'événement `ACCES_APPLICATION_AUTORISE`
  apparaît dans le journal d'audit).

## 6. Repasser en mode réel (avec Keycloak)

Lancer sans `-Dspring-boot.run.profiles=dev`. Il faut alors Keycloak (realm `ministere`)
accessible sur `http://localhost:8081` — via Docker
(`docker compose -f infra/docker-compose.yml up -d`) ou Keycloak en `.jar`
(`kc.bat start-dev --import-realm`, en montant `infra/keycloak/realm-export.json`).
Voir [09-backend.md](09-backend.md) §7.
