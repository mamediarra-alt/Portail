package gouv.ministere.portail.web;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.EvenementAudit;
import gouv.ministere.portail.repository.ApplicationRepository;
import gouv.ministere.portail.repository.EvenementAuditRepository;
import gouv.ministere.portail.security.UtilisateurCourant;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** « Accès récents » de l'utilisateur connecté (à partir du journal d'audit). */
@RestController
@RequestMapping("/api/mes-acces-recents")
public class MesAccesController {

    private final EvenementAuditRepository audit;
    private final ApplicationRepository applications;
    private final UtilisateurCourant utilisateurCourant;

    public MesAccesController(EvenementAuditRepository audit, ApplicationRepository applications,
                              UtilisateurCourant utilisateurCourant) {
        this.audit = audit;
        this.applications = applications;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping
    public List<AccesRecent> mesAcces() {
        String sujet = utilisateurCourant.obtenir().sujet();
        List<EvenementAudit> events = audit
            .findTop30BySujetUtilisateurAndActionOrderByHorodatageDesc(
                sujet, ActionAudit.ACCES_APPLICATION_AUTORISE.name());

        Map<String, Instant> derniere = new LinkedHashMap<>();
        for (EvenementAudit e : events) {
            if (e.getApplicationCode() != null) {
                derniere.putIfAbsent(e.getApplicationCode(), e.getHorodatage());
            }
        }
        return derniere.entrySet().stream()
            .limit(6)
            .map(en -> new AccesRecent(
                en.getKey(),
                applications.findByCode(en.getKey()).map(a -> a.getNom()).orElse(en.getKey()),
                en.getValue()))
            .toList();
    }

    public record AccesRecent(String code, String nom, Instant horodatage) {
    }
}
