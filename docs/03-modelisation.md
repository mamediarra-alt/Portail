# Modélisation — Portail Applicatif du Ministère

Statut : **Étape 1 / 8 — Modélisation fonctionnelle** (à valider avant les diagrammes UML).

Ordre de production : **1. Modélisation → 2. Cas d'utilisation → 3. Diagramme de classes →
4. Diagrammes de séquence → 5. Script de base de données → 6. Backend → 7. Frontend →
8. Sécurité transverse.**

Ce document couvre l'étape 1 : périmètre, principe de fonctionnement, acteurs, règles de
gestion, modèle du domaine, glossaire, hypothèses. Les diagrammes PlantUML font l'objet des
étapes suivantes.

---

## 1. Vision

Le **Portail Applicatif du Ministère** est une application **autonome** dont le rôle unique est
d'être le **point d'entrée** vers l'ensemble des applications du Ministère.

Scénario cible :

1. L'utilisateur (par ex. le Ministre) ouvre le portail et s'authentifie **une seule fois**.
2. Il voit, sous forme de catalogue, **les applications auxquelles il a droit** (icône, nom,
   description, statut).
3. Il clique sur une application — par ex. « EDUSN ».
4. Il se retrouve **dans l'application EDUSN complète**, avec toutes ses fonctionnalités,
   **exactement comme s'il s'était rendu directement sur EDUSN**. Le portail ne réaffiche pas,
   n'encapsule pas (pas d'`iframe`), ne limite pas l'application cible.
5. Grâce au SSO, il n'a **pas à se ré-authentifier** dans l'application cible (une fois cette
   application raccordée à l'identité centrale — voir §9).

Le portail est donc une **porte d'entrée**, pas un conteneur : après le clic, l'utilisateur
« est dans EDUSN », plus « dans le portail ».

## 2. Périmètre

### 2.1 Dans le périmètre (ce que le portail fait)

| Domaine | Détail |
|---|---|
| Authentification | Connexion / déconnexion centralisées via Keycloak (OIDC Authorization Code + PKCE), pattern BFF |
| Catalogue | Liste **générique** d'applications : nom, description, URL d'accès, icône, catégorie, statut, ordre d'affichage |
| Tableau de bord | Affichage des applications **filtré selon les droits** de l'utilisateur connecté |
| Accès à une application | Contrôle d'accès de niveau portail, puis **redirection pleine page** vers l'URL configurée de l'application, puis journalisation |
| Administration | Back-office réservé : CRUD des applications, des catégories, des politiques d'accès, configuration du portail |
| Audit | Journalisation des connexions, consultations, accès autorisés/refusés, actions d'administration |
| Profil | Consultation des informations de l'utilisateur connecté (issues du jeton d'identité) |
| Sécurité transverse | Session BFF (cookie `httpOnly`), CSRF, en-têtes de sécurité, liste blanche des URLs cibles, validation des jetons |

### 2.2 Hors périmètre (ce que le portail ne fait jamais)

- Reproduire ou héberger une **fonctionnalité métier** d'une application (élève, classe, menu,
  commande, caisse, stock, paie…).
- Détenir une **base de comptes utilisateurs** ou des mots de passe : l'identité est **déléguée
  à Keycloak**.
- Fusionner, répliquer ou interroger directement les **bases de données** des applications.
- Servir de **proxy applicatif** relayant le trafic métier vers les applications.
- Créer un **Super Admin** parallèle : ce compte appartient à l'application qui en est
  propriétaire ; le portail ne fait que le reconnaître via son identité.

### 2.3 Reporté (intégration des applications réelles)

La **construction du portail** se fait **sans** application réelle raccordée. Les applications
concrètes (EDUSN, Restaurant, puis RH, Finance…) sont **insérées à la fin**, comme :

- une **entrée dans le catalogue** (donnée, pas de code) ;
- un **client Keycloak** déclaré pour permettre le SSO ;
- une ou plusieurs **politiques d'accès**.

Pendant le développement, le catalogue est alimenté par des **applications de démonstration**
(« App Démo 1 », « App Démo 2 ») ; « accéder » signifie alors : redirection vers l'URL de démo
+ événement d'audit.

## 3. Principe de fonctionnement

```
                 ┌───────────────────────────────┐
                 │   Utilisateur (navigateur)    │
                 └───────────────┬───────────────┘
                                 │ 1. HTTPS
                                 ▼
                 ┌───────────────────────────────┐        2. redirection OIDC
                 │   PORTAIL                     │◄──────────────────────────┐
                 │   Angular SPA + BFF Spring    │                           │
                 │   - session cookie httpOnly   │        ┌──────────────────┴───┐
                 │   - catalogue filtré          │        │   Keycloak (IdP)     │
                 │   - contrôle d'accès          │        │   realm « ministere »│
                 │   - audit                     │        └──────────────────────┘
                 └───────────────┬───────────────┘
                                 │ 3. clic « Accéder » → navigation pleine page
                                 ▼
      ┌──────────────────────────────────────────────────────────────┐
      │   Application cible (EDUSN, Restaurant, …) — URL du catalogue │
      │   L'utilisateur y est « en entier », comme en accès direct.  │
      └──────────────────────────────────────────────────────────────┘
```

Points clés :

- Le portail et l'application cible sont sur des **domaines distincts**
  (`portal.…`, `ecole.…`, `restaurant.…`).
- L'accès = **redirection HTTP pleine page** (`window.location` / lien `target`), **jamais**
  une inclusion `iframe`.
- Le BFF sert **uniquement** l'Angular du portail et la terminaison de session ; il **ne relaie
  pas** le trafic métier des applications cibles.

## 4. Acteurs

| Acteur | Type | Description | Cas d'utilisation |
|---|---|---|---|
| **Utilisateur authentifié** | Principal | Toute personne habilitée à se connecter au portail (le Ministre, les agents…). Consulte le catalogue et accède aux applications autorisées. | UC01–UC06 |
| **Administrateur du portail** | Principal | Utilisateur authentifié portant le rôle `PORTAL_ADMIN`. Gère le catalogue, les catégories, les politiques d'accès, la configuration ; consulte l'audit. | UC01–UC11 |
| **Fournisseur d'identité (Keycloak)** | Secondaire (système) | Authentifie l'utilisateur, applique le MFA, fournit le jeton d'identité (claims : rôles, groupes). | UC01, UC02 |
| **Application cible** | Secondaire (système) | Application du Ministère vers laquelle le portail redirige l'utilisateur authentifié. Générique ; les applications réelles sont insérées en fin de projet. | UC05 |

> Acteurs **non retenus en v1** (pour ne pas complexifier) : un « Gestionnaire d'habilitations »
> distinct de l'administrateur — en v1, l'administrateur du portail assume la gestion des
> politiques d'accès. À réintroduire si le volume le justifie.

## 5. Règles de gestion

| # | Règle |
|---|---|
| RG01 | L'accès à toute page du portail (hors page de connexion) exige une authentification réussie via Keycloak (OIDC Authorization Code + PKCE). |
| RG02 | Le portail ne stocke aucun compte ni mot de passe. L'identité et les droits proviennent exclusivement du jeton émis par Keycloak. |
| RG03 | Le catalogue présenté à un utilisateur ne contient que les applications dont une politique d'accès **AUTORISER** correspond à ses rôles/groupes, ou les applications marquées **OUVERT_À_TOUS**. |
| RG04 | Une application au statut **MASQUÉE** n'apparaît jamais dans le catalogue utilisateur (visible uniquement en administration). |
| RG05 | Une application au statut **MAINTENANCE** ou **INDISPONIBLE** est affichée mais son accès est bloqué, avec un message informatif. |
| RG06 | Le clic sur « Accéder » provoque une **navigation pleine page** vers l'`urlAcces` de l'application. Le portail ne réaffiche, n'encapsule (`iframe`) ni ne restreint l'application cible. |
| RG07 | L'URL de redirection provient **exclusivement** du catalogue. Aucune URL fournie par l'utilisateur (paramètre, saisie) n'est utilisée pour rediriger (protection contre l'*open redirect*). |
| RG08 | L'`urlAcces` d'une application doit être en `https://` et appartenir à une **liste blanche de domaines** autorisés, contrôlée à la création/modification et avant chaque redirection. |
| RG09 | Le contrôle d'accès est **vérifié côté serveur** (BFF / Portail-API) à chaque demande d'accès. Le masquage d'une carte dans l'interface n'est pas une mesure de sécurité. |
| RG10 | Seul un utilisateur portant le rôle `PORTAL_ADMIN` accède au back-office d'administration ; le MFA est obligatoire pour ce rôle. |
| RG11 | Le `code` d'une application est unique et **immuable** après création. |
| RG12 | La suppression d'une application est **logique** (archivage), jamais physique, afin de préserver l'intégrité du journal d'audit. |
| RG13 | Toute tentative d'accès à une application (autorisée **ou** refusée) génère un événement d'audit horodaté. |
| RG14 | Les actions d'administration (création, modification, archivage d'application ; modification de politique ou de configuration) génèrent un événement d'audit nominatif. |
| RG15 | La déconnexion du portail déclenche la **déconnexion centralisée** Keycloak (RP-Initiated Logout). |
| RG16 | *(préparé pour l'intégration future)* Une application peut être restreinte à une population donnée via une politique d'accès s'appuyant sur un rôle/groupe ou sur l'**origine** de l'utilisateur, lue dans les claims. C'est ce mécanisme, et non du code spécifique, qui portera la règle « utilisateurs administratifs → service de restauration ». |

## 6. Cas d'utilisation (liste)

Détaillés à l'étape 2 (diagramme global + fiches).

| # | Cas d'utilisation | Acteur principal |
|---|---|---|
| UC01 | S'authentifier au portail (SSO) | Utilisateur authentifié |
| UC02 | Se déconnecter (déconnexion centralisée) | Utilisateur authentifié |
| UC03 | Consulter le tableau de bord (catalogue filtré) | Utilisateur authentifié |
| UC04 | Consulter le détail d'une application | Utilisateur authentifié |
| UC05 | Accéder à une application (contrôle d'accès + redirection) | Utilisateur authentifié |
| UC06 | Consulter son profil | Utilisateur authentifié |
| UC07 | Administrer les applications du catalogue (CRUD) | Administrateur du portail |
| UC08 | Administrer les catégories | Administrateur du portail |
| UC09 | Gérer les politiques d'accès d'une application | Administrateur du portail |
| UC10 | Configurer le portail (titre, bannière, liens) | Administrateur du portail |
| UC11 | Consulter le journal d'audit | Administrateur du portail |

## 7. Modèle du domaine (portail uniquement)

### 7.1 Entités persistées

```
CategorieApplication (1) ────< (0..*) Application (1) ────< (0..*) PolitiqueAcces

Application (1) ────< (0..*) EvenementAudit        [applicationCode, nullable]

ConfigurationPortail   (paramètres clé/valeur, sans relation)
```

| Entité | Attributs | Rôle |
|---|---|---|
| **Application** | `id`, `code` (unique, immuable), `nom`, `description`, `urlAcces`, `urlIcone`, `categorieId` (FK, nullable), `statut` (`ACTIVE`\|`MAINTENANCE`\|`INDISPONIBLE`\|`MASQUEE`), `ordreAffichage`, `ouvrirNouvelOnglet` (booléen), `archivee` (booléen), `dateCreation`, `dateModification` | Entrée générique du catalogue. Cœur de l'évolutivité : ajouter une application = ajouter une ligne. |
| **CategorieApplication** | `id`, `code`, `libelle`, `ordreAffichage` | Regroupement d'applications (ex. « Scolarité », « Services », « RH »). |
| **PolitiqueAcces** | `id`, `applicationId` (FK), `typeRegle` (`ROLE_REQUIS`\|`GROUPE_REQUIS`\|`ORIGINE_REQUISE`\|`OUVERT_A_TOUS`), `valeur` (nom du rôle/groupe/origine ; vide si `OUVERT_A_TOUS`), `effet` (`AUTORISER`\|`REFUSER`), `actif` | Traduit, **au niveau portail**, qui voit et peut accéder à une application. Plusieurs politiques par application, évaluées ensemble. |
| **EvenementAudit** | `id`, `horodatage`, `sujetUtilisateur` (`sub` du jeton), `nomUtilisateur`, `action` (voir §7.3), `applicationCode` (nullable), `resultat` (`SUCCES`\|`ECHEC`), `adresseIp`, `userAgent`, `detail` (texte/JSON) | Journal transversal, en écriture seule. |
| **ConfigurationPortail** | `cle` (PK), `valeur`, `description`, `dateModification` | Paramétrage : titre, sous-titre, bannière, liens utiles, mentions légales. |

### 7.2 Objet non persisté

| Objet valeur | Attributs | Rôle |
|---|---|---|
| **IdentiteUtilisateur** | `sujet`, `nom`, `email`, `roles[]`, `groupes[]`, `origine` | Projection des *claims* du jeton Keycloak, construite à chaque requête. Sert à filtrer le catalogue (RG03) et à autoriser l'accès (RG09). N'est **jamais** stockée. |

### 7.3 Énumérations

- `StatutApplication` : `ACTIVE`, `MAINTENANCE`, `INDISPONIBLE`, `MASQUEE`
- `TypeReglePolitique` : `ROLE_REQUIS`, `GROUPE_REQUIS`, `ORIGINE_REQUISE`, `OUVERT_A_TOUS`
- `EffetPolitique` : `AUTORISER`, `REFUSER`
- `ActionAudit` : `CONNEXION`, `DECONNEXION`, `CONSULTATION_CATALOGUE`,
  `CONSULTATION_APPLICATION`, `ACCES_APPLICATION_AUTORISE`, `ACCES_APPLICATION_REFUSE`,
  `ADMIN_APPLICATION_CREEE`, `ADMIN_APPLICATION_MODIFIEE`, `ADMIN_APPLICATION_ARCHIVEE`,
  `ADMIN_CATEGORIE_MODIFIEE`, `ADMIN_POLITIQUE_MODIFIEE`, `ADMIN_CONFIG_MODIFIEE`,
  `ERREUR`

### 7.4 Évaluation d'une demande d'accès (RG03 + RG09)

1. Construire `IdentiteUtilisateur` à partir du jeton.
2. Charger l'application par `code` ; si `archivee` ou `statut = MASQUEE` → **refus** (404 pour
   l'utilisateur non-admin).
3. Si une `PolitiqueAcces` `actif` avec `effet = REFUSER` correspond à l'identité → **refus**.
4. Sinon, s'il existe une politique `OUVERT_A_TOUS` ou une politique `AUTORISER` correspondante
   → **autorisé**.
5. Sinon → **refus**.
6. Si autorisé et `statut ∈ {MAINTENANCE, INDISPONIBLE}` → **accès bloqué** avec message
   (l'application reste visible).
7. Journaliser le résultat (RG13).

## 8. Glossaire

| Terme | Définition |
|---|---|
| **Portail** | Application autonome, point d'entrée unique vers les applications du Ministère. |
| **Catalogue** | Ensemble des entrées `Application` gérées par le portail. |
| **Application (entrée de catalogue)** | Métadonnées + URL d'une application du Ministère. Ne contient aucun code métier. |
| **Application cible** | Application réelle vers laquelle le portail redirige (EDUSN, Restaurant, …). |
| **BFF** (*Backend For Frontend*) | Backend dédié à l'Angular du portail : termine la session navigateur, détient les jetons, applique les politiques transverses. |
| **SSO** (*Single Sign-On*) | Authentification unique : une connexion vaut pour le portail et les applications raccordées. |
| **SLO** (*Single Logout*) | Déconnexion propagée à toutes les applications de la session. |
| **OIDC** (*OpenID Connect*) | Protocole d'authentification au-dessus d'OAuth 2.0, utilisé entre le portail et Keycloak. |
| **Keycloak** | Logiciel de gestion d'identité (IdP) : comptes, MFA, rôles, fédération d'annuaires. |
| **Realm** | Espace cloisonné dans Keycloak ; ici `ministere`. |
| **Claim** | Information portée par le jeton d'identité (nom, rôles, groupes…). |
| **RBAC** | Contrôle d'accès fondé sur les rôles. |
| **Politique d'accès** | Règle du portail déterminant qui voit et peut accéder à une application. |
| **Open redirect** | Faille permettant de détourner une redirection vers une URL arbitraire ; neutralisée par RG07/RG08. |
| **MFA** | Authentification à plusieurs facteurs (OTP, clé WebAuthn). |
| **PKCE** | Extension d'OAuth 2.0 sécurisant l'échange du code d'autorisation. |

## 9. Hypothèses (à valider)

| # | Hypothèse | Impact si fausse |
|---|---|---|
| H1 | Keycloak est disponible comme IdP du portail (realm `ministere`). | Il faut un autre IdP conforme OIDC, ou une authentification locale au portail (non recommandé, contraire à RG02). |
| H2 | Les utilisateurs (dont le Ministre) existent dans Keycloak ou dans un annuaire fédéré par Keycloak. Le portail ne crée pas de comptes. | Prévoir un import / une fédération d'annuaire avant la mise en service. |
| H3 | Pendant le développement, les entrées du catalogue pointent vers des applications de démonstration ; « accès » = redirection + audit. | Aucun — c'est le mode de travail assumé jusqu'à l'insertion des applications réelles. |
| H4 | v1 monolingue (français), thème unique ; préférences utilisateur hors périmètre. | Ajouter une entité `PreferenceUtilisateur` et l'internationalisation. |
| H5 | Le statut de disponibilité est saisi **manuellement** par l'administrateur. | Ajouter une sonde de disponibilité (health-check) et une entité de suivi. |
| H6 | Un seul rôle d'administration (`PORTAL_ADMIN`) en v1. | Introduire des rôles d'administration séparés (catalogue / politiques / audit). |
| H7 | Le SSO complet (sans second login) suppose que l'application cible devienne cliente de Keycloak. Tant que ce n'est pas fait, l'application cible peut redemander son propre login. | C'est le comportement attendu jusqu'à l'étape d'intégration ; à expliciter au commanditaire. |

## 10. Décisions d'architecture rappelées (déjà actées)

| Sujet | Décision |
|---|---|
| Frontend portail | Angular (SPA) |
| Backend portail | Spring Boot — BFF (Spring Cloud Gateway) + Portail-API (Resource Server OAuth2) |
| Identité / SSO | Keycloak, realm `ministere`, pattern BFF, OIDC Authorization Code + PKCE |
| Session navigateur | Cookie `httpOnly` + `Secure` + `SameSite` ; aucun jeton exposé au JavaScript ; CSRF double-submit |
| Base de données | **MySQL dédiée au portail** (schéma `portail_db`), conçue et administrée avec **MySQL Workbench** (modèle EER + exécution du script DDL) ; strictement séparée des bases des applications |
| Connexion applicative | Spring Boot ↔ MySQL via **JDBC** (`spring.datasource` : URL `jdbc:mysql://…/portail_db`, utilisateur dédié à privilèges limités, mot de passe hors du code) ; migrations versionnées (Flyway) ; MySQL Workbench sert d'outil de conception, d'exécution du script et d'inspection, pas de dépendance d'exécution |
| Réseau | Reverse proxy + **sous-domaines** distincts par application |
| Administration | Back-office d'administration inclus dès la v1 |
| Accès au catalogue | Authentification obligatoire ; catalogue filtré par droits |
| Cible sécurité | OWASP ASVS niveau 2 minimum, contrôles niveau 3 sur la session et l'audit |
| Intégration des applications réelles | **Reportée en fin de projet** : entrée de catalogue + client Keycloak + politiques d'accès |

## 11. Cohérence — points de contrôle pour les étapes suivantes

- Chaque cas d'utilisation (§6) doit être rattaché à au moins un acteur (§4) et à une ou
  plusieurs règles de gestion (§5).
- Chaque classe du diagramme de classes (étape 3) doit correspondre à une entité de §7.
- Chaque diagramme de séquence (étape 4) doit n'impliquer que des acteurs de §4 et des classes
  de §7.
- Le script de base de données (étape 5) doit être la traduction directe de §7, sans table
  supplémentaire non justifiée.
- Aucune classe, table ou composant ne doit porter de logique métier d'une application cible.
