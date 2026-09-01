# Configuration Keycloak

## Realm

- Nom : `ministere`
- Import automatique au démarrage via `realm-export.json` (option `--import-realm`).

## Clients à définir (après le CDC)

| Client | Type | Usage |
|---|---|---|
| `portail-bff` | confidentiel | Passerelle BFF (Authorization Code + PKCE) |
| `app1-<code>` | selon mode | Application 1 |
| `app2-<code>` | selon mode | Application 2 |

## Rôles

- Rôles realm : `AGENT`, `GESTIONNAIRE_HABILITATIONS`, `ADMIN_PORTAIL`.
- Rôles client : propres à chaque application intégrée.

## Sécurité

- Changer tous les mots de passe par défaut avant tout déploiement partagé.
- Activer MFA (OTP/WebAuthn) au moins pour `ADMIN_PORTAIL`.
- Configurer la détection brute-force et la politique de mot de passe.
- Exporter les événements vers la journalisation centralisée.

## Fichier `realm-export.json`

Un gabarit minimal est fourni. Il sera enrichi (clients, mappers, MFA) une fois
les besoins figés.
