package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.ConfigurationPortail;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.error.ValidationMetierException;
import gouv.ministere.portail.repository.ConfigurationPortailRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cas d'utilisation UC10 — Configurer le portail (paramètres clé / valeur). */
@Service
public class ServiceConfiguration {

    private final ConfigurationPortailRepository depot;
    private final ServiceAudit audit;

    public ServiceConfiguration(ConfigurationPortailRepository depot, ServiceAudit audit) {
        this.depot = depot;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<ConfigurationPortail> lireTout() {
        return depot.findAll();
    }

    @Transactional(readOnly = true)
    public ConfigurationPortail lire(String cle) {
        return depot.findById(cle)
            .orElseThrow(() -> new RessourceIntrouvableException("Clé de configuration inconnue"));
    }

    @Transactional
    public ConfigurationPortail mettreAJour(String cle, String valeur, IdentiteUtilisateur u,
                                            ContexteAudit ctx) {
        ConfigurationPortail c = depot.findById(cle)
            .orElseThrow(() -> new RessourceIntrouvableException("Clé de configuration inconnue"));
        if (valeur != null && contientHtmlActif(valeur)) {
            throw new ValidationMetierException("La valeur ne doit pas contenir de balise active");
        }
        c.setValeur(valeur);
        c.setModifiePar(u.sujet());
        c.setDateModification(Instant.now());
        ConfigurationPortail enregistre = depot.save(c);
        audit.journaliser(u, ActionAudit.ADMIN_CONFIG_MODIFIEE, ResultatAudit.SUCCES, null, ctx,
            "{\"cle\":\"" + cle + "\"}");
        return enregistre;
    }

    private static boolean contientHtmlActif(String v) {
        String s = v.toLowerCase();
        return s.contains("<script") || s.contains("javascript:") || s.contains("onerror=")
            || s.contains("<iframe");
    }
}
