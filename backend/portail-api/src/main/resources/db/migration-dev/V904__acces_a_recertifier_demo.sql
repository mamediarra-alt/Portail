-- Dev : deux accès nominatifs proches de l'échéance, pour la file « Accès à re-certifier ».

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par, date_expiration)
SELECT a.id, 'UTILISATEUR_REQUIS', 'kc|b7c3', 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo',
       NOW(6) + INTERVAL 4 DAY
FROM application a WHERE a.code = 'APP_DEMO_1'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p
                  WHERE p.application_id = a.id AND p.valeur = 'kc|b7c3');

INSERT INTO politique_acces
  (application_id, type_regle, valeur, effet, actif, statut_validation, demandee_par, date_expiration)
SELECT a.id, 'UTILISATEUR_REQUIS', 'kc|e5f6', 'AUTORISER', 1, 'ACTIVE_DIRECTE', 'systeme:demo',
       NOW(6) - INTERVAL 1 DAY
FROM application a WHERE a.code = 'APP_DEMO_RH'
  AND NOT EXISTS (SELECT 1 FROM politique_acces p
                  WHERE p.application_id = a.id AND p.valeur = 'kc|e5f6');
