package gouv.ministere.portail.domain;

/**
 * Motif interne d'un refus d'accès. N'est <strong>jamais</strong> renvoyé tel quel
 * à l'utilisateur : il sert uniquement à l'audit et au choix du code HTTP.
 */
public enum MotifRefus {
    NON_AUTHENTIFIE,
    APPLICATION_MASQUEE,
    APPLICATION_ARCHIVEE,
    APPLICATION_INDISPONIBLE,
    POLITIQUE_REFUS,
    AUCUNE_POLITIQUE_AUTORISANTE,
    URL_NON_CONFORME
}
