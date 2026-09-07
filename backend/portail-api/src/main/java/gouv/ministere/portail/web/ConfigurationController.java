package gouv.ministere.portail.web;

import gouv.ministere.portail.service.ServiceConfiguration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lecture de la configuration d'affichage du portail (titre, bannière, liens). */
@RestController
@RequestMapping("/api/config")
public class ConfigurationController {

    private final ServiceConfiguration configuration;

    public ConfigurationController(ServiceConfiguration configuration) {
        this.configuration = configuration;
    }

    @GetMapping
    public ResponseEntity<List<ItemConfig>> lire() {
        List<ItemConfig> items = configuration.lireTout().stream()
            .map(c -> new ItemConfig(c.getCle(), c.getValeur(), c.getDescription()))
            .toList();
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5))).body(items);
    }

    public record ItemConfig(String cle, String valeur, String description) {
    }
}
