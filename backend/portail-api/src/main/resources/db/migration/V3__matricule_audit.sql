-- Ajout du matricule de l'agent dans le journal d'audit.
ALTER TABLE evenement_audit
  ADD COLUMN matricule VARCHAR(50) NULL AFTER sujet_utilisateur;

CREATE INDEX ix_audit_matricule ON evenement_audit (matricule, horodatage);
