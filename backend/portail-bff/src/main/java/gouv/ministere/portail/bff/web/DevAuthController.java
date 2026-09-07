package gouv.ministere.portail.bff.web;

import java.net.URI;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

/**
 * Profil <strong>dev uniquement</strong> : petit portail d'authentification par code de
 * démonstration, à défaut de Keycloak. Pose un cookie {@code portail_dev_auth} que
 * {@link SessionControllerDev} vérifie. Ne jamais activer en production.
 */
@RestController
@RequestMapping("/bff")
@Profile("dev")
public class DevAuthController {

    static final String COOKIE = "portail_dev_auth";

    private final String codeAttendu;

    public DevAuthController(@Value("${portail.demo.code:demo}") String codeAttendu) {
        this.codeAttendu = codeAttendu;
    }

    @GetMapping("/mode")
    public Map<String, Object> mode() {
        return Map.of("demo", true, "indiceCode", codeAttendu.equals("demo"));
    }

    @PostMapping("/dev-login")
    public ResponseEntity<Map<String, Object>> connexion(@RequestBody Map<String, String> corps,
                                                         ServerWebExchange exchange) {
        String code = corps.getOrDefault("code", "").trim();
        if (!codeAttendu.equals(code)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        }
        // Cookie de session (pas de maxAge) : à la réouverture du navigateur, on repasse
        // par la page de connexion au lieu d'entrer directement dans l'application.
        ResponseCookie cookie = ResponseCookie.from(COOKIE, "1")
            .httpOnly(true).sameSite("Lax").path("/").build();
        exchange.getResponse().addCookie(cookie);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> deconnexion(ServerWebExchange exchange) {
        ResponseCookie efface = ResponseCookie.from(COOKIE, "")
            .httpOnly(true).sameSite("Lax").path("/").maxAge(0).build();
        exchange.getResponse().addCookie(efface);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create("/")).build();
    }
}
