package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.domain.CategorieApplication;
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

/** UC08 — administration des catégories d'applications. */
@RestController
@RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN_PORTAIL')")
public class AdminCategorieController {

    private final ServiceAdministrationCatalogue administration;
    private final UtilisateurCourant utilisateurCourant;

    public AdminCategorieController(ServiceAdministrationCatalogue administration,
                                   UtilisateurCourant utilisateurCourant) {
        this.administration = administration;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping
    public List<ReponseCategorie> lister() {
        return administration.listerCategories().stream().map(ReponseCategorie::depuis).toList();
    }

    @PutMapping
    public ReponseCategorie enregistrer(@Valid @RequestBody RequeteCategorie req, HttpServletRequest http) {
        CategorieApplication c = administration.enregistrerCategorie(
            req.code(), req.libelle(), req.ordreAffichage(),
            utilisateurCourant.obtenir(), RequeteContexte.contexte(http));
        return ReponseCategorie.depuis(c);
    }

    public record RequeteCategorie(
            @NotBlank @Pattern(regexp = "^[A-Z0-9_]{2,50}$") String code,
            @NotBlank @Size(max = 150) String libelle,
            int ordreAffichage) {
    }

    public record ReponseCategorie(String code, String libelle, int ordreAffichage) {
        static ReponseCategorie depuis(CategorieApplication c) {
            return new ReponseCategorie(c.getCode(), c.getLibelle(), c.getOrdreAffichage());
        }
    }
}
