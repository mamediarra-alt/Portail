package gouv.ministere.portail.domain;

/**
 * Actions journalisées. Ensemble volontairement ouvert (stocké en {@code VARCHAR}),
 * cette énumération n'en fixe que les valeurs connues.
 */
public enum ActionAudit {
    CONNEXION,
    DECONNEXION,
    CONSULTATION_CATALOGUE,
    CONSULTATION_APPLICATION,
    ACCES_APPLICATION_AUTORISE,
    ACCES_APPLICATION_REFUSE,
    ADMIN_APPLICATION_CREEE,
    ADMIN_APPLICATION_MODIFIEE,
    ADMIN_APPLICATION_ARCHIVEE,
    ADMIN_CATEGORIE_MODIFIEE,
    ADMIN_POLITIQUE_MODIFIEE,
    ADMIN_POLITIQUE_APPROUVEE,
    ADMIN_DOMAINE_MODIFIE,
    ADMIN_CONFIG_MODIFIEE,
    EXPORT_AUDIT,
    ERREUR
}
