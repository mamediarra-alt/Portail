-- Portail Applicatif du Ministère — schéma initial (MySQL 8, InnoDB, utf8mb4).
-- Source de vérité du schéma. Le fichier infra/db/portail_db.sql en est le miroir.

CREATE TABLE categorie_application (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  code            VARCHAR(50)  NOT NULL,
  libelle         VARCHAR(150) NOT NULL,
  ordre_affichage INT          NOT NULL DEFAULT 0,
  date_creation   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_categorie_code UNIQUE (code),
  CONSTRAINT ck_categorie_code_format CHECK (code REGEXP '^[A-Z0-9_]{2,50}$')
) ENGINE=InnoDB;

CREATE TABLE application (
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

CREATE TABLE politique_acces (
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

CREATE TABLE domaine_autorise (
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

CREATE TABLE evenement_audit (
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

CREATE TABLE configuration_portail (
  cle               VARCHAR(100)  NOT NULL,
  valeur            VARCHAR(2000) NOT NULL DEFAULT '',
  description       VARCHAR(300)  NOT NULL DEFAULT '',
  date_modification DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  modifie_par       VARCHAR(150)  NOT NULL,
  PRIMARY KEY (cle)
) ENGINE=InnoDB;

-- Journal d'audit append-only : aucune modification ni suppression applicative.
CREATE TRIGGER trg_evenement_audit_no_update
BEFORE UPDATE ON evenement_audit
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'evenement_audit est append-only : UPDATE interdit';
END;

CREATE TRIGGER trg_evenement_audit_no_delete
BEFORE DELETE ON evenement_audit
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'evenement_audit est append-only : DELETE interdit';
END;
