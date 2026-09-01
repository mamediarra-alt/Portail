# Modélisation — Portail Ministériel

Statut : **squelette** — à remplir à partir du cahier des charges (`00-cahier-des-charges.md`).

Approche : modélisation UML légère (cas d'utilisation, modèle du domaine, séquences
clés), puis conception détaillée.

## 1. Cas d'utilisation

### Acteurs
- **Agent** : utilisateur final, accède aux applications autorisées.
- **Gestionnaire d'habilitations** : attribue/révoque les accès applicatifs.
- **Administrateur portail** : gère le catalogue d'applications, la configuration, consulte l'audit.
- **Système d'identité (Keycloak)** : acteur secondaire pour l'authentification.

### Diagramme (à compléter)

```
(Agent)
  ├── S'authentifier (SSO)
  ├── Consulter le tableau de bord
  ├── Lancer une application
  ├── Gérer son profil
  └── Se déconnecter (SLO)

(Gestionnaire d'habilitations)
  ├── Rechercher un utilisateur
  ├── Attribuer un accès application
  └── Révoquer un accès application

(Administrateur portail)
  ├── Gérer le catalogue d'applications
  ├── Configurer un mode d'intégration
  └── Consulter le journal d'audit
```

## 2. Modèle du domaine (ébauche)

```
Utilisateur (idKeycloak, nom, prénom, email, statut, directionRattachement)
        │ *
        │ possède
        ▼ *
Habilitation (id, dateAttribution, dateExpiration, attribuéePar)
        │ *
        │ porte sur
        ▼ 1
Application (id, code, libellé, description, urlAcces, modeIntegration, statut, icône)
        │ 1
        │ expose
        ▼ *
Role (id, code, libellé)          // rôles applicatifs propagés à Keycloak

JournalActivite (id, horodatage, idUtilisateur, action, cible, adresseIP, résultat)

PreferenceUtilisateur (idUtilisateur, thème, langue, applicationsFavorites)
```

`modeIntegration ∈ { OIDC_NATIF, REVERSE_PROXY, SAML, LIEN_SIMPLE }`

## 3. Séquences clés (à détailler)

- **Connexion SSO** : navigateur → BFF → Keycloak (auth + MFA) → BFF (session) → SPA.
- **Lancement d'une application OIDC** : SPA → BFF → app (redirection OIDC, session SSO déjà active).
- **Attribution d'habilitation** : gestionnaire → Portail-API → persistance → synchronisation rôle Keycloak → journal.

## 4. Modèle de données (physique)

À dériver du modèle du domaine une fois stabilisé (tables, index, contraintes,
stratégie de migration — Flyway/Liquibase).

## 5. Contrats d'API

À spécifier en OpenAPI dans `backend/portail-api` (catalogue, habilitations,
profil, audit).
