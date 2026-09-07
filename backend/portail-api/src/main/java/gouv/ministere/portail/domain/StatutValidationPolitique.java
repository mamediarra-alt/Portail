package gouv.ministere.portail.domain;

/** Étape du workflow de validation d'une politique d'accès (double validation — applications sensibles). */
public enum StatutValidationPolitique {
    /** Activée sans approbation (application non sensible). */
    ACTIVE_DIRECTE,
    /** Créée par un administrateur, en attente d'un second. */
    EN_ATTENTE_APPROBATION,
    /** Approuvée par un second administrateur ; prise en compte dans l'évaluation. */
    APPROUVEE,
    /** Rejetée ; ignorée dans l'évaluation. */
    REJETEE
}
