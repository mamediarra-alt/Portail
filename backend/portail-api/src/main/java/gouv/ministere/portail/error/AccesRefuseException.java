package gouv.ministere.portail.error;

import gouv.ministere.portail.domain.MotifRefus;

/**
 * L'utilisateur n'est pas autorisé à accéder à l'application. Le {@link MotifRefus}
 * est destiné à l'audit ; le message exposé au client reste neutre.
 */
public class AccesRefuseException extends RuntimeException {

    private final transient MotifRefus motif;

    public AccesRefuseException(MotifRefus motif) {
        super("Accès non autorisé");
        this.motif = motif;
    }

    public MotifRefus getMotif() {
        return motif;
    }
}
