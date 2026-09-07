-- Dev : publier l'application EDUSN dans le portail (lancée en local sur http://localhost:8080).
-- On relâche la contrainte "https uniquement" en dev ; le ValidateurUrlCible autorise localhost.

SET @e := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'application'
             AND CONSTRAINT_NAME = 'ck_application_url_https');
SET @s := IF(@e > 0, 'ALTER TABLE application DROP CHECK ck_application_url_https', 'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

UPDATE application
   SET url_acces = 'http://localhost:8080/',
       description = 'Gestion des établissements scolaires. Ouvre l''application EDUSN.',
       statut = 'ACTIVE',
       ouvrir_nouvel_onglet = 1,
       archivee = 0
 WHERE code = 'EDUSN';

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'OUVERT_A_TOUS', NULL, 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:integration'
FROM application a
WHERE a.code = 'EDUSN'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);
