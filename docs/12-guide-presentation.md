# Guide de présentation — Portail Applicatif du Ministère

But de ce document : t'expliquer **chaque brique et pourquoi elle existe**, en français simple,
pour présenter le projet avec assurance. Tu peux t'en servir comme notes d'orateur.

---

## 1. Le projet en une phrase

> « Le portail est **la porte d'entrée unique** vers toutes les applications du Ministère :
> l'agent se connecte **une seule fois**, voit **les applications auxquelles il a droit**, et
> y accède d'un clic — sans que les applications existantes soient modifiées ni fusionnées. »

**Ce que le portail EST** : une couche d'accès et de présentation.
**Ce que le portail N'EST PAS** : une nouvelle application métier. Il ne gère ni les élèves,
ni les menus, ni les commandes. Il ne fusionne aucune base de données.

## 2. Le problème qu'on résout

Aujourd'hui dans un ministère :

- chaque application a **son propre écran de connexion** → l'agent retape ses identifiants
  partout ;
- **aucune vision centrale** de qui accède à quoi ;
- **pas de journal unifié** des accès (obligation d'audit pour l'État) ;
- **ajouter une application** (RH, Finance…) demande à chaque fois de tout recommencer.

Le portail répond à ces quatre points : **une connexion**, **un catalogue filtré par droits**,
**un journal d'audit**, **une architecture prête à accueillir de nouvelles applications**.

## 3. Le parcours utilisateur, étape par étape (et le « pourquoi »)

| Étape | Ce qui se passe | Pourquoi c'est fait comme ça |
|---|---|---|
| 1. L'agent ouvre le portail | Page d'accueil, bouton « Se connecter » | On ne montre rien sans authentification : le catalogue est personnel |
| 2. Connexion | Redirection vers **Keycloak** (le service d'identité), il saisit ses identifiants + double authentification | On ne réinvente pas la gestion des mots de passe : c'est le métier de Keycloak, éprouvé et sécurisé |
| 3. Retour sur le portail | Message d'accueil, **tableau de bord** avec les applications **autorisées uniquement** | L'agent ne voit pas les applications auxquelles il n'a pas droit (principe du moindre privilège) |
| 4. Il clique « Accéder » | Une **séquence animée** : contrôle des droits → autorisation → ouverture | Le contrôle est refait **côté serveur** à ce moment précis, jamais seulement dans l'écran |
| 5. L'application cible s'ouvre | **Navigation pleine page** (ou nouvel onglet) vers l'URL réelle de l'application | Le portail ne « contient » pas l'application : après le clic, l'agent est **dans EDUSN**, comme s'il y était allé directement |
| 6. Grâce au SSO | Il n'a **pas** à se reconnecter dans l'application cible | C'est tout l'intérêt : une seule authentification pour tout |

## 4. Les acteurs

| Acteur | Qui c'est | Ce qu'il fait |
|---|---|---|
| **Agent authentifié** | Un utilisateur du Ministère (ex. le Ministre) | Consulte le catalogue, accède aux applications |
| **Administrateur du portail** (`ADMIN_PORTAIL`) | Une personne habilitée à gérer le portail | Ajoute/retire des applications, définit qui y a droit, configure |
| **Auditeur** (`AUDITEUR_PORTAIL`) | Personne chargée du contrôle | Consulte le journal d'audit (en lecture seule) |
| **Keycloak** | Le service d'identité (logiciel) | Authentifie les personnes, fournit leurs rôles |
| **Application cible** | EDUSN, Restaurant, plus tard RH… | Reçoit l'utilisateur redirigé |

## 5. L'architecture — chaque brique et son rôle

Schéma mental : **l'accueil du bâtiment (reverse proxy) → le guichet unique (BFF) → le
bureau qui traite les demandes (API) → les archives (base MySQL)**, avec **le portier
central (Keycloak)** qui vérifie les identités.

### 5.1 Frontend — Angular (ce que l'utilisateur voit)

- Une **application web moderne** (SPA : *Single Page Application*) : l'écran ne « recharge »
  jamais, la navigation est fluide.
- **Pourquoi Angular** : cadre robuste, très utilisé dans l'administration, TypeScript
  (langage typé = moins de bugs), maintenable sur la durée.
- **Point clé de sécurité** : le navigateur **ne détient aucun jeton d'accès**. Il ne discute
  qu'avec le BFF, via un simple **cookie de session**.

### 5.2 BFF — *Backend For Frontend* (Spring Cloud Gateway) — LE point à bien expliquer

- C'est un **backend dédié au frontend**, placé entre le navigateur et le reste.
- **Le problème qu'il résout** : si l'application web stockait le jeton d'accès dans le
  navigateur (dans le JavaScript), une faille **XSS** (injection de script) permettrait de le
  **voler** et d'usurper l'utilisateur.
- **La solution BFF** : le jeton reste **côté serveur**, dans le BFF. Le navigateur n'a qu'un
  **cookie `httpOnly`** : un cookie que le JavaScript **ne peut pas lire**. Même en cas de
  faille XSS, il n'y a **rien à voler**.
- Le BFF fait aussi : la connexion à Keycloak, la **déconnexion centralisée**, la protection
  **CSRF**, les en-têtes de sécurité, et il **relaie** les appels vers l'API métier en y
  ajoutant le jeton (« token relay »).
- Analogie : le BFF est **le coffre-fort** ; le navigateur a juste **un ticket** qui prouve
  qu'une session existe.

### 5.3 Portail-API — Spring Boot (le cerveau métier du portail)

- Contient la **logique du portail** : le catalogue, le contrôle d'accès, l'audit,
  l'administration.
- C'est un **« Resource Server »** OAuth2 : à chaque appel, il **vérifie le jeton** reçu
  (signature, émetteur, date d'expiration, destinataire) avant de répondre.
- **Pourquoi séparer BFF et API** : le BFF gère la *session navigateur* (côté humain), l'API
  gère la *logique et les données*. Deux responsabilités, deux composants → plus clair, plus
  testable, et l'API pourra servir d'autres clients plus tard (application mobile, etc.).
- Elle ne se connecte **qu'à sa propre base** `portail_db`. **Jamais** aux bases d'EDUSN ou du
  Restaurant.

### 5.4 Keycloak — le service d'identité (IdP : *Identity Provider*)

- Logiciel **open source** de référence (Red Hat) pour gérer l'authentification.
- **Pourquoi ne pas coder notre propre login** : la gestion des mots de passe, de la double
  authentification, du blocage après échecs, de la fédération d'annuaire… c'est un métier
  entier, plein de pièges de sécurité. Keycloak le fait déjà, mieux.
- Vocabulaire :
  - **Realm** = un espace cloisonné ; ici le realm s'appelle `ministere`.
  - **Client** = une application déclarée dans Keycloak (le portail est un client ; chaque
    future application en sera un aussi).
  - **OIDC** (*OpenID Connect*) = le protocole standard par lequel le portail demande à
    Keycloak « qui est cette personne ? ».
  - **Claim** = une information dans le jeton (nom, e-mail, **rôles**, groupes).
- Keycloak peut se **brancher sur l'annuaire du Ministère** (LDAP / Active Directory) : les
  comptes existent déjà, on ne les recrée pas.

### 5.5 Base de données — MySQL `portail_db`

- **Une base dédiée** au portail, **totalement séparée** de celles d'EDUSN et du Restaurant.
- **Pourquoi séparée** : c'est la contrainte d'indépendance. Chaque application reste
  propriétaire de ses données. On ne fait **jamais** de jointure ni de clé étrangère entre
  `portail_db` et les autres bases.
- **Aucune table « utilisateur »** dans `portail_db` : l'identité vient de Keycloak. On stocke
  seulement le catalogue, les règles d'accès, l'audit et la configuration.
- **Flyway** : les changements de schéma sont **versionnés** (`V1`, `V2`, …) et rejoués
  automatiquement. On sait toujours dans quel état est la base ; on peut la reconstruire à
  l'identique. C'est une exigence de qualité.

### 5.6 Reverse proxy — Nginx (l'accueil du bâtiment)

- Point d'entrée réseau unique. Il **termine le HTTPS** (chiffrement), **redirige** vers le
  bon service, applique les **en-têtes de sécurité** et une **limitation de débit**.
- **Sous-domaines** : `portal.ministere.gouv`, `ecole.ministere.gouv`,
  `restaurant.ministere.gouv`. Un sous-domaine par application → cookies isolés, certificats
  propres, déploiements indépendants.

## 6. Les 6 tables de la base (à connaître pour répondre au jury)

| Table | À quoi elle sert |
|---|---|
| `application` | Le **catalogue** : nom, description, URL, icône, statut, catégorie de chaque application. C'est l'entité générique qui rend le portail évolutif. |
| `categorie_application` | Regrouper les applications (Scolarité, Services, RH…) |
| `politique_acces` | Les **règles** « qui voit / qui peut accéder » à une application |
| `domaine_autorise` | La **liste blanche** des domaines vers lesquels une redirection est permise (sécurité) |
| `evenement_audit` | Le **journal** : chaque connexion, accès, action d'administration. En écriture seule. |
| `configuration_portail` | Les réglages d'affichage (titre, bannière, liens) |

## 7. Le workflow des politiques d'accès (une fonctionnalité qui montre la maturité)

- Une **politique d'accès** dit : « pour voir/ouvrir cette application, il faut le rôle X »
  (ou le groupe X, ou être d'origine X), avec un effet **AUTORISER** ou **REFUSER**.
- **Règle d'or** : un **REFUSER l'emporte toujours** sur un AUTORISER. On l'explique
  clairement, c'est un choix de sécurité (le refus est prioritaire).
- **Applications sensibles** : si une application est marquée « sensible », toute nouvelle
  politique doit être **validée par un second administrateur** (principe des « quatre yeux »).
  Celui qui a créé la demande **ne peut pas l'approuver lui-même**. Ça évite qu'une seule
  personne ouvre en douce l'accès à une application critique.
- L'écran d'administration montre ce cycle avec une **frise animée** :
  Demande → En attente d'un second administrateur → Décision (approbation / rejet).

## 8. La sécurité — les arguments qui convainquent un jury

On a appliqué la **défense en profondeur** : plusieurs barrières, pas une seule.

| Mesure | En clair | Pourquoi |
|---|---|---|
| Pattern **BFF** | Aucun jeton dans le navigateur | Neutralise le vol de jeton par XSS |
| Cookie **`httpOnly` + `Secure` + `SameSite`** | Cookie illisible par le JavaScript, envoyé seulement en HTTPS | Protège la session |
| Protection **CSRF** | Jeton anti-falsification sur les actions | Empêche qu'un site tiers agisse en votre nom |
| **OIDC Authorization Code + PKCE** | Le standard le plus sûr pour se connecter | Empêche l'interception du code d'autorisation |
| **MFA** (double authentification) | Obligatoire pour les administrateurs | Un mot de passe volé ne suffit pas |
| Contrôle d'accès **côté serveur** | Revérifié à chaque appel | « Masquer un bouton n'est pas de la sécurité » |
| **Anti open-redirect** | L'URL cible vient **uniquement** du catalogue + liste blanche de domaines + `https` obligatoire | Empêche de détourner la redirection vers un site malveillant |
| **Journal d'audit append-only** | On peut ajouter, jamais modifier ni supprimer (bloqué par la base elle-même) | Les preuves sont intègres |
| **Séparation des rôles** | Administrateur ≠ Auditeur ; « quatre yeux » sur le sensible | Aucune personne toute-puissante |
| **En-têtes de sécurité** (CSP, HSTS…) | Instructions au navigateur pour se durcir | Réduit la surface d'attaque |
| **Secrets hors du code** | Mots de passe en variables d'environnement / coffre | Rien de sensible dans Git |
| **Cible OWASP ASVS niveau 2** | Référentiel international de vérification | Objectif de conformité mesurable |

Phrase à retenir : *« Chaque contrôle est doublé : au bord du réseau, dans le BFF, dans l'API,
et jusque dans la base de données. »*

## 9. L'évolutivité — ajouter une application demain

Aujourd'hui : EDUSN, Restaurant. Demain : RH, Finance, Santé, Formation…

**Ajouter une application ne demande pas de refaire l'architecture.** Il faut seulement :

1. **Une ligne dans le catalogue** (`application`) : nom, URL, icône, catégorie.
2. **Un client déclaré dans Keycloak** (pour le SSO).
3. **Une ou plusieurs politiques d'accès** (qui y a droit).

C'est possible parce que la table `application` est **générique** : le portail ne connaît pas
« EDUSN » ou « Restaurant » en dur dans son code.

## 10. L'intégration future d'EDUSN et du Restaurant

Pour l'instant on a **construit le portail seul**. Le branchement des vraies applications se
fait **à la fin**. Trois modes possibles selon ce que l'application peut faire :

| Mode | Quand | Effort sur l'application |
|---|---|---|
| Client OIDC natif | L'application peut ajouter une librairie d'authentification | Faible (config, pas de métier touché) |
| SAML | L'application ne parle que SAML | Moyen |
| Reverse proxy + en-têtes | L'application ne peut **pas** être modifiée | Nul (le proxy injecte l'identité) |
| Lien simple | Intégration minimale | Nul (chaque application garde son login) |

**Règle d'accès métier** (dans le cahier des charges) :
`EDUSN → Restaurant` **autorisé** (les profils EDUSN sont des utilisateurs administratifs) ;
`Restaurant → EDUSN` **non autorisé**. Cette règle sera portée par une **politique d'accès**,
pas par du code spécifique.

**Le Super Admin Ministère appartient à EDUSN** : le portail ne le recrée pas, il le
**reconnaît** via son identité (ses rôles dans le jeton).

## 11. Ce qui tourne dans la démo aujourd'hui (pour ne pas être prise au dépourvu)

| Élément | En démo | En vrai |
|---|---|---|
| Frontend Angular | `http://localhost:4300` | servi par le reverse proxy |
| BFF | `:8085`, **profil `dev`** : authentification simulée (utilisateur fictif « Ministre (dev) » avec tous les rôles) | `:8080`, vraie connexion Keycloak |
| API | `:8082` | idem |
| Base | MySQL `portail_db` **réelle**, schéma créé par Flyway, données de démonstration | idem, sans les données de démo |
| Applications du catalogue | 3 applis fictives : *Démo 1* → `gouv.fr`, *Démo 2* → `service-public.fr`, *Démo 3* → en maintenance (accès bloqué, pour montrer le refus) | EDUSN, Restaurant, etc. |
| Keycloak | **non lancé** en démo (profil `dev`) — évite d'installer Docker | realm `ministere`, 3 utilisateurs de test |

À dire si on te pose la question : *« En mode démonstration, l'authentification Keycloak est
simulée pour pouvoir montrer l'application sans installer tout le socle. En production, c'est
une vraie connexion SSO. Tout le reste — le contrôle d'accès, l'audit, le workflow, la base —
fonctionne réellement. »*

## 12. Réponses aux questions pièges du jury

**« Pourquoi ne pas fusionner les trois applications ? »**
> Parce que chaque application a son équipe, son cycle de vie, ses données, ses contraintes.
> Les fusionner créerait un système géant, fragile, impossible à faire évoluer. On construit
> une **couche d'intégration au-dessus**, pas une fusion.

**« Pourquoi pas une architecture microservices complète ? »**
> Avec deux applications existantes, multiplier les services (API Gateway, service discovery,
> bus de messages, Kubernetes…) serait de la complexité gratuite. Portail + BFF + Keycloak +
> reverse proxy est **déjà une architecture d'entreprise**, adaptée au besoin réel.

**« Comment le portail sait-il qui a le droit d'accéder à quoi ? »**
> Les **rôles** de l'utilisateur sont dans le **jeton** émis par Keycloak. Le portail lit ces
> rôles et applique les **politiques d'accès** définies pour chaque application. Le contrôle
> est fait **côté serveur**, à chaque demande.

**« Et si Keycloak tombe en panne ? »**
> Personne ne peut se connecter — c'est volontaire : **pas de mode dégradé** sans
> authentification. En production, Keycloak est déployé en **haute disponibilité** (plusieurs
> instances) et sauvegardé.

**« Masquer un bouton dans l'interface, c'est de la sécurité ? »**
> Non. C'est du confort d'affichage. La vraie sécurité, c'est que **le serveur refuse** la
> demande si l'utilisateur n'a pas le droit — et il le refait à chaque appel.

**« Qu'est-ce qui empêche quelqu'un de saisir une URL pour contourner le portail ? »**
> Le portail ne redirige **jamais** vers une URL fournie par l'utilisateur. La destination
> vient **uniquement du catalogue**, elle doit être en `https` et son domaine doit figurer
> dans une **liste blanche**. Toute anomalie déclenche une alerte.

**« Les applications existantes doivent-elles être modifiées ? »**
> Leur **métier**, non — jamais. Pour bénéficier du vrai SSO, elles devront un jour être
> déclarées comme **clients Keycloak** (une configuration, pas du code métier). En attendant,
> le portail y mène par un lien contrôlé et chaque application garde son login.

## 13. Mini-lexique (à glisser dans la présentation)

| Terme | Définition courte |
|---|---|
| **SSO** | Authentification unique : une connexion pour toutes les applications |
| **IdP** | *Identity Provider*, le service qui gère les identités (ici Keycloak) |
| **OIDC / OAuth 2.0** | Protocoles standards d'authentification / d'autorisation |
| **JWT** | Jeton signé contenant l'identité et les rôles de l'utilisateur |
| **PKCE** | Extension d'OAuth 2.0 qui sécurise l'échange du code de connexion |
| **BFF** | *Backend For Frontend* : backend dédié qui détient les jetons à la place du navigateur |
| **SPA** | *Single Page Application* : application web qui ne recharge jamais la page |
| **XSS** | Injection de script malveillant dans une page web |
| **CSRF** | Falsification de requête : un site tiers agit en votre nom |
| **Cookie `httpOnly`** | Cookie que le JavaScript ne peut pas lire (donc pas volable par XSS) |
| **RBAC** | Contrôle d'accès fondé sur les rôles |
| **Claim** | Information portée par le jeton (nom, rôles, groupes…) |
| **Realm** | Espace cloisonné dans Keycloak |
| **Open redirect** | Faille où une redirection est détournée vers un site malveillant |
| **Audit append-only** | Journal où l'on ajoute, sans jamais pouvoir modifier ni supprimer |
| **Flyway** | Outil de gestion versionnée du schéma de base de données |
| **Reverse proxy** | Serveur d'entrée qui route le trafic et centralise TLS et sécurité |

## 14. Le fil rouge de ta présentation (5 minutes)

1. **Le besoin** : trop d'applications, trop de connexions, pas de vision centrale. (30 s)
2. **La solution** : un portail = une porte d'entrée, sans toucher aux applications. (30 s)
3. **Démo** : connexion → tableau de bord → « Accéder » (séquence animée) → l'application
   s'ouvre. (1 min 30)
4. **Sous le capot** : Angular → BFF (le jeton reste au serveur) → API → Keycloak → base
   dédiée. (1 min)
5. **La sécurité** : défense en profondeur, audit inviolable, double validation. (45 s)
6. **L'évolutivité** : ajouter RH ou Finance = une ligne + un client Keycloak, pas une
   refonte. (30 s)
7. **La suite** : brancher EDUSN et le Restaurant. (15 s)

Phrase de conclusion : *« On ne fusionne pas les applications du Ministère : on construit
au-dessus une plateforme d'accès unique, sécurisée et évolutive. »*
