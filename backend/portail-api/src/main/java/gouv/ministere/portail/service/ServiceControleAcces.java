package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.EffetPolitique;
import gouv.ministere.portail.domain.MotifRefus;
import gouv.ministere.portail.domain.PolitiqueAcces;
import gouv.ministere.portail.repository.PolitiqueAccesRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implémente le cas transverse « Contrôler l'autorisation d'accès ».
 *
 * <p>Ordre d'évaluation : archivage → masquage → politiques {@code REFUSER} (priorité)
 * → politiques {@code AUTORISER} / {@code OUVERT_A_TOUS} → statut de disponibilité.
 * Seules les politiques évaluables (actives et validées) sont prises en compte.
 */
@Service
public class ServiceControleAcces {

    private final PolitiqueAccesRepository politiques;

    public ServiceControleAcces(PolitiqueAccesRepository politiques) {
        this.politiques = politiques;
    }

    @Transactional(readOnly = true)
    public DecisionAcces evaluer(IdentiteUtilisateur u, Application app) {
        if (app.isArchivee()) {
            return DecisionAcces.refusee(MotifRefus.APPLICATION_ARCHIVEE);
        }
        if (app.estMasquee()) {
            return DecisionAcces.refusee(MotifRefus.APPLICATION_MASQUEE);
        }

        List<PolitiqueAcces> evaluables = politiques.findByApplicationIdAndActifTrue(app.getId())
            .stream().filter(PolitiqueAcces::estEvaluable).toList();

        boolean refusExplicite = evaluables.stream()
            .filter(p -> p.getEffet() == EffetPolitique.REFUSER)
            .anyMatch(p -> p.correspondA(u));
        if (refusExplicite) {
            return DecisionAcces.refusee(MotifRefus.POLITIQUE_REFUS);
        }

        boolean autorise = evaluables.stream()
            .filter(p -> p.getEffet() == EffetPolitique.AUTORISER)
            .anyMatch(p -> p.correspondA(u));
        if (!autorise) {
            return DecisionAcces.refusee(MotifRefus.AUCUNE_POLITIQUE_AUTORISANTE);
        }

        if (app.accesBloqueParStatut()) {
            return DecisionAcces.bloqueeParStatut();
        }
        return DecisionAcces.autorisee();
    }
}
