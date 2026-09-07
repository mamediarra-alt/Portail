-- =============================================================================
--  Portail Applicatif du Ministère — Données de DÉMONSTRATION
--  À charger UNIQUEMENT en environnement local / dev / recette.
--  NE JAMAIS exécuter en production.
--
--  Prérequis : portail_db.sql déjà exécuté (schéma + données de référence).
--  Crée deux applications fictives et leurs politiques d'accès pour valider
--  le portail avant l'intégration des applications réelles.
-- =============================================================================
USE portail_db;

-- Domaine autorisé pour les cibles de démonstration
INSERT INTO domaine_autorise (domaine, description, actif, cree_par) VALUES
  ('demo.exemple.gouv', 'Cibles de démonstration (dev/recette uniquement)', 1, 'systeme:demo')
ON DUPLICATE KEY UPDATE actif = VALUES(actif);

-- Application de démo 1 : ouverte à tous les utilisateurs authentifiés
INSERT INTO application
  (code, nom, description, url_acces, url_icone, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'APP_DEMO_1', 'Application de démonstration 1',
       'Application fictive servant à valider l''affichage et l''accès depuis le portail.',
       'https://demo.exemple.gouv/app1/', 'https://demo.exemple.gouv/app1/icone.png',
       c.id, 'ACTIVE', 10, 0, 0, 0, 'systeme:demo', 'systeme:demo'
FROM categorie_application c WHERE c.code = 'SERVICES'
ON DUPLICATE KEY UPDATE statut = VALUES(statut), nom = VALUES(nom);

-- Application de démo 2 : réservée au rôle AGENT
INSERT INTO application
  (code, nom, description, url_acces, url_icone, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'APP_DEMO_2', 'Application de démonstration 2',
       'Application fictive réservée aux agents, pour valider le filtrage par rôle.',
       'https://demo.exemple.gouv/app2/', NULL,
       c.id, 'ACTIVE', 20, 1, 0, 0, 'systeme:demo', 'systeme:demo'
FROM categorie_application c WHERE c.code = 'SERVICES'
ON DUPLICATE KEY UPDATE statut = VALUES(statut), nom = VALUES(nom);

-- Politique : APP_DEMO_1 ouverte à tous les utilisateurs authentifiés
INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'OUVERT_A_TOUS', NULL, 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo'
FROM application a WHERE a.code = 'APP_DEMO_1'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);

-- Politique : APP_DEMO_2 réservée au rôle realm « AGENT »
INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'ROLE_REQUIS', 'AGENT', 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo'
FROM application a WHERE a.code = 'APP_DEMO_2'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);

-- Fin du script de démonstration.
