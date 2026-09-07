package gouv.ministere.portail;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée de l'API du Portail Applicatif du Ministère.
 *
 * <p>Périmètre : catalogue d'applications, contrôle d'accès de niveau portail,
 * audit, administration. Cette application ne contient aucune logique métier
 * d'EDUSN ni du Restaurant et ne se connecte qu'à sa propre base {@code portail_db}.
 */
@SpringBootApplication
public class PortailApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortailApiApplication.class, args);
    }
}
