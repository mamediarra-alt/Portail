package gouv.ministere.portail.domain;

/** Statut d'une application du catalogue. */
public enum StatutApplication {
    /** Visible et accessible. */
    ACTIVE,
    /** Visible mais accès temporairement bloqué (maintenance planifiée). */
    MAINTENANCE,
    /** Visible mais accès bloqué (indisponibilité subie). */
    INDISPONIBLE,
    /** Jamais présentée à l'utilisateur ; visible uniquement en administration. */
    MASQUEE
}
