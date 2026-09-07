package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.domain.EffetPolitique;
import gouv.ministere.portail.domain.PolitiqueAcces;
import gouv.ministere.portail.domain.StatutValidationPolitique;
import gouv.ministere.portail.domain.TypeReglePolitique;
import gouv.ministere.portail.service.CommandePolitique;
import gouv.ministere.portail.service.DecisionAcces;
import gouv.ministere.portail.service.ServicePolitiqueAcces;
import gouv.ministere.portail.security.UtilisateurCourant;
import gouv.ministere.portail.web.RequeteContexte;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** UC09 — gestion des politiques d'accès et workflow de validation (« quatre yeux »). */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN_PORTAIL')")
public class AdminPolitiqueController {

    private final ServicePolitiqueAcces service;
    private final UtilisateurCourant utilisateurCourant;

    public AdminPolitiqueController(ServicePolitiqueAcces service, UtilisateurCourant utilisateurCourant) {
        this.service = service;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping("/applications/{code}/politiques")
    public List<ReponsePolitique> lister(@PathVariable String code) {
        return service.listerPourApplication(code).stream().map(ReponsePolitique::depuis).toList();
    }

    @GetMapping("/politiques-en-attente")
    public List<ServicePolitiqueAcces.PolitiqueEnAttente> enAttente() {
        return service.listerEnAttente();
    }

    @GetMapping("/acces-a-recertifier")
    public List<ServicePolitiqueAcces.AccesARecertifier> aRecertifier() {
        return service.listerARecertifier();
    }

    @PostMapping("/politiques/{id}/recertification")
    public void recertifier(@PathVariable Long id, HttpServletRequest http) {
        service.recertifier(id, utilisateurCourant.obtenir(), RequeteContexte.contexte(http));
    }

    @PostMapping("/politiques/{id}/revocation")
    public void revoquer(@PathVariable Long id, HttpServletRequest http) {
        service.revoquer(id, utilisateurCourant.obtenir(), RequeteContexte.contexte(http));
    }

    @PostMapping("/applications/{code}/politiques")
    public ResponseEntity<ReponsePolitique> ajouter(@PathVariable String code,
                                                    @Valid @RequestBody RequetePolitique req,
                                                    HttpServletRequest http) {
        PolitiqueAcces p = service.ajouter(code,
            new CommandePolitique(req.typeRegle(), req.valeur(), req.effet()),
            utilisateurCourant.obtenir(), RequeteContexte.contexte(http));
        HttpStatus statut = p.getStatutValidation() == StatutValidationPolitique.EN_ATTENTE_APPROBATION
            ? HttpStatus.ACCEPTED : HttpStatus.CREATED;
        return ResponseEntity.status(statut).body(ReponsePolitique.depuis(p));
    }

    @PostMapping("/politiques/{id}/approbation")
    public ReponsePolitique approuver(@PathVariable Long id, HttpServletRequest http) {
        return ReponsePolitique.depuis(
            service.approuver(id, utilisateurCourant.obtenir(), RequeteContexte.contexte(http)));
    }

    @PostMapping("/politiques/{id}/rejet")
    public ReponsePolitique rejeter(@PathVariable Long id, @Valid @RequestBody RequeteRejet req,
                                    HttpServletRequest http) {
        return ReponsePolitique.depuis(
            service.rejeter(id, req.motif(), utilisateurCourant.obtenir(), RequeteContexte.contexte(http)));
    }

    @PostMapping("/applications/{code}/simulation")
    public ReponseSimulation simuler(@PathVariable String code, @RequestBody RequeteSimulation req) {
        DecisionAcces d = service.simuler(code, req.roles(), req.groupes(), req.origine());
        return new ReponseSimulation(
            d.autorise(),
            d.applicationBloquee(),
            d.motif() != null ? d.motif().name() : null);
    }

    public record RequeteSimulation(
            java.util.List<String> roles, java.util.List<String> groupes, String origine) {
    }

    public record ReponseSimulation(boolean autorise, boolean applicationBloquee, String motif) {
    }

    public record RequetePolitique(
            @NotNull TypeReglePolitique typeRegle,
            @Size(max = 150) String valeur,
            @NotNull EffetPolitique effet) {
    }

    public record RequeteRejet(@Size(max = 500) String motif) {
    }

    public record ReponsePolitique(
            Long id, TypeReglePolitique typeRegle, String valeur, EffetPolitique effet,
            boolean actif, StatutValidationPolitique statutValidation,
            String demandeePar, String approuveePar, Instant dateDecision) {

        static ReponsePolitique depuis(PolitiqueAcces p) {
            return new ReponsePolitique(p.getId(), p.getTypeRegle(), p.getValeur(), p.getEffet(),
                p.isActif(), p.getStatutValidation(), p.getDemandeePar(), p.getApprouveePar(),
                p.getDateDecision());
        }
    }
}
