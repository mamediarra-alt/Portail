package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.MotifRefus;

/**
 * Résultat de l'évaluation d'une demande d'accès.
 *
 * @param autorise           l'utilisateur peut accéder
 * @param motif              motif du refus (null si autorisé), pour l'audit uniquement
 * @param applicationBloquee autorisé mais accès bloqué par le statut (maintenance / indisponibilité)
 */
public record DecisionAcces(boolean autorise, MotifRefus motif, boolean applicationBloquee) {

    public static DecisionAcces autorisee() {
        return new DecisionAcces(true, null, false);
    }

    public static DecisionAcces bloqueeParStatut() {
        return new DecisionAcces(true, MotifRefus.APPLICATION_INDISPONIBLE, true);
    }

    public static DecisionAcces refusee(MotifRefus motif) {
        return new DecisionAcces(false, motif, false);
    }
}
