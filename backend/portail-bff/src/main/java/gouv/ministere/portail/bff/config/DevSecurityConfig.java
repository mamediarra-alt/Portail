package gouv.ministere.portail.bff.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.server.WebFilter;

/**
 * Profil <strong>dev uniquement</strong> : le BFF fonctionne sans Keycloak. Toutes les
 * requêtes passent ; la protection CSRF (cookie {@code XSRF-TOKEN}) reste active pour
 * reproduire le comportement réel côté SPA. Ne jamais activer en production.
 */
@Configuration
@Profile("dev")
public class DevSecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(DevSecurityConfig.class);

    @Bean
    SecurityWebFilterChain devChaine(ServerHttpSecurity http) {
        log.warn("=== PROFIL DEV : BFF sans OIDC, aucune authentification réelle ===");
        http
            .authorizeExchange(ex -> ex.anyExchange().permitAll())
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            .csrf(ServerHttpSecurity.CsrfSpec::disable) // dev : pas de Keycloak, pas de CSRF
            .headers(h -> h.contentSecurityPolicy(csp -> csp.policyDirectives(
                "default-src 'self'; frame-ancestors 'none'")));
        return http.build();
    }

    /** En dev, /api/** exige le cookie de démonstration (posé après saisie du code). */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    WebFilter devApiGuard() {
        return (exchange, chain) -> {
            String chemin = exchange.getRequest().getPath().value();
            if (chemin.startsWith("/api/")
                && !exchange.getRequest().getCookies().containsKey("portail_dev_auth")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            return chain.filter(exchange);
        };
    }
}
