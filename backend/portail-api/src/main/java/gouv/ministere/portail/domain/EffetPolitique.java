package gouv.ministere.portail.domain;

/** Effet d'une politique d'accès. Un {@code REFUSER} l'emporte toujours sur un {@code AUTORISER}. */
public enum EffetPolitique {
    AUTORISER,
    REFUSER
}
