package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.domain.ConfigurationPortail;
import gouv.ministere.portail.service.ServiceConfiguration;
import gouv.ministere.portail.security.UtilisateurCourant;
import gouv.ministere.portail.web.RequeteContexte;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** UC10 — configuration du portail. */
@RestController
@RequestMapping("/api/admin/config")
@PreAuthorize("hasRole('ADMIN_PORTAIL')")
public class AdminConfigurationController {

    private final ServiceConfiguration configuration;
    private final UtilisateurCourant utilisateurCourant;

    public AdminConfigurationController(ServiceConfiguration configuration,
                                       UtilisateurCourant utilisateurCourant) {
        this.configuration = configuration;
        this.utilisateurCourant = utilisateurCourant;
    }

    @PutMapping("/{cle}")
    public ReponseConfig mettreAJour(@PathVariable String cle, @Valid @RequestBody RequeteConfig req,
                                     HttpServletRequest http) {
        ConfigurationPortail c = configuration.mettreAJour(cle, req.valeur(),
            utilisateurCourant.obtenir(), RequeteContexte.contexte(http));
        return new ReponseConfig(c.getCle(), c.getValeur(), c.getDescription());
    }

    public record RequeteConfig(@Size(max = 2000) String valeur) {
    }

    public record ReponseConfig(String cle, String valeur, String description) {
    }
}
