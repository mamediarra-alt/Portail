package gouv.ministere.portail.error;

/** L'application est visible mais son accès est bloqué (maintenance / indisponibilité). */
public class ApplicationIndisponibleException extends RuntimeException {

    public ApplicationIndisponibleException(String message) {
        super(message);
    }
}
