# Diagrammes de séquence — Portail Applicatif du Ministère

Statut : **Étape 4 / 8 — Diagrammes de séquence**.

S'appuie sur : [05-cas-utilisation.md](05-cas-utilisation.md) (UC01–UC11),
[06-diagramme-classes.md](06-diagramme-classes.md) (entités et services).

Sept séquences :

| # | Séquence | Cas d'utilisation |
|---|---|---|
| S0 | Authentification OIDC + établissement de session BFF | UC01 |
| S1 | Arrivée sur le portail — chargement du tableau de bord | UC03 |
| S2 | Consultation du détail d'une application | UC04 |
| S3 | Accès à une application — scénario nominal | UC05 |
| S4 | Contrôler l'autorisation d'accès — zoom sur l'algorithme | UC05, UC03, transverse |
| S5 | Refus d'accès | UC05 (E1–E3) |
| S6 | Administration — création d'application + workflow de politique | UC07, UC09 |

**Participants récurrents.**

| Participant | Rôle |
|---|---|
| `Navigateur` | Angular SPA (aucun jeton stocké) |
| `BFF` | Spring Cloud Gateway : session, cookie, CSRF, relais du jeton d'accès |
| `PortailAPI` | Spring Boot Resource Server : valide le JWT, héberge les services |
| `Keycloak` | Fournisseur d'identité (realm `ministere`) |
| `BD` | Base MySQL `portail_db` |
| `ServiceAudit` | Journalisation append-only + export SIEM |
| `SIEM` | Puits de journaux de l'État (réception asynchrone) |
| `ApplicationCible` | EDUSN, Restaurant, … (intégrées en fin de projet) |

---

## S0 — Authentification OIDC + établissement de session BFF (UC01)

**Objectif.** Établir une session authentifiée sans jamais exposer de jeton au navigateur.

**Description.** Flux OpenID Connect **Authorization Code + PKCE**. Le BFF génère `state`,
`nonce` et le couple PKCE, échange le `code` par canal arrière, valide l'`id_token`, crée une
session serveur et pose un cookie `__Host-` opaque.

**Justification.** PKCE + `state` + `nonce` couvrent l'interception de code, le CSRF de
connexion et le rejeu. Le stockage serveur des jetons neutralise le vol par XSS.

```plantuml
@startuml s0-authentification
title S0 — Authentification OIDC + session BFF (UC01)
autonumber
skinparam shadowing false
actor Utilisateur as U
participant Navigateur
participant BFF
participant Keycloak
participant "Annuaire de l'État" as LDAP
participant ServiceAudit
participant SIEM

U -> Navigateur : ouvre https://portal.ministere.gouv/dashboard
Navigateur -> BFF : GET /dashboard  (sans cookie de session)
BFF -> BFF : session absente ; génère state, nonce,\ncode_verifier / code_challenge (PKCE)
BFF --> Navigateur : 302  ->  Keycloak /authorize\n(response_type=code, code_challenge, state, nonce)
Navigateur -> Keycloak : GET /authorize
Keycloak --> Navigateur : page de connexion
U -> Navigateur : identifiants + second facteur (MFA)
Navigateur -> Keycloak : POST identifiants + OTP / WebAuthn
Keycloak -> LDAP : vérifie le compte (fédération)
LDAP --> Keycloak : compte valide
Keycloak --> Navigateur : 302  ->  BFF /login/oauth2/code/keycloak?code=...&state=...
Navigateur -> BFF : GET /login/oauth2/code/keycloak?code&state
BFF -> BFF : vérifie state
BFF -> Keycloak : POST /token  (code + code_verifier)  [canal arrière]
Keycloak --> BFF : id_token + access_token + refresh_token
BFF -> BFF : valide id_token (JWKS, iss, aud, exp, nonce)
BFF -> BFF : crée la session serveur ; conserve les jetons côté serveur ;\npose le cookie __Host-SESSION (HttpOnly, Secure, SameSite=Lax)
BFF -> ServiceAudit : journaliser(CONNEXION, SUCCES)
ServiceAudit --> SIEM : export (asynchrone)
BFF --> Navigateur : 302  ->  /dashboard  (Set-Cookie)

alt id_token invalide (E3)
  BFF -> ServiceAudit : journaliser(ERREUR, ECHEC)
  ServiceAudit --> SIEM : alerte
  BFF --> Navigateur : 401  (aucune session créée)
else Keycloak indisponible (E4)
  BFF --> Navigateur : page d'erreur maîtrisée (pas de mode dégradé)
end
@enduml
```

**Vérification.** Aucun jeton transite vers `Navigateur`. `state` et `nonce` vérifiés.
Journalisation systématique (RG13). Couvre A1 (SSO déjà actif), A2 (enrôlement MFA par
Keycloak), E1/E2 (gérés par Keycloak), E3, E4.

---

## S1 — Arrivée sur le portail : chargement du tableau de bord (UC03)

**Objectif.** Renvoyer **uniquement** les applications visibles par l'utilisateur, triées.

**Description.** Le BFF relaie l'appel au `PortailAPI` avec le jeton d'accès. `ServiceCatalogue`
charge les applications candidates puis délègue à `ServiceControleAcces` pour chacune.

**Justification.** Le filtrage est **serveur** (RG03, RG09) ; la réponse est `no-store` car
personnalisée.

```plantuml
@startuml s1-dashboard
title S1 — Chargement du tableau de bord (UC03)
autonumber
skinparam shadowing false
participant Navigateur
participant BFF
participant PortailAPI
participant ServiceCatalogue
participant ServiceControleAcces
participant BD
participant ServiceAudit

Navigateur -> BFF : GET /api/catalogue  (cookie de session)
BFF -> BFF : session valide ; récupère le jeton d'accès (stockage serveur)
BFF -> PortailAPI : GET /catalogue  (Authorization: Bearer <access_token>)
PortailAPI -> PortailAPI : valide le JWT (signature, iss, aud, exp)
PortailAPI -> ServiceCatalogue : listerApplicationsVisibles(identite)
ServiceCatalogue -> BD : SELECT application\nWHERE archivee = false AND statut <> 'MASQUEE'
BD --> ServiceCatalogue : applications candidates
loop pour chaque application
  ServiceCatalogue -> ServiceControleAcces : evaluer(identite, application)
  ServiceControleAcces -> BD : SELECT politique_acces\nWHERE application_id = ? AND actif = true
  BD --> ServiceControleAcces : politiques
  ServiceControleAcces --> ServiceCatalogue : DecisionAcces
end
ServiceCatalogue --> PortailAPI : liste filtrée, triée (catégorie, ordreAffichage)
PortailAPI -> ServiceAudit : journaliser(CONSULTATION_CATALOGUE, SUCCES)  [échantillonné]
PortailAPI --> BFF : 200  application/json
BFF --> Navigateur : 200  (Cache-Control: no-store)
Navigateur -> Navigateur : rend les cartes ;\nbouton « Accéder » désactivé si statut MAINTENANCE / INDISPONIBLE

alt aucune application autorisée (A1)
  Navigateur -> Navigateur : message « Aucune application disponible pour votre profil »
end
@enduml
```

**Vérification.** `ServiceControleAcces` réutilisé (cohérent avec S4). Applications `MASQUEE`
jamais renvoyées (RG04). Aucun cache d'autorisation (E1).

---

## S2 — Consultation du détail d'une application (UC04)

**Objectif.** Afficher la fiche d'une application, avec **revérification** de visibilité.

**Description.** Réponse **404 indifférenciée** si l'application est inconnue, archivée,
`MASQUEE` ou non autorisée (pas d'énumération).

```plantuml
@startuml s2-detail
title S2 — Consultation du détail d'une application (UC04)
autonumber
skinparam shadowing false
participant Navigateur
participant BFF
participant PortailAPI
participant ServiceCatalogue
participant ServiceControleAcces
participant BD
participant ServiceAudit

Navigateur -> BFF : GET /api/applications/{code}  (cookie)
BFF -> PortailAPI : GET /applications/{code}  (Bearer)
PortailAPI -> ServiceCatalogue : obtenirDetail(code, identite)
ServiceCatalogue -> BD : SELECT application WHERE code = ?
BD --> ServiceCatalogue : application (ou vide)

alt introuvable / archivee / statut = MASQUEE
  ServiceCatalogue --> PortailAPI : NonTrouvee
  PortailAPI --> BFF : 404
  BFF --> Navigateur : 404 (message générique)
else application présente
  ServiceCatalogue -> ServiceControleAcces : evaluer(identite, application)
  ServiceControleAcces -> BD : SELECT politique_acces WHERE application_id = ? AND actif = true
  BD --> ServiceControleAcces : politiques
  ServiceControleAcces --> ServiceCatalogue : DecisionAcces
  alt DecisionAcces = REFUSE
    ServiceCatalogue --> PortailAPI : NonTrouvee (404 indifférencié)
    PortailAPI -> ServiceAudit : journaliser(CONSULTATION_APPLICATION, ECHEC)
    PortailAPI --> BFF : 404
    BFF --> Navigateur : 404
  else DecisionAcces = AUTORISE
    ServiceCatalogue --> PortailAPI : métadonnées (sans urlAcces)
    PortailAPI -> ServiceAudit : journaliser(CONSULTATION_APPLICATION, SUCCES)
    PortailAPI --> BFF : 200  fiche
    BFF --> Navigateur : 200
  end
end
@enduml
```

**Vérification.** 404 identique pour « inexistante » et « interdite » (UC04/E1). `urlAcces` non
exposée à ce stade.

---

## S3 — Accès à une application : scénario nominal (UC05)

**Objectif.** Contrôler l'accès, valider l'URL cible, journaliser, puis rediriger en pleine
page.

**Description.** Requête **mutable** → jeton CSRF exigé. La destination provient **uniquement**
du catalogue et est revalidée contre la liste blanche (`ValidateurUrlCible` +
`DomaineAutorise`).

```plantuml
@startuml s3-acces-nominal
title S3 — Accès à une application, nominal (UC05)
autonumber
skinparam shadowing false
participant Navigateur
participant BFF
participant PortailAPI
participant ServiceAcces
participant ServiceControleAcces
participant ValidateurUrlCible
participant BD
participant ServiceAudit
participant SIEM
participant ApplicationCible

Navigateur -> BFF : POST /api/acces/{code}\n(cookie + en-tête X-XSRF-TOKEN)
BFF -> BFF : vérifie le jeton CSRF (double-submit)
BFF -> PortailAPI : POST /acces/{code}  (Bearer)
PortailAPI -> ServiceAcces : preparerRedirection(code, identite)
ServiceAcces -> BD : SELECT application WHERE code = ?
BD --> ServiceAcces : application (statut = ACTIVE, non archivée)
ServiceAcces -> ServiceControleAcces : evaluer(identite, application)
ServiceControleAcces -> BD : SELECT politique_acces WHERE application_id = ? AND actif = true
BD --> ServiceControleAcces : politiques
ServiceControleAcces --> ServiceAcces : DecisionAcces(autorise = true)
ServiceAcces -> ValidateurUrlCible : estAutorisee(application.urlAcces)
ValidateurUrlCible -> BD : SELECT domaine_autorise WHERE actif = true
BD --> ValidateurUrlCible : domaines autorisés
ValidateurUrlCible --> ServiceAcces : true  (https + domaine en liste blanche)
ServiceAcces -> ServiceAudit : journaliser(ACCES_APPLICATION_AUTORISE, SUCCES)
ServiceAudit --> SIEM : export (asynchrone)
ServiceAcces --> PortailAPI : UrlRedirection(url canonique, ouvrirNouvelOnglet)
PortailAPI --> BFF : 200 { url, nouvelOnglet }
BFF --> Navigateur : 200 { url }
Navigateur -> Navigateur : navigation pleine page\n(window.location.assign, ou window.open + rel=noopener)
Navigateur -> ApplicationCible : GET url
alt application cliente de Keycloak
  ApplicationCible -> ApplicationCible : session SSO active (pas de nouveau login)
else application non encore intégrée
  ApplicationCible --> Navigateur : écran de connexion propre à l'application
end
ApplicationCible --> Navigateur : page d'accueil de l'application (complète)
@enduml
```

**Vérification.** Anti *open redirect* (RG07/RG08) : `ValidateurUrlCible` appelé avant toute
redirection. Aucune `iframe`. Journalisation avant la réponse. Couvre A1/A2/A3.

---

## S4 — Contrôler l'autorisation d'accès : zoom sur l'algorithme (transverse)

**Objectif.** Détailler la règle d'évaluation, réutilisée par S1, S2, S3, S5 et UC09.

**Description.** Ordre : archivage → `MASQUEE` → politiques `REFUSER` (priorité) → politiques
`AUTORISER` / `OUVERT_A_TOUS` → statut de disponibilité. Seules les politiques
`ACTIVE_DIRECTE` ou `APPROUVEE` sont prises en compte (workflow Q2).

```plantuml
@startuml s4-controle-acces
title S4 — Contrôler l'autorisation d'accès (algorithme)
autonumber
skinparam shadowing false
participant "Appelant\n(ServiceCatalogue / ServiceAcces)" as Appelant
participant ServiceControleAcces
participant BD

Appelant -> ServiceControleAcces : evaluer(identite, application)

alt application.archivee = true
  ServiceControleAcces --> Appelant : DecisionAcces(false, APPLICATION_ARCHIVEE)
else application.statut = MASQUEE
  ServiceControleAcces --> Appelant : DecisionAcces(false, APPLICATION_MASQUEE)
else
  ServiceControleAcces -> BD : SELECT politique_acces\nWHERE application_id = ? AND actif = true\nAND statutValidation IN ('ACTIVE_DIRECTE','APPROUVEE')
  BD --> ServiceControleAcces : politiques

  loop politiques où effet = REFUSER
    alt politique.correspondA(identite)
      ServiceControleAcces --> Appelant : DecisionAcces(false, POLITIQUE_REFUS)
    end
  end

  ServiceControleAcces -> ServiceControleAcces : autorise = false
  loop politiques où effet = AUTORISER ou typeRegle = OUVERT_A_TOUS
    alt politique.correspondA(identite)
      ServiceControleAcces -> ServiceControleAcces : autorise = true
    end
  end

  alt autorise = false
    ServiceControleAcces --> Appelant : DecisionAcces(false, AUCUNE_POLITIQUE_AUTORISANTE)
  else application.statut ∈ {MAINTENANCE, INDISPONIBLE}
    ServiceControleAcces --> Appelant : DecisionAcces(true, applicationBloquee = true,\nmotif = APPLICATION_INDISPONIBLE)
  else
    ServiceControleAcces --> Appelant : DecisionAcces(true)
  end
end
@enduml
```

**Vérification.** `REFUSER` prime (RG cohérente avec UC09). `MotifRefus` aligné avec le
diagramme de classes (§2 de l'étape 3). Prend en compte le workflow de validation (Q2).

---

## S5 — Refus d'accès (UC05, exceptions E1–E3)

**Objectif.** Refuser proprement : message **neutre** à l'utilisateur, motif réel **journalisé
seulement**.

```plantuml
@startuml s5-refus
title S5 — Refus d'accès (UC05 / E1–E3)
autonumber
skinparam shadowing false
participant Navigateur
participant BFF
participant PortailAPI
participant ServiceAcces
participant ServiceControleAcces
participant ValidateurUrlCible
participant BD
participant ServiceAudit
participant SIEM

Navigateur -> BFF : POST /api/acces/{code}  (cookie + CSRF)
BFF -> PortailAPI : POST /acces/{code}  (Bearer)
PortailAPI -> ServiceAcces : preparerRedirection(code, identite)
ServiceAcces -> BD : SELECT application WHERE code = ?
BD --> ServiceAcces : application

alt E1 — utilisateur non autorisé
  ServiceAcces -> ServiceControleAcces : evaluer(identite, application)
  ServiceControleAcces -> BD : SELECT politique_acces ...
  ServiceControleAcces --> ServiceAcces : DecisionAcces(false, POLITIQUE_REFUS\nou AUCUNE_POLITIQUE_AUTORISANTE)
  ServiceAcces -> ServiceAudit : journaliser(ACCES_APPLICATION_REFUSE, ECHEC, motif interne)
  ServiceAudit --> SIEM : export
  ServiceAcces --> PortailAPI : AccesRefuse
  PortailAPI --> BFF : 403  { message : « Accès non autorisé » }
  BFF --> Navigateur : 403  (aucun motif détaillé)
else E2 — application en MAINTENANCE / INDISPONIBLE
  ServiceAcces -> ServiceControleAcces : evaluer(identite, application)
  ServiceControleAcces --> ServiceAcces : DecisionAcces(true, applicationBloquee = true)
  ServiceAcces -> ServiceAudit : journaliser(ACCES_APPLICATION_REFUSE, ECHEC, motif = statut)
  ServiceAcces --> PortailAPI : ApplicationIndisponible
  PortailAPI --> BFF : 409  { message : « Application momentanément indisponible » }
  BFF --> Navigateur : 409
else E3 — urlAcces hors liste blanche ou non-HTTPS
  ServiceAcces -> ServiceControleAcces : evaluer(identite, application)
  ServiceControleAcces --> ServiceAcces : DecisionAcces(true)
  ServiceAcces -> ValidateurUrlCible : estAutorisee(application.urlAcces)
  ValidateurUrlCible -> BD : SELECT domaine_autorise WHERE actif = true
  ValidateurUrlCible --> ServiceAcces : false
  ServiceAcces -> ServiceAudit : journaliser(ERREUR, ECHEC, « domaine non autorisé »)
  ServiceAudit --> SIEM : ALERTE (anomalie de configuration)
  ServiceAcces --> PortailAPI : ConfigurationInvalide
  PortailAPI --> BFF : 422  { message : « Accès indisponible » }
  BFF --> Navigateur : 422
end
Navigateur -> Navigateur : affiche un message neutre à l'utilisateur
@enduml
```

**Vérification.** Le `MotifRefus` n'est jamais renvoyé au client (UC05/E1). E3 déclenche une
**alerte SIEM** (anomalie de configuration, pas simple refus métier).

---

## S6 — Administration : création d'application + workflow de politique (UC07, UC09)

**Objectif.** Montrer les contrôles d'administration : RBAC `PORTAL_ADMIN`, *step-up*,
validation d'URL, audit avant/après, et la **double validation** des politiques sur application
sensible (Q2).

```plantuml
@startuml s6-administration
title S6 — Administration : création d'application + workflow de politique (UC07, UC09)
autonumber
skinparam shadowing false
actor "Administrateur A" as A1
actor "Administrateur B" as A2
participant Navigateur
participant BFF
participant PortailAPI
participant ServiceAdministrationCatalogue as SAC
participant ValidateurUrlCible
participant ServicePolitiqueAcces as SPA
participant BD
participant ServiceAudit

== Partie A — création d'une application (UC07) ==
A1 -> Navigateur : formulaire « Nouvelle application »
Navigateur -> BFF : POST /api/admin/applications  (cookie + CSRF)
BFF -> BFF : session valide ; CSRF ok ; vérifie l'ancienneté de l'authentification
alt authentification trop ancienne (opération critique)
  BFF --> Navigateur : 401  step-up  ->  ré-authentification Keycloak
end
BFF -> PortailAPI : POST /admin/applications  (Bearer)
PortailAPI -> PortailAPI : @PreAuthorize hasRole('PORTAL_ADMIN')
PortailAPI -> SAC : creerApplication(commande, identite)
SAC -> BD : SELECT application WHERE code = ?  (unicité)
SAC -> ValidateurUrlCible : estAutorisee(commande.urlAcces)
ValidateurUrlCible -> BD : SELECT domaine_autorise WHERE actif = true
ValidateurUrlCible --> SAC : true / false
alt URL non conforme
  SAC --> PortailAPI : ValidationEchouee
  PortailAPI --> BFF : 422  (message précis, aucune écriture)
else valide
  SAC -> BD : INSERT application (archivee = false, creePar = identite.sujet)
  SAC -> ServiceAudit : journaliser(ADMIN_APPLICATION_CREEE, diff avant/après)
  SAC --> PortailAPI : application créée
  PortailAPI --> BFF : 201
  BFF --> Navigateur : 201
end

== Partie B — ajout d'une politique sur application sensible (UC09) ==
A1 -> Navigateur : ajoute une politique d'accès
Navigateur -> BFF : POST /api/admin/applications/{code}/politiques  (CSRF)
BFF -> PortailAPI : POST /admin/applications/{code}/politiques  (Bearer)
PortailAPI -> SPA : ajouterPolitique(code, commande, identite=A)
SPA -> BD : SELECT application WHERE code = ?
alt application.sensible = true
  SPA -> BD : INSERT politique_acces\n(statutValidation = EN_ATTENTE_APPROBATION, actif = false, demandeePar = A)
  SPA -> ServiceAudit : journaliser(ADMIN_POLITIQUE_MODIFIEE, « demande »)
  SPA --> PortailAPI : en attente d'approbation
  PortailAPI --> BFF : 202  Accepted
  BFF --> Navigateur : 202  « Politique en attente d'un second administrateur »
else application non sensible
  SPA -> BD : INSERT politique_acces (statutValidation = ACTIVE_DIRECTE, actif = true)
  SPA -> ServiceAudit : journaliser(ADMIN_POLITIQUE_MODIFIEE)
  SPA --> PortailAPI : active
  PortailAPI --> BFF : 201
  BFF --> Navigateur : 201
end

== Partie C — approbation par un second administrateur ==
A2 -> Navigateur : ouvre « Politiques en attente » ; approuve
Navigateur -> BFF : POST /api/admin/politiques/{id}/approbation  (CSRF)
BFF -> PortailAPI : POST /admin/politiques/{id}/approbation  (Bearer)
PortailAPI -> SPA : approuverPolitique(id, identite=B)
SPA -> BD : SELECT politique_acces WHERE id = ?
alt B.sujet = politique.demandeePar
  SPA --> PortailAPI : Conflit (le demandeur ne peut pas approuver)
  PortailAPI --> BFF : 409
  BFF --> Navigateur : 409  « Un autre administrateur doit approuver »
else
  SPA -> BD : UPDATE politique_acces\nSET statutValidation = APPROUVEE, actif = true,\napprouveePar = B, dateDecision = now()
  SPA -> ServiceAudit : journaliser(ADMIN_POLITIQUE_APPROUVEE)
  SPA --> PortailAPI : approuvée
  PortailAPI --> BFF : 200
  BFF --> Navigateur : 200  (effet immédiat sur le filtrage du catalogue)
end
@enduml
```

**Vérification.** RBAC serveur (`@PreAuthorize`), *step-up* pour opérations critiques (Q4),
validation d'URL réutilisée (cohérent avec S3), audit avec valeurs avant/après (RG14),
séparation demandeur / approbateur (Q2). `ActionAudit.ADMIN_POLITIQUE_APPROUVEE` cohérent avec
le diagramme de classes.

---

## Vérification de cohérence globale (étape 4)

- **Séquences → cas d'utilisation** : S0↔UC01, S1↔UC03, S2↔UC04, S3/S4/S5↔UC05, S6↔UC07+UC09.
  Les 7 séquences de la matrice §3.3 de l'étape 2 sont produites.
- **Séquences → classes** : seuls les services et entités de l'étape 3 apparaissent
  (`ServiceCatalogue`, `ServiceControleAcces`, `ServiceAcces`, `ValidateurUrlCible`,
  `ServicePolitiqueAcces`, `ServiceAdministrationCatalogue`, `ServiceAudit` ; entités via `BD`).
- **Séquences → règles de gestion** : RG01/RG02 (S0), RG03/RG04/RG09 (S1/S2/S4), RG05/RG06/
  RG07/RG08/RG13 (S3/S5), RG10/RG11/RG14 (S6), RG16 (S4, via `ORIGINE_REQUISE`).
- **Périmètre** : `ApplicationCible` n'apparaît que comme destination d'une **redirection**
  (S3) ; aucune séquence n'appelle une API métier ni une base d'application cible.
- **Sécurité** : PKCE + `state` + `nonce` (S0), filtrage serveur (S1), 404 indifférencié (S2),
  anti open-redirect (S3/S5), message neutre + motif journalisé (S5), RBAC + step-up + quatre
  yeux (S6).
- **Prochaine étape (5 — base de données)** : les colonnes et index évoqués dans `BD`
  (notamment `politique_acces(application_id, actif, statutValidation)` et
  `evenement_audit(horodatage, sujet_utilisateur, action, application_code)`) seront la base du
  script DDL MySQL.
