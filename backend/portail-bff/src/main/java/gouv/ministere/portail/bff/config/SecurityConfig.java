package gouv.ministere.portail.bff.config;

import java.net.URI;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.oidc.web.server.logout.OidcClientInitiatedServerLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.security.web.server.csrf.CookieServerCsrfTokenRepository;
import org.springframework.security.web.server.csrf.CsrfToken;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRequestAttributeHandler;
import org.springframework.security.web.server.header.ReferrerPolicyServerHttpHeadersWriter.ReferrerPolicy;
import org.springframework.security.web.server.header.XFrameOptionsServerHttpHeadersWriter.Mode;
import org.springframework.web.server.WebFilter;
import reactor.core.publisher.Mono;

/**
 * Sécurité du BFF (pile réactive).
 *
 * <ul>
 *   <li>Authentification OIDC <em>Authorization Code + PKCE</em> vers Keycloak ;</li>
 *   <li>session portée par un cookie {@code httpOnly} (aucun jeton exposé au navigateur) ;</li>
 *   <li>CSRF par cookie {@code XSRF-TOKEN} lisible en JS + en-tête {@code X-XSRF-TOKEN} ;</li>
 *   <li>navigation HTML non authentifiée → redirection Keycloak ; XHR → {@code 401} ;</li>
 *   <li>déconnexion propagée à Keycloak (RP-Initiated Logout).</li>
 * </ul>
 */
@Configuration
@Profile("!dev")
public class SecurityConfig {

    @Bean
    SecurityWebFilterChain chaine(ServerHttpSecurity http,
                                  ReactiveClientRegistrationRepository registrations) {
        http
            .authorizeExchange(ex -> ex
                .pathMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .pathMatchers("/bff/session").permitAll()
                .anyExchange().authenticated())
            .oauth2Login(Customizer.withDefaults())
            .logout(logout -> logout
                .logoutUrl("/bff/logout")
                .logoutSuccessHandler(deconnexionOidc(registrations)))
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieServerCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new ServerCsrfTokenRequestAttributeHandler()))
            .exceptionHandling(e -> e.authenticationEntryPoint(pointEntree()))
            .headers(h -> h
                .frameOptions(f -> f.mode(Mode.DENY))
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; "
                        + "form-action 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'"))
                .referrerPolicy(r -> r.policy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .permissionsPolicy(pp -> pp.policy("geolocation=(), camera=(), microphone=()"))
                .hsts(hsts -> hsts.includeSubdomains(true).maxAge(Duration.ofDays(365))));
        return http.build();
    }

    /** Navigation HTML → redirection vers Keycloak ; tout le reste (XHR, /api, /bff) → 401. */
    private ServerAuthenticationEntryPoint pointEntree() {
        return (exchange, ex) -> {
            String accept = exchange.getRequest().getHeaders().getFirst("Accept");
            String chemin = exchange.getRequest().getPath().value();
            boolean html = accept != null && accept.contains("text/html");
            boolean api = chemin.startsWith("/api/") || chemin.startsWith("/bff/");
            if (html && !api) {
                exchange.getResponse().setStatusCode(HttpStatus.FOUND);
                exchange.getResponse().getHeaders().setLocation(
                    URI.create("/oauth2/authorization/keycloak"));
            } else {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            }
            return exchange.getResponse().setComplete();
        };
    }

    private ServerLogoutSuccessHandler deconnexionOidc(ReactiveClientRegistrationRepository registrations) {
        var handler = new OidcClientInitiatedServerLogoutSuccessHandler(registrations);
        handler.setPostLogoutRedirectUri("{baseUrl}/");
        return handler;
    }

    /** Force la matérialisation du cookie XSRF-TOKEN sur chaque requête. */
    @Bean
    WebFilter csrfCookieWebFilter() {
        return (exchange, chain) -> exchange
            .<Mono<CsrfToken>>getAttributeOrDefault(CsrfToken.class.getName(), Mono.empty())
            .doOnSuccess(token -> { })
            .then(chain.filter(exchange));
    }
}
