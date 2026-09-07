package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.service.ServiceStatistiques;
import gouv.ministere.portail.service.ServiceStatistiques.ApercuConnexions;
import gouv.ministere.portail.service.ServiceStatistiques.Statistiques;
import gouv.ministere.portail.service.ServiceStatistiques.UtilisateurActivite;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tableau de bord d'administration : chiffres clés et tendances. */
@RestController
@RequestMapping("/api/admin/statistiques")
@PreAuthorize("hasAnyRole('AUDITEUR_PORTAIL','ADMIN_PORTAIL')")
public class AdminStatistiquesController {

    private final ServiceStatistiques service;

    public AdminStatistiquesController(ServiceStatistiques service) {
        this.service = service;
    }

    @GetMapping
    public Statistiques statistiques() {
        return service.calculer();
    }

    @GetMapping("/utilisateurs")
    public List<UtilisateurActivite> utilisateurs() {
        return service.activiteUtilisateurs();
    }

    @GetMapping("/connexions")
    public ApercuConnexions connexions() {
        return service.apercuConnexions();
    }
}
