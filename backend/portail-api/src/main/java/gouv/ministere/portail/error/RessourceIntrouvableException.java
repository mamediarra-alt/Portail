package gouv.ministere.portail.error;

/** La ressource demandée n'existe pas, ou l'utilisateur n'a pas le droit d'en connaître l'existence. */
public class RessourceIntrouvableException extends RuntimeException {

    public RessourceIntrouvableException(String message) {
        super(message);
    }
}
