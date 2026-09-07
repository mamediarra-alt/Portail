-- =============================================================================
--  Portail Applicatif du Ministère — Base « portail_db » (miroir Workbench)
--  SGBD : MySQL 8.0+ (InnoDB, utf8mb4).
--
--  Ce fichier reproduit le schéma géré par Flyway
--  (backend/portail-api/src/main/resources/db/migration/V1__*.sql, V2__*.sql)
--  et y ajoute la création de la base et des comptes. Il sert à MySQL Workbench
--  (exécution, modèle EER, revue). En exécution applicative, c'est Flyway qui
--  fait foi : ne pas laisser diverger les deux.
-- =============================================================================

-- 1) BASE ET COMPTES --------------------------------------------------------
CREATE DATABASE IF NOT EXISTS portail_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE portail_db;

CREATE USER IF NOT EXISTS 'portail_app'@'%'
  IDENTIFIED BY 'CHANGER_CE_MOT_DE_PASSE_APP';
GRANT SELECT, INSERT, UPDATE, DELETE ON portail_db.* TO 'portail_app'@'%';

CREATE USER IF NOT EXISTS 'portail_migration'@'%'
  IDENTIFIED BY 'CHANGER_CE_MOT_DE_PASSE_MIGRATION';
GRANT ALL PRIVILEGES ON portail_db.* TO 'portail_migration'@'%';
FLUSH PRIVILEGES;

-- 2) SCHEMA (identique à V1__schema_initial.sql) ---------------------------
CREATE TABLE IF NOT EXISTS categorie_application (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  code            VARCHAR(50)  NOT NULL,
  libelle         VARCHAR(150) NOT NULL,
  ordre_affichage INT          NOT NULL DEFAULT 0,
  date_creation   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_categorie_code UNIQUE (code),
  CONSTRAINT ck_categorie_code_format CHECK (code REGEXP '^[A-Z0-9_]{2,50}$')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS application (
  id                   BIGINT        NOT NULL AUTO_INCREMENT,
  code                 VARCHAR(50)   NOT NULL,
  nom                  VARCHAR(150)  NOT NULL,
  description          VARCHAR(1000) NOT NULL DEFAULT '',
  url_acces            VARCHAR(2048) NOT NULL,
  url_icone            VARCHAR(2048) NULL,
  categorie_id         BIGINT        NULL,
  statut               VARCHAR(20)   NOT NULL DEFAULT 'MASQUEE',
  ordre_affichage      INT           NOT NULL DEFAULT 0,
  ouvrir_nouvel_onglet TINYINT(1)    NOT NULL DEFAULT 0,
  sensible             TINYINT(1)    NOT NULL DEFAULT 0,
  archivee             TINYINT(1)    NOT NULL DEFAULT 0,
  date_creation        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  date_modification    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  cree_par             VARCHAR(150)  NOT NULL,
  modifie_par          VARCHAR(150)  NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_application_code UNIQUE (code),
  CONSTRAINT fk_application_categorie FOREIGN KEY (categorie_id)
    REFERENCES categorie_application (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_application_code_format CHECK (code REGEXP '^[A-Z0-9_]{2,50}$'),
  CONSTRAINT ck_application_url_https   CHECK (url_acces LIKE 'https://%'),
  CONSTRAINT ck_application_icone_https CHECK (url_icone IS NULL OR url_icone LIKE 'https://%'),
  CONSTRAINT ck_application_statut
    CHECK (statut IN ('ACTIVE','MAINTENANCE','INDISPONIBLE','MASQUEE'))
) ENGINE=InnoDB;

CREATE INDEX ix_application_categorie ON application (categorie_id);
CREATE INDEX ix_application_liste ON application (archivee, statut, ordre_affichage);

CREATE TABLE IF NOT EXISTS politique_acces (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  application_id       BIGINT       NOT NULL,
  type_regle           VARCHAR(20)  NOT NULL,
  valeur               VARCHAR(150) NULL,
  effet                VARCHAR(12)  NOT NULL DEFAULT 'AUTORISER',
  actif                TINYINT(1)   NOT NULL DEFAULT 0,
  statut_validation    VARCHAR(24)  NOT NULL DEFAULT 'ACTIVE_DIRECTE',
  demandee_par         VARCHAR(150) NOT NULL,
  approuvee_par        VARCHAR(150) NULL,
  date_demande         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  date_decision        DATETIME(6)  NULL,
  commentaire_decision VARCHAR(500) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_politique_application FOREIGN KEY (application_id)
    REFERENCES application (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_politique_type
    CHECK (type_regle IN ('ROLE_REQUIS','GROUPE_REQUIS','ORIGINE_REQUISE','OUVERT_A_TOUS')),
  CONSTRAINT ck_politique_effet CHECK (effet IN ('AUTORISER','REFUSER')),
  CONSTRAINT ck_politique_statut_validation
    CHECK (statut_validation IN ('ACTIVE_DIRECTE','EN_ATTENTE_APPROBATION','APPROUVEE','REJETEE')),
  CONSTRAINT ck_politique_valeur CHECK (
        (type_regle =  'OUVERT_A_TOUS' AND valeur IS NULL)
     OR (type_regle <> 'OUVERT_A_TOUS' AND valeur IS NOT NULL)
  ),
  CONSTRAINT ck_politique_approbation CHECK (
        statut_validation <> 'APPROUVEE'
     OR (approuvee_par IS NOT NULL AND date_decision IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE INDEX ix_politique_eval ON politique_acces (application_id, actif, statut_validation);

CREATE TABLE IF NOT EXISTS domaine_autorise (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  domaine       VARCHAR(253) NOT NULL,
  description   VARCHAR(300) NOT NULL DEFAULT '',
  actif         TINYINT(1)   NOT NULL DEFAULT 1,
  date_creation DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  cree_par      VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_domaine UNIQUE (domaine),
  CONSTRAINT ck_domaine_format CHECK (domaine REGEXP '^[a-z0-9.-]+\\.[a-z]{2,}$')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evenement_audit (
  id                      BIGINT       NOT NULL AUTO_INCREMENT,
  horodatage              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  sujet_utilisateur       VARCHAR(150) NULL,
  nom_utilisateur         VARCHAR(200) NULL,
  action                  VARCHAR(40)  NOT NULL,
  application_code        VARCHAR(50)  NULL,
  resultat                VARCHAR(8)   NOT NULL,
  adresse_ip              VARCHAR(45)  NULL,
  user_agent              VARCHAR(400) NULL,
  identifiant_correlation VARCHAR(64)  NULL,
  detail                  JSON         NULL,
  PRIMARY KEY (id),
  CONSTRAINT ck_audit_resultat CHECK (resultat IN ('SUCCES','ECHEC'))
) ENGINE=InnoDB;

CREATE INDEX ix_audit_horodatage  ON evenement_audit (horodatage);
CREATE INDEX ix_audit_sujet       ON evenement_audit (sujet_utilisateur, horodatage);
CREATE INDEX ix_audit_action      ON evenement_audit (action, horodatage);
CREATE INDEX ix_audit_application ON evenement_audit (application_code, horodatage);

CREATE TABLE IF NOT EXISTS configuration_portail (
  cle               VARCHAR(100)  NOT NULL,
  valeur            VARCHAR(2000) NOT NULL DEFAULT '',
  description       VARCHAR(300)  NOT NULL DEFAULT '',
  date_modification DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  modifie_par       VARCHAR(150)  NOT NULL,
  PRIMARY KEY (cle)
) ENGINE=InnoDB;

-- 3) JOURNAL D'AUDIT : APPEND ONLY ---------------------------------------
DELIMITER //
DROP TRIGGER IF EXISTS trg_evenement_audit_no_update //
CREATE TRIGGER trg_evenement_audit_no_update
BEFORE UPDATE ON evenement_audit
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'evenement_audit est append-only : UPDATE interdit';
END //
DROP TRIGGER IF EXISTS trg_evenement_audit_no_delete //
CREATE TRIGGER trg_evenement_audit_no_delete
BEFORE DELETE ON evenement_audit
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'evenement_audit est append-only : DELETE interdit';
END //
DELIMITER ;

-- 4) DONNEES DE REFERENCE (identique à V2__donnees_reference.sql) --------
INSERT INTO categorie_application (code, libelle, ordre_affichage) VALUES
  ('SCOLARITE', 'Scolarité',           10),
  ('SERVICES',  'Services aux agents',  20),
  ('RH',        'Ressources humaines',  30),
  ('FINANCE',   'Finance',              40)
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), ordre_affichage = VALUES(ordre_affichage);

INSERT INTO domaine_autorise (domaine, description, actif, cree_par) VALUES
  ('edusn.ministere.gouv',      'Application EDUSN (scolarité)', 1, 'systeme:migration'),
  ('restaurant.ministere.gouv', 'Application de restauration',   1, 'systeme:migration')
ON DUPLICATE KEY UPDATE description = VALUES(description), actif = VALUES(actif);

INSERT INTO configuration_portail (cle, valeur, description, modifie_par) VALUES
  ('portail.titre',                'Portail Applicatif du Ministère',         'Titre affiché dans l''en-tête',         'systeme:migration'),
  ('portail.sous_titre',           'Accès unifié aux applications',           'Sous-titre de la page d''accueil',       'systeme:migration'),
  ('portail.banniere_message',     '',                                       'Bandeau d''information (vide = masqué)', 'systeme:migration'),
  ('portail.lien_support',         'https://support.ministere.gouv',          'Lien d''assistance',                    'systeme:migration'),
  ('portail.mentions_legales_url', 'https://ministere.gouv/mentions-legales', 'URL des mentions légales',              'systeme:migration')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO application
  (code, nom, description, url_acces, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'EDUSN', 'EDUSN', 'Gestion des établissements scolaires.',
       'https://edusn.ministere.gouv/', c.id, 'MASQUEE', 10,
       0, 1, 0, 'systeme:migration', 'systeme:migration'
FROM categorie_application c WHERE c.code = 'SCOLARITE'
ON DUPLICATE KEY UPDATE nom = VALUES(nom);

INSERT INTO application
  (code, nom, description, url_acces, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'RESTAURANT', 'Restauration', 'Service de restauration du Ministère.',
       'https://restaurant.ministere.gouv/', c.id, 'MASQUEE', 20,
       0, 0, 0, 'systeme:migration', 'systeme:migration'
FROM categorie_application c WHERE c.code = 'SERVICES'
ON DUPLICATE KEY UPDATE nom = VALUES(nom);
