package gouv.ministere.portail.error;

/** Donnée fonctionnellement invalide (au-delà des contraintes de format Bean Validation). */
public class ValidationMetierException extends RuntimeException {

    public ValidationMetierException(String message) {
        super(message);
    }
}
