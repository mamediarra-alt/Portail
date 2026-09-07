package gouv.ministere.portail.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Convertit un jeton Keycloak en jeton d'authentification Spring en projetant
 * {@code realm_access.roles} vers des autorités {@code ROLE_*}.
 */
public class ConvertisseurRolesRealm implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        return new JwtAuthenticationToken(jwt, autorites(jwt), jwt.getSubject());
    }

    @SuppressWarnings("unchecked")
    private Set<GrantedAuthority> autorites(Jwt jwt) {
        Set<GrantedAuthority> autorites = new HashSet<>();
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> map && map.get("roles") instanceof Collection<?> roles) {
            for (Object role : roles) {
                autorites.add(new SimpleGrantedAuthority("ROLE_" + role));
            }
        }
        return autorites;
    }
}
