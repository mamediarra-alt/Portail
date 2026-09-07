package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.error.AccesRefuseException;
import gouv.ministere.portail.error.ApplicationIndisponibleException;
import gouv.ministere.portail.error.ConfigurationInvalideException;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.repository.ApplicationRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cas d'utilisation UC05 — Accéder à une application : contrôle d'accès, validation de l'URL
 * cible, journalisation, puis renvoi de l'URL de redirection.
 */
@Service
public class ServiceAcces {

    private final ApplicationRepository applications;
    private final ServiceControleAcces controleAcces;
    private final ValidateurUrlCible validateurUrl;
    private final ServiceAudit audit;

    public ServiceAcces(ApplicationRepository applications, ServiceControleAcces controleAcces,
                        ValidateurUrlCible validateurUrl, ServiceAudit audit) {
        this.applications = applications;
        this.controleAcces = controleAcces;
        this.validateurUrl = validateurUrl;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public ResultatRedirection preparerRedirection(String code, IdentiteUtilisateur u, ContexteAudit ctx) {
        Application app = applications.findByCode(code)
            .filter(a -> !a.isArchivee())
            .orElseThrow(() -> new RessourceIntrouvableException("Application introuvable"));

        DecisionAcces decision = controleAcces.evaluer(u, app);

        if (!decision.autorise()) {
            audit.journaliser(u, ActionAudit.ACCES_APPLICATION_REFUSE, ResultatAudit.ECHEC,
                app.getCode(), ctx, "{\"motif\":\"" + decision.motif() + "\"}");
            throw new AccesRefuseException(decision.motif());
        }

        if (decision.applicationBloquee()) {
            audit.journaliser(u, ActionAudit.ACCES_APPLICATION_REFUSE, ResultatAudit.ECHEC,
                app.getCode(), ctx, "{\"motif\":\"STATUT_" + app.getStatut() + "\"}");
            throw new ApplicationIndisponibleException("Application momentanément indisponible");
        }

        if (!validateurUrl.estAutorisee(app.getUrlAcces())) {
            audit.journaliser(u, ActionAudit.ERREUR, ResultatAudit.ECHEC, app.getCode(), ctx,
                "{\"motif\":\"URL_ACCES_INVALIDE\"}");
            throw new ConfigurationInvalideException("Accès indisponible");
        }

        audit.journaliser(u, ActionAudit.ACCES_APPLICATION_AUTORISE, ResultatAudit.SUCCES,
            app.getCode(), ctx, null);
        return new ResultatRedirection(app.getUrlAcces(), app.isOuvrirNouvelOnglet());
    }
}
