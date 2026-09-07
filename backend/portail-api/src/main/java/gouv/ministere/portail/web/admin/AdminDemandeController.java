package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.domain.DemandeAcces;
import gouv.ministere.portail.service.ServiceDemandeAcces;
import gouv.ministere.portail.security.UtilisateurCourant;
import gouv.ministere.portail.web.RequeteContexte;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Traitement des demandes d'accès par un administrateur. */
@RestController
@RequestMapping("/api/admin/demandes-acces")
@PreAuthorize("hasRole('ADMIN_PORTAIL')")
public class AdminDemandeController {

    private final ServiceDemandeAcces service;
    private final UtilisateurCourant utilisateurCourant;

    public AdminDemandeController(ServiceDemandeAcces service, UtilisateurCourant utilisateurCourant) {
        this.service = service;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping
    public List<ReponseDemandeAdmin> enAttente() {
        return service.enAttente().stream().map(ReponseDemandeAdmin::depuis).toList();
    }

    @PostMapping("/{id}/approbation")
    public ReponseDemandeAdmin approuver(@PathVariable Long id, HttpServletRequest http) {
        return ReponseDemandeAdmin.depuis(
            service.approuver(id, utilisateurCourant.obtenir(), RequeteContexte.contexte(http)));
    }

    @PostMapping("/{id}/refus")
    public ReponseDemandeAdmin refuser(@PathVariable Long id, @RequestBody RequeteRefus req,
                                       HttpServletRequest http) {
        return ReponseDemandeAdmin.depuis(
            service.refuser(id, req.motif(), utilisateurCourant.obtenir(), RequeteContexte.contexte(http)));
    }

    public record RequeteRefus(@Size(max = 500) String motif) {
    }

    public record ReponseDemandeAdmin(
            Long id, String applicationCode, String applicationNom,
            String demandeurMatricule, String demandeurNom, String motif,
            String statut, Instant dateDemande) {

        static ReponseDemandeAdmin depuis(DemandeAcces d) {
            return new ReponseDemandeAdmin(d.getId(), d.getApplicationCode(), d.getApplicationNom(),
                d.getDemandeurMatricule(), d.getDemandeurNom(), d.getMotif(),
                d.getStatut().name(), d.getDateDemande());
        }
    }
}
