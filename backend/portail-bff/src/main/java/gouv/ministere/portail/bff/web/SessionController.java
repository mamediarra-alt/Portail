package gouv.ministere.portail.bff.web;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * État de session pour la SPA : permet à l'Angular de savoir s'il est authentifié
 * sans provoquer de redirection. Aucun jeton n'est exposé.
 */
@RestController
@RequestMapping("/bff")
@Profile("!dev")
public class SessionController {

    @GetMapping("/session")
    public ReponseSession session(@AuthenticationPrincipal OidcUser utilisateur) {
        if (utilisateur == null) {
            return ReponseSession.anonyme();
        }
        List<String> roles = rolesRealm(utilisateur.getClaims());
        String nom = utilisateur.getFullName() != null ? utilisateur.getFullName()
            : utilisateur.getPreferredUsername();
        return new ReponseSession(true, nom, utilisateur.getEmail(), roles);
    }

    @SuppressWarnings("unchecked")
    private static List<String> rolesRealm(Map<String, Object> claims) {
        Object realmAccess = claims.get("realm_access");
        if (realmAccess instanceof Map<?, ?> map && map.get("roles") instanceof Collection<?> roles) {
            return roles.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public record ReponseSession(boolean authentifie, String nom, String email, List<String> roles) {
        static ReponseSession anonyme() {
            return new ReponseSession(false, null, null, List.of());
        }
    }
}
