package gouv.ministere.portail.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Profil <strong>dev uniquement</strong> : neutralise l'authentification OIDC pour permettre
 * de faire tourner le portail sans Keycloak. Chaque requête est authentifiée comme un
 * utilisateur fictif « ministre » portant tous les rôles. Ne jamais activer en production.
 */
@Configuration
@Profile("dev")
@EnableMethodSecurity
public class DevSecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(DevSecurityConfig.class);

    @Bean
    SecurityFilterChain devFilterChain(HttpSecurity http) throws Exception {
        log.warn("=== PROFIL DEV : authentification OIDC désactivée, utilisateur fictif « ministre » ===");
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .addFilterBefore(new IdentiteDevFilter(), AuthorizationFilter.class);
        return http.build();
    }

    /** Injecte une identité fictive dans le contexte de sécurité. */
    static final class IdentiteDevFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain chain) throws ServletException, IOException {
            Jwt jwt = Jwt.withTokenValue("dev")
                .header("alg", "none")
                .subject("demo-utilisateur")
                .claim("preferred_username", "demo")
                .claim("matricule", "MIN-00000")
                .claim("name", "Utilisateur de démonstration")
                .claim("email", "demo@ministere.local")
                .claim("realm_access",
                    Map.of("roles", List.of("AGENT", "ADMIN_PORTAIL", "AUDITEUR_PORTAIL")))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
            AbstractAuthenticationToken auth = new JwtAuthenticationToken(jwt, List.of(
                new SimpleGrantedAuthority("ROLE_AGENT"),
                new SimpleGrantedAuthority("ROLE_ADMIN_PORTAIL"),
                new SimpleGrantedAuthority("ROLE_AUDITEUR_PORTAIL")), "demo");
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            chain.doFilter(request, response);
        }
    }
}
