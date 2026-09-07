package gouv.ministere.portail.bff.web;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Profil dev : session « Ministre (dev) » active seulement si le cookie de démonstration
 * {@code portail_dev_auth} est présent (posé par {@link DevAuthController}).
 */
@RestController
@RequestMapping("/bff")
@Profile("dev")
public class SessionControllerDev {

    @GetMapping("/session")
    public SessionController.ReponseSession session(ServerHttpRequest request) {
        boolean connecte = request.getCookies().containsKey(DevAuthController.COOKIE);
        if (!connecte) {
            return SessionController.ReponseSession.anonyme();
        }
        return new SessionController.ReponseSession(
            true,
            "Utilisateur de démonstration",
            "demo@ministere.local",
            List.of("AGENT", "ADMIN_PORTAIL", "AUDITEUR_PORTAIL"));
    }
}
