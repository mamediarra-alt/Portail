package gouv.ministere.portail.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/** Accès à l'identité de l'utilisateur authentifié pour la requête en cours. */
@Component
public class UtilisateurCourant {

    /**
     * @return l'identité issue du jeton validé
     * @throws IllegalStateException si la requête n'est pas authentifiée (ne devrait pas arriver
     *                               derrière la configuration de sécurité)
     */
    public IdentiteUtilisateur obtenir() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            return IdentiteUtilisateur.depuis(jwt);
        }
        throw new IllegalStateException("Aucune identité authentifiée dans le contexte de sécurité");
    }
}
