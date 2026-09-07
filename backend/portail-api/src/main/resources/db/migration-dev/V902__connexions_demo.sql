-- Dev : historique de connexions fictif pour la vue « Connexions des agents ».
-- Agents du Ministère avec matricule, IP, navigateur, horodatage.

INSERT INTO evenement_audit
  (horodatage, sujet_utilisateur, matricule, nom_utilisateur, action, application_code,
   resultat, adresse_ip, user_agent, identifiant_correlation, detail)
VALUES
  (NOW(6) - INTERVAL 5 MINUTE,  'kc|a1e2', 'MIN-04821', 'Awa DIALLO',       'CONNEXION', NULL, 'SUCCES', '10.12.4.31',  'Mozilla/5.0 (Windows NT 10.0) Chrome/128.0', UUID(), NULL),
  (NOW(6) - INTERVAL 42 MINUTE, 'kc|b7c3', 'MIN-01234', 'Cheikh NDIAYE',    'CONNEXION', NULL, 'SUCCES', '10.12.7.8',   'Mozilla/5.0 (Windows NT 10.0) Edg/128.0',    UUID(), NULL),
  (NOW(6) - INTERVAL 2 HOUR,    'kc|c9d1', 'MIN-07750', 'Fatou SARR',       'CONNEXION', NULL, 'SUCCES', '192.168.1.44','Mozilla/5.0 (Macintosh) Safari/17.0',        UUID(), NULL),
  (NOW(6) - INTERVAL 3 HOUR,    'kc|b7c3', 'MIN-01234', 'Cheikh NDIAYE',    'CONNEXION', NULL, 'SUCCES', '10.12.7.8',   'Mozilla/5.0 (Windows NT 10.0) Edg/128.0',    UUID(), NULL),
  (NOW(6) - INTERVAL 1 DAY,     'kc|e5f6', 'MIN-09002', 'Ibrahima FALL',    'CONNEXION', NULL, 'ECHEC',  '10.12.9.19',  'Mozilla/5.0 (X11; Linux) Firefox/129.0',     UUID(), '{"motif":"identifiants invalides"}'),
  (NOW(6) - INTERVAL 1 DAY + INTERVAL 4 MINUTE, 'kc|e5f6', 'MIN-09002', 'Ibrahima FALL', 'CONNEXION', NULL, 'SUCCES', '10.12.9.19', 'Mozilla/5.0 (X11; Linux) Firefox/129.0', UUID(), NULL),
  (NOW(6) - INTERVAL 2 DAY,     'kc|a1e2', 'MIN-04821', 'Awa DIALLO',       'CONNEXION', NULL, 'SUCCES', '10.12.4.31',  'Mozilla/5.0 (Windows NT 10.0) Chrome/127.0', UUID(), NULL),
  (NOW(6) - INTERVAL 4 DAY,     'kc|d4a8', 'MIN-03310', 'Mariama BÂ',       'CONNEXION', NULL, 'SUCCES', '10.12.2.5',   'Mozilla/5.0 (Windows NT 10.0) Chrome/128.0', UUID(), NULL);
