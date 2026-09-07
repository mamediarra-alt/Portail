# Sécurité — Portail Applicatif du Ministère

Statut : **Étape 8 / 8 — Sécurité transverse & durcissement**. Document consolidé : modèle de
menaces, architecture de sécurité, correspondance OWASP ASVS ↔ code, checklist de mise en
production.

Cadre : application de l'État, **données sensibles**. Cible **OWASP ASVS niveau 2** minimum,
contrôles **niveau 3** sur la gestion de session et l'audit.

---

## 1. Référentiels applicables

| Référentiel | Portée | Niveau visé |
|---|---|---|
| OWASP ASVS 4.x | Vérification sécurité applicative | L2 (L3 : session, audit) |
| OWASP Top 10 (2021) | Vulnérabilités web | Couverture complète |
| OWASP API Security Top 10 (2023) | API | Couverture complète |
| RGS / ANSSI (ou équivalent national) | Systèmes de l'État | À confirmer avec le commanditaire |
| RGPD | Données à caractère personnel | Registre, base légale, minimisation |
| RGAA 4 / WCAG 2.1 | Accessibilité | AA (à confirmer) |

## 2. Périmètre & principes

Le portail est une **couche d'accès** : il n'héberge aucune donnée métier d'EDUSN ou du
Restaurant, ne détient **aucun compte** ni mot de passe (identité déléguée à Keycloak), et ne
se connecte qu'à sa **propre base** `portail_db`.

Principes appliqués :

- **Défense en profondeur** : chaque contrôle est doublé (bord réseau, BFF, API, base).
- **Moindre privilège** : rôles distincts (`AGENT`, `ADMIN_PORTAIL`, `AUDITEUR_PORTAIL`),
  comptes base séparés (`portail_app` sans DDL, `portail_migration`).
- **Aucune confiance dans le client** : tout contrôle d'accès est refait côté serveur ; le
  masquage d'un bouton n'est pas une mesure de sécurité.
- **Traçabilité systématique** : tout accès (autorisé ou refusé) et toute action
  d'administration sont journalisés, en écriture seule.

## 3. Modèle de menaces (synthèse)

| Bien | Menace | Contre-mesure (où) |
|---|---|---|
| Session utilisateur | Vol de jeton via XSS | Pattern **BFF** : aucun jeton dans le navigateur ; cookie `httpOnly`+`Secure`+`SameSite` ; CSP stricte (`portail-bff` `SecurityConfig`) |
| Requêtes mutables | CSRF | Cookie `XSRF-TOKEN` → en-tête `X-XSRF-TOKEN` exigé (BFF + `HttpClient`) |
| Redirection vers application | **Open redirect** | URL cible **uniquement** issue du catalogue + liste blanche `domaine_autorise` + `https` imposé (`ValidateurUrlCible`, `ck_application_url_https`) |
| API métier | Accès sans jeton / jeton d'un autre service | Resource Server JWT (signature JWKS, `iss`, `exp`) + **validateur d'audience** (`ValidateurAudience`) |
| Administration | Élévation de privilèges | RBAC par chemin **et** `@PreAuthorize` au niveau contrôleur ; MFA exigée pour `ADMIN_PORTAIL` (realm) |
| Politiques d'accès sensibles | Action unilatérale d'un administrateur | **Double validation** (« quatre yeux ») : le demandeur ne peut pas approuver (`ServicePolitiqueAcces`) |
| Journal d'audit | Altération / effacement des preuves | `evenement_audit` **append-only** : déclencheurs SQL `BEFORE UPDATE/DELETE` + entité sans setters + export SIEM |
| Données personnelles | Fuite par les logs | Minimisation ; pas de secret ni de jeton dans les journaux ; IP selon politique RGPD (Q7) |
| Injection SQL | Requêtes forgées | JPA/paramètres liés uniquement ; `CHECK` en base ; validation Bean Validation + `ValidationMetierException` |
| Divulgation d'existence | Énumération d'applications masquées | Réponse **404 indifférenciée** (`ServiceCatalogue`, `GestionnaireExceptions`) |
| Transport | Interception réseau | TLS 1.2+ partout, HSTS, redirection HTTP→HTTPS (reverse proxy) |
| Déni de service applicatif | Automatisation des accès | Rate limiting au reverse proxy (`nginx.conf` zones `portail_general` / `portail_acces`) |

## 4. Architecture de sécurité — couches

```
Navigateur
  │  HTTPS, cookie de session httpOnly, jeton CSRF
  ▼
Reverse proxy (Nginx/Traefik)  ── TLS, HSTS, en-têtes, rate limiting, sous-domaines
  ▼
BFF (portail-bff)              ── OIDC Auth Code + PKCE, session serveur, CSRF,
  │  Authorization: Bearer        CSP frame-ancestors 'none', RP-Initiated Logout,
  ▼                               retrait du Cookie vers l'aval, TokenRelay
Portail-API (portail-api)      ── Resource Server JWT (iss/exp/aud), RBAC + @PreAuthorize,
  │  SQL paramétré                contrôle d'accès serveur, anti open-redirect, audit
  ▼
MySQL portail_db              ── comptes séparés, CHECK, triggers append-only, chiffrement au repos
```

## 5. Authentification & session

- SSO **OIDC Authorization Code + PKCE** (`state`, `nonce` vérifiés) ; **flux implicite
  interdit**.
- **MFA** : obligatoire pour les comptes à privilèges (realm `bruteForceProtected`,
  `passwordPolicy` longueur 12 + classes de caractères), recommandée pour tous (OTP / WebAuthn).
- Session portée par un **cookie serveur** `HttpOnly` + `Secure` + `SameSite=Lax` ; **aucun
  jeton JWT accessible au JavaScript**.
- Le BFF échange le `code` **par canal arrière** et valide l'`id_token` (JWKS, `iss`, `aud`,
  `exp`, `nonce`).
- Durées : jeton d'accès court, rafraîchissement avec rotation côté BFF, session absolue
  plafonnée.
- **Déconnexion centralisée** : `POST /bff/logout` (CSRF) → `OidcClientInitiatedServerLogoutSuccessHandler`
  (RP-Initiated Logout), back-channel logout côté realm.
- Sur `401`, la SPA relance automatiquement `/oauth2/authorization/keycloak` (aucun mode
  dégradé non authentifié).

## 6. Autorisation

- **RBAC** : rôles realm `AGENT`, `ADMIN_PORTAIL`, `AUDITEUR_PORTAIL` (+ `GESTIONNAIRE_HABILITATIONS`
  réservé). Projetés en autorités `ROLE_*` (`ConvertisseurRolesRealm`).
- Contrôle **par chemin** (`SecurityConfig`) **et par méthode** (`@PreAuthorize` sur chaque
  contrôleur d'administration) — défense en profondeur.
- **Contrôle d'accès applicatif** (`ServiceControleAcces`) refait à chaque appel pour le
  catalogue (UC03), le détail (UC04) et l'accès (UC05) : `REFUSER` prime, puis `AUTORISER` /
  `OUVERT_A_TOUS`, seules les politiques actives **et validées** comptent.
- **Séparation des pouvoirs** : `AUDITEUR_PORTAIL` distinct de `ADMIN_PORTAIL` ; politiques des
  applications `sensible` en double validation, approbation impossible par le demandeur (409).

## 7. Anti open-redirect (RG07 / RG08)

Contrôle **à trois niveaux** :

1. **Base** : `CHECK (url_acces LIKE 'https://%')` sur `application`.
2. **Configuration** : `ServiceAdministrationCatalogue` refuse toute `urlAcces` dont le domaine
   n'est pas dans `domaine_autorise` actif (`ValidateurUrlCible`).
3. **Exécution** : `ServiceAcces` revalide l'URL **avant chaque redirection** ; l'échec
   déclenche `ConfigurationInvalideException` (HTTP 422) + événement `ERREUR` + **alerte SIEM**.

La destination ne provient **jamais** d'un paramètre ou d'une saisie du client. La SPA fait une
navigation **pleine page** (`window.location` / `window.open` + `rel=noopener`), jamais d'`iframe` ;
le portail se protège lui-même par `frame-ancestors 'none'`.

## 8. En-têtes de réponse & transport

| En-tête | Valeur | Posé par |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | BFF + API + reverse proxy |
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'` | BFF + reverse proxy |
| `X-Content-Type-Options` | `nosniff` | BFF + API + reverse proxy |
| `X-Frame-Options` | `DENY` | BFF + API + reverse proxy |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | BFF + API + reverse proxy |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` | BFF + API + reverse proxy |
| `Cache-Control` | `no-store` sur les réponses API personnalisées | API (`SecurityConfig`, contrôleurs) |

- TLS 1.2+ partout, y compris entre services internes.
- **CORS** : désactivé sur `portail-api` (appelée uniquement par le BFF, même réseau) ; à
  n'ouvrir que sur des origines explicites si un besoin apparaît.

## 9. Audit & journalisation

- `EvenementAudit` **append-only** : entité immuable (constructeur *builder*, aucun setter) +
  déclencheurs `trg_evenement_audit_no_update` / `trg_evenement_audit_no_delete` (SIGNAL 45000).
- Journalisation dans une transaction `REQUIRES_NEW` : un refus fonctionnel n'annule pas la
  trace.
- Événements couverts : connexion, déconnexion, consultation, accès autorisé/refusé, toutes
  les actions d'administration, anomalies de configuration.
- Chaque événement porte : horodatage fiable (UTC), sujet, action, application, résultat, IP,
  User-Agent tronqué, identifiant de corrélation, détail JSON.
- **Export SIEM** : logger dédié `AUDIT.SIEM` (à brancher sur syslog/HTTP de la plateforme de
  l'État) ; la base n'est pas l'unique dépositaire.
- **Rétention** : partitionnement mensuel de `evenement_audit` sur `horodatage`, purge par
  `DROP PARTITION` (opération d'administration), durée conforme à la politique de l'État
  (**Q6 — à confirmer**). Migration `V3__` à créer.
- Consultation réservée à `AUDITEUR_PORTAIL` / `ADMIN_PORTAIL` ; l'accès à l'audit est
  lui-même audité (`EXPORT_AUDIT`).

## 10. Secrets

- Aucun secret dans le code ni dans Git. Modèle : [../infra/.env.example](../infra/.env.example).
- `.gitignore` exclut `.env*`, `application-local.*`, `secrets/`.
- Production : coffre (HashiCorp Vault) ou secrets d'orchestrateur ; rotation périodique du
  secret client `portail-bff` et des mots de passe base.
- `spring.flyway.clean-disabled: true` ; comptes Keycloak/BDD par défaut à supprimer/renommer.

## 11. Sécurité de la chaîne logicielle

| Contrôle | Outil | Fréquence |
|---|---|---|
| Analyse des dépendances | OWASP Dependency-Check / `npm audit` | à chaque commit (CI), échec sur critique |
| SAST | SonarQube / CodeQL + lint sécurité | à chaque commit |
| Images Docker | base minimale, non-root, scan Trivy | à chaque build |
| Secrets dans l'historique | `gitleaks` | à chaque commit |
| Revue de code | obligatoire, `main` protégée | par PR |

## 12. Correspondance OWASP ASVS L2 → implémentation

| Chapitre ASVS | Exigence clé | Implémentation | Statut |
|---|---|---|---|
| V1 Architecture | Contrôles côté serveur, composants identifiés | Diagrammes docs 01/06/07 ; contrôle serveur systématique | ✅ |
| V2 Authentification | Pas de mot de passe géré par l'app ; MFA privilèges | Délégation Keycloak (RG02) ; MFA realm | ✅ |
| V3 Session | Cookie `HttpOnly`/`Secure`/`SameSite`, invalidation serveur, SLO | BFF `SecurityConfig`, RP-Initiated Logout | ✅ (L3 visé) |
| V4 Contrôle d'accès | Vérifié serveur à chaque appel, moindre privilège, deny par défaut | `SecurityConfig` + `@PreAuthorize` + `ServiceControleAcces` + `anyRequest().denyAll()` | ✅ |
| V5 Validation / encodage | Validation stricte, anti open-redirect, anti XSS stocké | Bean Validation + `ValidateurUrlCible` + assainissement config | ✅ |
| V7 Gestion des erreurs & logs | Messages neutres, logs d'audit, pas de stacktrace | `GestionnaireExceptions` (RFC 7807), `server.error.*`, `ServiceAudit` | ✅ |
| V8 Protection des données | Minimisation, pas de secret en clair | Projection minimale des claims ; `.env` hors Git | ✅ / ⏳ (IP RGPD, Q7) |
| V9 Communications | TLS partout, HSTS | Reverse proxy + HSTS applicatif | ✅ (à activer en prod) |
| V11 Logique métier | Séquençage, quatre yeux | `ServicePolitiqueAcces`, `statut_validation` | ✅ |
| V12 Fichiers & ressources | Pas d'upload arbitraire ; URLs contrôlées | Pas d'upload ; liste blanche domaines | ✅ |
| V13 API | JWT validé (iss/exp/aud), rate limiting, deny par défaut | Resource Server + `ValidateurAudience` + nginx | ✅ / ⏳ (aud à mapper dans Keycloak) |
| V14 Configuration | Durcissement, secrets externalisés, en-têtes | `application.yml`, en-têtes, `.env.example` | ✅ |

⏳ = mise en œuvre prête, activation à finaliser en environnement réel.

## 13. Tests de sécurité

| Type | Outil | Déclencheur |
|---|---|---|
| SAST + dépendances | SonarQube/CodeQL, Dependency-Check, `npm audit` | CI, chaque commit |
| Tests unitaires sécurité | `ServiceControleAccesTest` (REFUSER prime, blocage statut, etc.) | CI |
| Tests API authz | `@WebMvcTest` + `spring-security-test` (jetons simulés par rôle) | **à écrire** (étape durcissement) |
| DAST | OWASP ZAP (baseline + active scan authentifié) | à chaque livraison en recette |
| Revue de configuration Keycloak | manuelle | à chaque changement de realm |
| Test d'intrusion externe | prestataire | avant mise en production, puis périodique |
| Revue ASVS | interne | par jalon |

## 14. Checklist avant mise en production

- [ ] TLS valide sur tous les sous-domaines ; HSTS ; redirection HTTP→HTTPS
- [ ] En-têtes de sécurité vérifiés par scan (securityheaders.com / ZAP)
- [ ] Comptes par défaut supprimés/renommés (Keycloak admin, MySQL root, `portail_app` mot de passe fort)
- [ ] `PORTAIL_OIDC_AUDIENCE` renseigné + mapper d'audience `portail-api` créé dans Keycloak
- [ ] Secret client `portail-bff` fort, stocké en coffre
- [ ] MFA activée et testée pour `ADMIN_PORTAIL` et `AUDITEUR_PORTAIL`
- [ ] `spring.jpa.hibernate.ddl-auto=validate` ; Flyway `clean-disabled=true`
- [ ] Triggers append-only présents sur `evenement_audit` (test : `UPDATE` doit échouer)
- [ ] Rate limiting actif au reverse proxy
- [ ] CSP sans `unsafe-eval` ; `unsafe-inline` styles justifié ou supprimé
- [ ] Chiffrement au repos (MySQL/volumes) + sauvegardes chiffrées testées (restauration)
- [ ] Export SIEM opérationnel ; rétention d'audit paramétrée (Q6) ; partition `V3__` appliquée
- [ ] Politique de conservation des IP tranchée (Q7)
- [ ] Scan de vulnérabilités sans critique/haute non traitée
- [ ] Test d'intrusion réalisé, écarts corrigés
- [ ] Registre RGPD à jour ; DPO informé
- [ ] Runbook incident (révocation de session, rotation de secret, blocage d'une application)

## 15. Points ouverts

| # | Sujet | Décision attendue |
|---|---|---|
| Q6 | Durée de conservation du journal d'audit | 12 mois / 3 ans / 5 ans ? |
| Q7 | `adresse_ip` : complète, tronquée ou pseudonymisée (RGPD) | — |
| — | Session BFF partagée (Spring Session + Redis) pour le déploiement multi-instance | oui/non selon la cible d'hébergement |
| — | Référentiel national exact (RGS/ANSSI ou équivalent) et niveau | à confirmer avec le commanditaire |
