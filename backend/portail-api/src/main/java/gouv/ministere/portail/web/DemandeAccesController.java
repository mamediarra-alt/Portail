package gouv.ministere.portail.web;

import gouv.ministere.portail.domain.DemandeAcces;
import gouv.ministere.portail.service.ServiceDemandeAcces;
import gouv.ministere.portail.security.UtilisateurCourant;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Demande d'accès self-service pour l'agent connecté. */
@RestController
@RequestMapping("/api/demandes")
public class DemandeAccesController {

    private final ServiceDemandeAcces service;
    private final UtilisateurCourant utilisateurCourant;

    public DemandeAccesController(ServiceDemandeAcces service, UtilisateurCourant utilisateurCourant) {
        this.service = service;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping("/miennes")
    public List<ReponseDemande> miennes() {
        return service.miennes(utilisateurCourant.obtenir().sujet()).stream()
            .map(ReponseDemande::depuis).toList();
    }

    @PostMapping
    public ReponseDemande creer(@Valid @RequestBody RequeteDemande req, HttpServletRequest http) {
        DemandeAcces d = service.creer(req.applicationCode(), req.motif(),
            utilisateurCourant.obtenir(), RequeteContexte.contexte(http));
        return ReponseDemande.depuis(d);
    }

    public record RequeteDemande(
            @NotBlank String applicationCode, @Size(max = 1000) String motif) {
    }

    public record ReponseDemande(
            Long id, String applicationCode, String applicationNom, String statut,
            String motif, Instant dateDemande, Instant dateDecision, String commentaireDecision) {

        static ReponseDemande depuis(DemandeAcces d) {
            return new ReponseDemande(d.getId(), d.getApplicationCode(), d.getApplicationNom(),
                d.getStatut().name(), d.getMotif(), d.getDateDemande(), d.getDateDecision(),
                d.getCommentaireDecision());
        }
    }
}
