# Sécurité — Portail Ministériel

Statut : **socle initial** (à compléter selon le référentiel imposé par le CDC).

## 1. Référentiels applicables

| Référentiel | Portée | Niveau visé |
|---|---|---|
| OWASP ASVS 4.x | Vérification sécurité applicative | Niveau 2 minimum, Niveau 3 si données sensibles |
| OWASP Top 10 (2021) | Vulnérabilités web | Couverture complète |
| OWASP API Security Top 10 (2023) | APIs | Couverture complète |
| RGS / ANSSI (ou équivalent national) | Sécurité des systèmes de l'État | À confirmer avec le commanditaire |
| RGPD | Données à caractère personnel | Registre, base légale, minimisation |
| RGAA / WCAG 2.1 | Accessibilité | AA (à confirmer) |

## 2. Authentification et session

- SSO OIDC **Authorization Code + PKCE** ; pas de flux implicite.
- **MFA obligatoire** pour les comptes à privilèges, recommandée pour tous (OTP / WebAuthn).
- Session navigateur = cookie `httpOnly` + `Secure` + `SameSite`. Aucun token JWT accessible au JavaScript.
- Durées : token d'accès court (5–15 min), rafraîchissement avec rotation, session absolue plafonnée.
- Déconnexion centralisée (OIDC RP-Initiated Logout / back-channel logout).
- Politique de mot de passe + détection brute-force côté Keycloak ; verrouillage progressif.

## 3. Autorisation

- RBAC : rôles realm (transverses) + rôles client (par application).
- Principe du moindre privilège ; séparation des rôles d'administration.
- Contrôle d'accès vérifié **côté serveur** à chaque appel (`@PreAuthorize`, filtres gateway) — jamais uniquement dans l'UI.
- Habilitations « qui accède à quelle application » gérées dans le portail et propagées à Keycloak.

## 4. Sécurité des échanges

- TLS 1.2+ partout (y compris entre services internes). HSTS activé.
- En-têtes de réponse : `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options`/CSP `frame-ancestors`,
  `Permissions-Policy`.
- CORS : liste blanche stricte d'origines, pas de `*`.
- Protection CSRF sur toutes les requêtes mutables passant par cookie de session.

## 5. Sécurité des données

- Chiffrement au repos (volumes / SGBD) et des sauvegardes.
- Secrets hors du code : coffre (HashiCorp Vault, ou secrets Kubernetes/Docker), jamais en clair dans Git.
- `.env` et `application-local.*` exclus par `.gitignore`.
- Minimisation : ne stocker que les données nécessaires ; pseudonymisation quand c'est possible.
- Journaux : pas de donnée sensible ni de secret dans les logs.

## 6. Journalisation et audit

- Journal d'activité applicatif : connexion, déconnexion, accès application, changement d'habilitation, action d'administration.
- Événements Keycloak (login, échec, MFA, reset) exportés vers un puits de logs centralisé.
- Horodatage fiable, identifiant de corrélation, conservation selon le CDC.
- Logs en écriture seule / immuables si possible.

## 7. Sécurité du développement (chaîne logicielle)

- Analyse des dépendances : OWASP Dependency-Check / `npm audit` en CI, échec du build sur vulnérabilité critique.
- SAST (ex. SonarQube, CodeQL) et lint sécurité en CI.
- Revue de code obligatoire, branche `main` protégée.
- Images Docker : base minimale, non-root, scan (Trivy).
- Pas de secret dans l'historique Git (scan `gitleaks`).

## 8. Tests de sécurité

| Type | Fréquence |
|---|---|
| SAST + analyse dépendances | À chaque commit (CI) |
| DAST (ex. OWASP ZAP) | À chaque livraison en recette |
| Revue de configuration Keycloak | À chaque changement de realm |
| Test d'intrusion externe | Avant mise en production, puis périodique |
| Revue ASVS | Par jalon |

## 9. Checklist avant mise en production

- [ ] Comptes par défaut supprimés / mots de passe changés (Keycloak admin, BDD)
- [ ] TLS valide, HSTS, redirection HTTP→HTTPS
- [ ] En-têtes de sécurité vérifiés (scan)
- [ ] CORS restreint aux origines réelles
- [ ] MFA activée pour les administrateurs
- [ ] Sauvegardes chiffrées testées (restauration)
- [ ] Journaux centralisés opérationnels
- [ ] Scan de vulnérabilités sans critique/haute non traitée
- [ ] Test d'intrusion réalisé et écarts corrigés
- [ ] Registre RGPD à jour
