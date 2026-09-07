package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.CategorieApplication;
import gouv.ministere.portail.domain.StatutApplication;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.repository.ApplicationRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cas d'utilisation UC03 (catalogue filtré) et UC04 (détail d'une application). */
@Service
public class ServiceCatalogue {

    private final ApplicationRepository applications;
    private final ServiceControleAcces controleAcces;

    public ServiceCatalogue(ApplicationRepository applications, ServiceControleAcces controleAcces) {
        this.applications = applications;
        this.controleAcces = controleAcces;
    }

    /** Applications visibles par l'utilisateur (autorisées, y compris celles au statut bloqué). */
    @Transactional(readOnly = true)
    public List<Application> listerApplicationsVisibles(IdentiteUtilisateur u) {
        return applications.listerCandidatesCatalogue(StatutApplication.MASQUEE).stream()
            .filter(app -> controleAcces.evaluer(u, app).autorise())
            .sorted(Comparator
                .comparingInt(ServiceCatalogue::ordreCategorie)
                .thenComparingInt(Application::getOrdreAffichage)
                .thenComparing(Application::getNom))
            .toList();
    }

    /** Applications non masquées auxquelles l'utilisateur n'a pas accès : il peut en faire la demande. */
    @Transactional(readOnly = true)
    public List<Application> listerDemandables(IdentiteUtilisateur u) {
        return applications.listerCandidatesCatalogue(StatutApplication.MASQUEE).stream()
            .filter(app -> !controleAcces.evaluer(u, app).autorise())
            .sorted(Comparator.comparingInt(Application::getOrdreAffichage).thenComparing(Application::getNom))
            .toList();
    }

    /** Détail d'une application, avec revérification de visibilité (404 indifférencié sinon). */
    @Transactional(readOnly = true)
    public Application obtenirDetail(String code, IdentiteUtilisateur u) {
        Application app = applications.findByCode(code)
            .filter(a -> !a.isArchivee() && !a.estMasquee())
            .orElseThrow(() -> new RessourceIntrouvableException("Application introuvable"));
        if (!controleAcces.evaluer(u, app).autorise()) {
            throw new RessourceIntrouvableException("Application introuvable");
        }
        return app;
    }

    private static int ordreCategorie(Application app) {
        CategorieApplication c = app.getCategorie();
        return c != null ? c.getOrdreAffichage() : Integer.MAX_VALUE;
    }
}
