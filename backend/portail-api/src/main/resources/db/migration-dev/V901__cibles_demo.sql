-- Dev : cibles de démonstration réellement joignables + un exemple en maintenance.

INSERT INTO domaine_autorise (domaine, description, actif, cree_par) VALUES
  ('gouv.fr',            'Cible de démonstration', 1, 'systeme:demo'),
  ('service-public.fr',  'Cible de démonstration', 1, 'systeme:demo')
ON DUPLICATE KEY UPDATE actif = VALUES(actif);

UPDATE application
   SET url_acces = 'https://www.gouv.fr/', statut = 'ACTIVE', ouvrir_nouvel_onglet = 1
 WHERE code = 'APP_DEMO_1';

UPDATE application
   SET url_acces = 'https://www.service-public.fr/', statut = 'ACTIVE', ouvrir_nouvel_onglet = 1
 WHERE code = 'APP_DEMO_2';

INSERT INTO application
  (code, nom, description, url_acces, url_icone, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'APP_DEMO_3', 'Application de démonstration 3',
       'Exemple d''application en maintenance : l''accès est présenté mais bloqué.',
       'https://www.gouv.fr/', NULL, c.id, 'MAINTENANCE', 30,
       1, 0, 0, 'systeme:demo', 'systeme:demo'
FROM categorie_application c WHERE c.code = 'DEMO'
ON DUPLICATE KEY UPDATE statut = VALUES(statut), nom = VALUES(nom);

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'OUVERT_A_TOUS', NULL, 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo'
FROM application a
WHERE a.code = 'APP_DEMO_3'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);
