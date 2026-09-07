package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.EvenementAudit;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.repository.EvenementAuditRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Journalisation d'audit (append-only) + export vers le puits de logs / SIEM de l'État.
 *
 * <p>L'écriture se fait dans une transaction {@code REQUIRES_NEW} pour qu'un échec
 * fonctionnel (accès refusé, validation) n'annule pas la trace correspondante.
 */
@Service
public class ServiceAudit {

    private static final Logger LOG_SIEM = LoggerFactory.getLogger("AUDIT.SIEM");

    private final EvenementAuditRepository depot;

    public ServiceAudit(EvenementAuditRepository depot) {
        this.depot = depot;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void journaliser(IdentiteUtilisateur u, ActionAudit action, ResultatAudit resultat,
                            String applicationCode, ContexteAudit ctx, String detailJson) {
        EvenementAudit e = EvenementAudit.builder()
            .sujet(u != null ? u.sujet() : null,
                   u != null ? u.matricule() : null,
                   u != null ? u.nom() : null)
            .action(action)
            .resultat(resultat)
            .application(applicationCode)
            .requete(ctx != null ? ctx.adresseIp() : null,
                     ctx != null ? tronquer(ctx.userAgent(), 400) : null,
                     ctx != null ? ctx.correlation() : null)
            .detail(detailJson)
            .build();
        depot.save(e);
        exporterSiem(e);
    }

    @Transactional(readOnly = true)
    public Page<EvenementAudit> rechercher(String sujet, ActionAudit action, String codeApp,
                                           Instant debut, Instant fin, Pageable pageable) {
        return depot.rechercher(sujet, action != null ? action.name() : null, codeApp, debut, fin, pageable);
    }

    private void exporterSiem(EvenementAudit e) {
        // Intégration SIEM réelle (syslog / HTTP) à brancher ; ici, trace structurée.
        LOG_SIEM.info("audit action={} resultat={} sujet={} application={} correlation={}",
            e.getAction(), e.getResultat(), e.getSujetUtilisateur(), e.getApplicationCode(),
            e.getIdentifiantCorrelation());
    }

    private static String tronquer(String v, int max) {
        if (v == null) {
            return null;
        }
        return v.length() <= max ? v : v.substring(0, max);
    }
}
