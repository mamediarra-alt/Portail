package gouv.ministere.portail.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Métadonnées OpenAPI de l'API du portail. */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI portailOpenApi() {
        return new OpenAPI().info(new Info()
            .title("API — Portail Applicatif du Ministère")
            .version("0.1.0")
            .description("Catalogue d'applications, contrôle d'accès de niveau portail, audit, administration.")
            .license(new License().name("Usage interne — Ministère")));
    }
}
