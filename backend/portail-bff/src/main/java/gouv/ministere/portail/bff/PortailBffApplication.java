package gouv.ministere.portail.bff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Backend For Frontend du portail.
 *
 * <p>Point d'entrée unique du navigateur : termine la session (cookie {@code httpOnly}),
 * applique la protection CSRF, porte l'authentification OIDC vers Keycloak et relaie le
 * jeton d'accès vers {@code portail-api}. Ne contient aucune logique métier.
 */
@SpringBootApplication
public class PortailBffApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortailBffApplication.class, args);
    }
}
