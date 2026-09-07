package gouv.ministere.portail.web;

import gouv.ministere.portail.repository.ApplicationRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** État de disponibilité des composants du portail et des applications. */
@RestController
@RequestMapping("/api/etat-services")
public class EtatServicesController {

    private final ApplicationRepository applications;

    public EtatServicesController(ApplicationRepository applications) {
        this.applications = applications;
    }

    public record Service(String nom, String type, String etat, String detail) {
    }

    public record EtatGlobal(Instant verifieLe, List<Service> composants, List<Service> applications) {
    }

    @GetMapping
    public EtatGlobal etat() {
        List<Service> composants = List.of(
            new Service("API du portail", "COMPOSANT", "OPERATIONNEL", "répond normalement"),
            new Service("Base de données", "COMPOSANT", verifierBase(), "portail_db"),
            new Service("Service d'identité", "COMPOSANT", "OPERATIONNEL", "Keycloak — realm ministere"));

        List<Service> apps = new ArrayList<>();
        applications.listerPourAdministration().forEach(a -> {
            String etat = switch (a.getStatut()) {
                case ACTIVE -> "OPERATIONNEL";
                case MAINTENANCE -> "MAINTENANCE";
                case INDISPONIBLE -> "INDISPONIBLE";
                case MASQUEE -> "MASQUEE";
            };
            apps.add(new Service(a.getNom(), "APPLICATION", etat, a.getCode()));
        });

        return new EtatGlobal(Instant.now(), composants, apps);
    }

    private String verifierBase() {
        try {
            applications.count();
            return "OPERATIONNEL";
        } catch (RuntimeException e) {
            return "INDISPONIBLE";
        }
    }
}
