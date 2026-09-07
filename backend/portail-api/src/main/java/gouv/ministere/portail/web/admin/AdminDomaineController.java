package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.domain.DomaineAutorise;
import gouv.ministere.portail.service.ServiceAdministrationCatalogue;
import gouv.ministere.portail.security.UtilisateurCourant;
import gouv.ministere.portail.web.RequeteContexte;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Administration de la liste blanche des domaines de redirection (support de RG08). */
@RestController
@RequestMapping("/api/admin/domaines-autorises")
@PreAuthorize("hasRole('ADMIN_PORTAIL')")
public class AdminDomaineController {

    private final ServiceAdministrationCatalogue administration;
    private final UtilisateurCourant utilisateurCourant;

    public AdminDomaineController(ServiceAdministrationCatalogue administration,
                                 UtilisateurCourant utilisateurCourant) {
        this.administration = administration;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping
    public List<ReponseDomaine> lister() {
        return administration.listerDomaines().stream().map(ReponseDomaine::depuis).toList();
    }

    @PutMapping
    public ReponseDomaine enregistrer(@Valid @RequestBody RequeteDomaine req, HttpServletRequest http) {
        DomaineAutorise d = administration.enregistrerDomaine(
            req.domaine().toLowerCase(), req.description() == null ? "" : req.description(), req.actif(),
            utilisateurCourant.obtenir(), RequeteContexte.contexte(http));
        return ReponseDomaine.depuis(d);
    }

    public record RequeteDomaine(
            @NotBlank @Pattern(regexp = "^[a-z0-9.-]+\\.[a-z]{2,}$") String domaine,
            @Size(max = 300) String description,
            boolean actif) {
    }

    public record ReponseDomaine(String domaine, String description, boolean actif) {
        static ReponseDomaine depuis(DomaineAutorise d) {
            return new ReponseDomaine(d.getDomaine(), d.getDescription(), d.isActif());
        }
    }
}
