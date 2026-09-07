package gouv.ministere.portail.domain;

/** Nature d'une règle de politique d'accès de niveau portail. */
public enum TypeReglePolitique {
    /** La valeur est un rôle realm Keycloak attendu dans le jeton. */
    ROLE_REQUIS,
    /** La valeur est un groupe attendu dans le jeton. */
    GROUPE_REQUIS,
    /** La valeur est une origine (application d'appartenance) attendue dans le jeton. */
    ORIGINE_REQUISE,
    /** La valeur est l'identifiant ({@code sub}) d'un utilisateur précis (accès nominatif). */
    UTILISATEUR_REQUIS,
    /** Aucune valeur : la règle s'applique à tout utilisateur authentifié. */
    OUVERT_A_TOUS
}
