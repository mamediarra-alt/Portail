-- Dev : une application publiée mais réservée, pour démontrer la demande d'accès self-service.

INSERT INTO categorie_application (code, libelle, ordre_affichage) VALUES ('RH', 'Ressources humaines', 25)
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle);

INSERT INTO application
  (code, nom, description, url_acces, url_icone, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'APP_DEMO_RH', 'Espace Ressources Humaines',
       'Congés, formations, fiche de paie. Accès réservé — à demander.',
       'https://www.service-public.fr/', NULL, c.id, 'ACTIVE', 15,
       1, 0, 0, 'systeme:demo', 'systeme:demo'
FROM categorie_application c WHERE c.code = 'RH'
ON DUPLICATE KEY UPDATE statut = VALUES(statut), nom = VALUES(nom);

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'ROLE_REQUIS', 'RH_MANAGER', 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo'
FROM application a
WHERE a.code = 'APP_DEMO_RH'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);
