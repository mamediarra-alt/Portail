package gouv.ministere.portail.web;

import gouv.ministere.portail.domain.Notification;
import gouv.ministere.portail.service.ServiceNotification;
import gouv.ministere.portail.security.UtilisateurCourant;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Notifications de l'utilisateur connecté. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final ServiceNotification service;
    private final UtilisateurCourant utilisateurCourant;

    public NotificationController(ServiceNotification service, UtilisateurCourant utilisateurCourant) {
        this.service = service;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping
    public List<ItemNotification> lister() {
        return service.pour(utilisateurCourant.obtenir().sujet()).stream()
            .map(ItemNotification::depuis).toList();
    }

    @GetMapping("/compteur")
    public Map<String, Long> compteur() {
        return Map.of("nonLues", service.compteNonLues(utilisateurCourant.obtenir().sujet()));
    }

    @PostMapping("/{id}/lue")
    public ResponseEntity<Void> marquerLue(@PathVariable Long id) {
        service.marquerLue(id, utilisateurCourant.obtenir().sujet());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tout-lu")
    public ResponseEntity<Void> toutLu() {
        service.marquerToutesLues(utilisateurCourant.obtenir().sujet());
        return ResponseEntity.noContent().build();
    }

    public record ItemNotification(
            Long id, String titre, String corps, String type, String lien, boolean lue,
            Instant dateCreation) {

        static ItemNotification depuis(Notification n) {
            return new ItemNotification(n.getId(), n.getTitre(), n.getCorps(), n.getType().name(),
                n.getLien(), n.isLue(), n.getDateCreation());
        }
    }
}
