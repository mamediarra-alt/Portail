-- Demande d'accès self-service + accès nominatif (politique UTILISATEUR_REQUIS).

-- 1) Élargir type_regle pour accepter UTILISATEUR_REQUIS.
--    Selon l'historique, la colonne est un ENUM ou un VARCHAR + CONTRAINTE CHECK.
ALTER TABLE politique_acces MODIFY COLUMN type_regle VARCHAR(20) NOT NULL;

SET @existe := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'politique_acces'
                  AND CONSTRAINT_NAME = 'ck_politique_type');
SET @sql := IF(@existe > 0,
               'ALTER TABLE politique_acces DROP CHECK ck_politique_type',
               'DO 0');
PREPARE st FROM @sql;
EXECUTE st;
DEALLOCATE PREPARE st;

ALTER TABLE politique_acces ADD CONSTRAINT ck_politique_type
  CHECK (type_regle IN ('ROLE_REQUIS','GROUPE_REQUIS','ORIGINE_REQUISE','UTILISATEUR_REQUIS','OUVERT_A_TOUS'));

-- 2) Table des demandes d'accès.
CREATE TABLE demande_acces (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  application_code     VARCHAR(50)  NOT NULL,
  application_nom      VARCHAR(150) NOT NULL,
  demandeur_sujet      VARCHAR(150) NOT NULL,
  demandeur_matricule  VARCHAR(50)  NULL,
  demandeur_nom        VARCHAR(200) NULL,
  motif                VARCHAR(1000) NOT NULL DEFAULT '',
  statut               VARCHAR(12)  NOT NULL DEFAULT 'EN_ATTENTE',
  traitee_par          VARCHAR(150) NULL,
  date_demande         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  date_decision        DATETIME(6)  NULL,
  commentaire_decision VARCHAR(500) NULL,
  PRIMARY KEY (id),
  CONSTRAINT ck_demande_statut CHECK (statut IN ('EN_ATTENTE','APPROUVEE','REFUSEE')),
  KEY ix_demande_demandeur (demandeur_sujet, date_demande),
  KEY ix_demande_statut (statut, date_demande)
) ENGINE=InnoDB;
