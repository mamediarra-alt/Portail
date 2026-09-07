-- Dev : publier l'application Restaurant (sama_resto, PHP) dans le portail.
-- BASE_URL de l'app = http://localhost/restaurant (attend XAMPP : htdocs/restaurant).

UPDATE application
   SET url_acces = 'http://localhost/restaurant/',
       description = 'Restaurant Online — commandes, réservations, livraisons, paiements.',
       statut = 'ACTIVE',
       ouvrir_nouvel_onglet = 1,
       archivee = 0
 WHERE code = 'RESTAURANT';

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par)
SELECT a.id, 'OUVERT_A_TOUS', NULL, 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:integration'
FROM application a
WHERE a.code = 'RESTAURANT'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p WHERE p.application_id = a.id);
