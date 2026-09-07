package gouv.ministere.portail.web.admin;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.EvenementAudit;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.service.ServiceAudit;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * UC11 — consultation du journal d'audit. Réservé aux rôles AUDITEUR_PORTAIL / ADMIN_PORTAIL.
 * Lecture seule ; aucune écriture ni suppression n'est exposée.
 */
@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasAnyRole('AUDITEUR_PORTAIL','ADMIN_PORTAIL')")
public class AdminAuditController {

    private static final int TAILLE_MAX = 200;

    private final ServiceAudit audit;

    public AdminAuditController(ServiceAudit audit) {
        this.audit = audit;
    }

    @GetMapping
    public PageAudit rechercher(
            @RequestParam(required = false) String sujet,
            @RequestParam(required = false) ActionAudit action,
            @RequestParam(required = false) String applicationCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int taille) {

        int t = Math.min(Math.max(taille, 1), TAILLE_MAX);
        Page<EvenementAudit> resultat = audit.rechercher(
            vide(sujet), action, vide(applicationCode), debut, fin, PageRequest.of(Math.max(page, 0), t));
        return new PageAudit(
            resultat.getContent().stream().map(ItemAudit::depuis).toList(),
            resultat.getNumber(), resultat.getSize(), resultat.getTotalElements());
    }

    private static String vide(String v) {
        return (v == null || v.isBlank()) ? null : v;
    }

    public record PageAudit(List<ItemAudit> contenu, int page, int taille, long total) {
    }

    public record ItemAudit(
            Long id, Instant horodatage, String sujetUtilisateur, String matricule,
            String nomUtilisateur, String action, String applicationCode, ResultatAudit resultat,
            String adresseIp, String identifiantCorrelation) {

        static ItemAudit depuis(EvenementAudit e) {
            return new ItemAudit(e.getId(), e.getHorodatage(), e.getSujetUtilisateur(),
                e.getMatricule(), e.getNomUtilisateur(), e.getAction(), e.getApplicationCode(),
                e.getResultat(), e.getAdresseIp(), e.getIdentifiantCorrelation());
        }
    }
}
