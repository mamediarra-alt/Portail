package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.StatutApplication;
import gouv.ministere.portail.service.CommandeApplication;
import gouv.ministere.portail.service.ContexteAudit;
import gouv.ministere.portail.service.ServiceAdministrationCatalogue;
import gouv.ministere.portail.security.UtilisateurCourant;
import gouv.ministere.portail.web.RequeteContexte;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** UC07 — administration des applications du catalogue. Réservé au rôle ADMIN_PORTAIL. */
@RestController
@RequestMapping("/api/admin/applications")
@PreAuthorize("hasRole('ADMIN_PORTAIL')")
public class AdminApplicationController {

    private final ServiceAdministrationCatalogue administration;
    private final UtilisateurCourant utilisateurCourant;

    public AdminApplicationController(ServiceAdministrationCatalogue administration,
                                     UtilisateurCourant utilisateurCourant) {
        this.administration = administration;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping
    public List<ReponseApplication> lister() {
        return administration.listerApplications().stream().map(ReponseApplication::depuis).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReponseApplication creer(@Valid @RequestBody RequeteApplication req, HttpServletRequest http) {
        ContexteAudit ctx = RequeteContexte.contexte(http);
        Application a = administration.creerApplication(req.versCommande(), utilisateurCourant.obtenir(), ctx);
        return ReponseApplication.depuis(a);
    }

    @PutMapping("/{code}")
    public ReponseApplication modifier(@PathVariable String code, @Valid @RequestBody RequeteApplication req,
                                       HttpServletRequest http) {
        ContexteAudit ctx = RequeteContexte.contexte(http);
        Application a = administration.modifierApplication(code, req.versCommande(),
            utilisateurCourant.obtenir(), ctx);
        return ReponseApplication.depuis(a);
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archiver(@PathVariable String code, HttpServletRequest http) {
        administration.archiverApplication(code, utilisateurCourant.obtenir(),
            RequeteContexte.contexte(http));
    }

    // --- DTO -------------------------------------------------------------

    public record RequeteApplication(
            @Size(max = 60) String code,
            @NotBlank @Size(max = 150) String nom,
            @Size(max = 1000) String description,
            @NotBlank @Size(max = 2048) @Pattern(regexp = "^https://.+") String urlAcces,
            @Size(max = 2048) String urlIcone,
            String categorieCode,
            @NotNull StatutApplication statut,
            int ordreAffichage,
            boolean ouvrirNouvelOnglet,
            boolean sensible) {

        CommandeApplication versCommande() {
            return new CommandeApplication(code, nom, description == null ? "" : description,
                urlAcces, urlIcone, categorieCode, statut, ordreAffichage, ouvrirNouvelOnglet, sensible);
        }
    }

    public record ReponseApplication(
            String code, String nom, String description, String urlAcces, String urlIcone,
            String categorieCode, StatutApplication statut, int ordreAffichage,
            boolean ouvrirNouvelOnglet, boolean sensible, boolean archivee, Instant dateModification) {

        static ReponseApplication depuis(Application a) {
            return new ReponseApplication(
                a.getCode(), a.getNom(), a.getDescription(), a.getUrlAcces(), a.getUrlIcone(),
                a.getCategorie() != null ? a.getCategorie().getCode() : null,
                a.getStatut(), a.getOrdreAffichage(), a.isOuvrirNouvelOnglet(),
                a.isSensible(), a.isArchivee(), a.getDateModification());
        }
    }
}
