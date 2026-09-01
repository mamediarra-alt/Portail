# Cahier des charges — Portail Ministériel

> **À compléter.** Coller ici le cahier des charges fourni par le commanditaire.
> Ce document est la référence pour la modélisation et la conception.

## 1. Contexte et enjeux

_(à renseigner)_

## 2. Acteurs et parties prenantes

| Acteur | Rôle | Application(s) concernée(s) |
|---|---|---|
| _(ex. Agent ministériel)_ | | |
| _(ex. Administrateur portail)_ | | |
| _(ex. Gestionnaire habilitations)_ | | |

## 3. Besoins fonctionnels

### 3.1 Portail
- Authentification unique (SSO)
- Tableau de bord / lanceur d'applications
- Gestion du profil utilisateur
- Gestion des habilitations (qui accède à quelle application)
- Journal d'activité / audit
- _(compléter avec le CDC)_

### 3.2 Application 1 — _(nom)_
- Stack : _(à préciser)_
- Mode d'intégration pressenti : _(client OIDC / reverse proxy / iframe / lien)_

### 3.3 Application 2 — _(nom)_
- Stack : _(à préciser)_
- Mode d'intégration pressenti : _(client OIDC / reverse proxy / iframe / lien)_

## 4. Besoins non fonctionnels

| Domaine | Exigence |
|---|---|
| Sécurité | Référentiel(s) applicable(s) : OWASP ASVS niveau ?, RGS/ANSSI ou équivalent national |
| Performance | _(nb utilisateurs, temps de réponse cible)_ |
| Disponibilité | _(SLA, plages de service)_ |
| Hébergement | _(cloud souverain / on-premise ministère)_ |
| Accessibilité | RGAA / WCAG niveau ? |
| Langues | _(fr, autres)_ |
| Conservation des logs | _(durée)_ |
| RGPD / données personnelles | _(base légale, DPO, registre)_ |

## 5. Contraintes techniques imposées

_(annuaire LDAP/AD existant, IdP national, chartes graphiques de l'État, etc.)_

## 6. Livrables attendus

_(à renseigner)_

## 7. Planning / jalons

| Jalon | Contenu | Échéance |
|---|---|---|
| J1 | Modélisation validée | |
| J2 | Conception + socle sécurité | |
| J3 | Portail opérationnel (sans apps) | |
| J4 | Intégration application 1 | |
| J5 | Intégration application 2 | |
