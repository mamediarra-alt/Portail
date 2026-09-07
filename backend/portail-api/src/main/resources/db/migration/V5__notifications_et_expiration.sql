-- Notifications personnelles + expiration des accès nominatifs (re-certification).

CREATE TABLE notification (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  destinataire_sujet VARCHAR(150) NOT NULL,
  titre              VARCHAR(150) NOT NULL,
  corps              VARCHAR(600) NOT NULL DEFAULT '',
  type               VARCHAR(10)  NOT NULL DEFAULT 'INFO',
  lien               VARCHAR(300) NULL,
  lue                TINYINT(1)   NOT NULL DEFAULT 0,
  date_creation      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT ck_notification_type CHECK (type IN ('INFO','SUCCES','ALERTE')),
  KEY ix_notification_dest (destinataire_sujet, lue, date_creation)
) ENGINE=InnoDB;

ALTER TABLE politique_acces ADD COLUMN date_expiration DATETIME(6) NULL AFTER commentaire_decision;
CREATE INDEX ix_politique_expiration ON politique_acces (date_expiration);
