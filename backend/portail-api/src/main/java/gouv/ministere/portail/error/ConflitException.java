package gouv.ministere.portail.error;

/** Conflit d'état : code déjà utilisé, catégorie référencée, approbation par le demandeur, etc. */
public class ConflitException extends RuntimeException {

    public ConflitException(String message) {
        super(message);
    }
}
