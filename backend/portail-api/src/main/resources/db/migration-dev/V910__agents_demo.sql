-- Dev : agents du Ministère habilités à se connecter au portail (matricule + mot de passe).
-- Mot de passe de démonstration pour tous : Portail2026!  (stocké {noop} en dev uniquement ;
-- en production, l'identité vient du fournisseur d'identité de l'État, pas de cette table).

CREATE TABLE agent_demo (
  matricule           VARCHAR(50)  NOT NULL,
  nom                 VARCHAR(200) NOT NULL,
  mot_de_passe        VARCHAR(200) NOT NULL,
  roles               VARCHAR(300) NOT NULL DEFAULT 'AGENT',
  actif               TINYINT(1)   NOT NULL DEFAULT 1,
  tentatives_echouees INT          NOT NULL DEFAULT 0,
  verrouille_jusqu    DATETIME(6)  NULL,
  PRIMARY KEY (matricule)
) ENGINE=InnoDB;

INSERT INTO agent_demo (matricule, nom, mot_de_passe, roles) VALUES
  ('MIN-04821', 'Awa DIALLO',     '{noop}Portail2026!', 'AGENT,ADMIN_PORTAIL,AUDITEUR_PORTAIL'),
  ('MIN-01234', 'Cheikh NDIAYE',  '{noop}Portail2026!', 'AGENT'),
  ('MIN-07750', 'Fatou SARR',     '{noop}Portail2026!', 'AGENT'),
  ('MIN-09002', 'Ibrahima FALL',  '{noop}Portail2026!', 'AGENT,AUDITEUR_PORTAIL');
