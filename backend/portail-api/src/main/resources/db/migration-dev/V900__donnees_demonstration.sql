-- Données de DÉMONSTRATION — chargées uniquement sous le profil « dev ».
-- Deux applications fictives pour voir le portail fonctionner sans EDUSN / Restaurant.

INSERT INTO domaine_autorise (domaine, description, actif, cree_par) VALUES
  ('demo.exemple.gouv', 'Cibles de démonstration (dev)', 1, 'systeme:demo')
ON DUPLICATE KEY UPDATE actif = VALUES(actif);

INSERT INTO categorie_application (code, libelle, ordre_affichage) VALUES
  ('DEMO', 'Démonstration', 5)
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle);

INSERT INTO application
  (code, nom, description, url_acces, url_icone, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'APP_DEMO_1', 'Application de démonstration 1',
       'Application fictive : valide l''affichage et la redirection depuis le portail.',
       'https://demo.exemple.gouv/app1/', NULL,
       c.id, 'ACTIVE', 10, 1, 0, 0, 'systeme:demo', 'systeme:demo'
FROM categorie_application c WHERE c.code = 'DEMO'
ON DUPLICATE KEY UPDATE statut = VALUES(statut), nom = VALUES(nom);

INSERT INTO application
  (code, nom, description, url_acces, url_icone, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'APP_DEMO_2', 'Application de démonstration 2',
       'Application fictive sensible : les politiques passent par une double validation.',
       'https://demo.exemple.gouv/app2/', NULL,
       c.id, 'MAINTENANCE', 20, 1, 1, 0, 'systeme:demo', 'systeme:demo'
FROM categorie_application c WHERE c.code = 'DEMO'
ON DUPLICATE KEY UPDATE statut = VALUES(statut), nom = VALUES(nom);

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'OUVERT_A_TOUS', NULL, 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo'
FROM application a
WHERE a.code = 'APP_DEMO_1'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'ROLE_REQUIS', 'AGENT', 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo'
FROM application a
WHERE a.code = 'APP_DEMO_2'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);
