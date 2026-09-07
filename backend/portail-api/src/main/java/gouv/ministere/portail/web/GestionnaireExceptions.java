package gouv.ministere.portail.web;

import gouv.ministere.portail.error.AccesRefuseException;
import gouv.ministere.portail.error.ApplicationIndisponibleException;
import gouv.ministere.portail.error.ConfigurationInvalideException;
import gouv.ministere.portail.error.ConflitException;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.error.ValidationMetierException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduction des exceptions en réponses RFC 7807. Les messages exposés restent neutres :
 * le détail (motif de refus, anomalie de configuration) va dans les journaux, pas au client.
 */
@RestControllerAdvice
public class GestionnaireExceptions {

    private static final Logger log = LoggerFactory.getLogger(GestionnaireExceptions.class);

    @ExceptionHandler(RessourceIntrouvableException.class)
    ProblemDetail introuvable(RessourceIntrouvableException ex) {
        return probleme(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(AccesRefuseException.class)
    ProblemDetail accesRefuse(AccesRefuseException ex) {
        log.info("Accès refusé (motif interne={})", ex.getMotif());
        return probleme(HttpStatus.FORBIDDEN, "Accès non autorisé");
    }

    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail accesInterdit(AccessDeniedException ex) {
        return probleme(HttpStatus.FORBIDDEN, "Accès non autorisé");
    }

    @ExceptionHandler(ApplicationIndisponibleException.class)
    ProblemDetail indisponible(ApplicationIndisponibleException ex) {
        return probleme(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ConfigurationInvalideException.class)
    ProblemDetail configurationInvalide(ConfigurationInvalideException ex) {
        log.warn("Anomalie de configuration détectée à l'exécution : {}", ex.getMessage());
        return probleme(HttpStatus.UNPROCESSABLE_ENTITY, "Accès indisponible");
    }

    @ExceptionHandler(ConflitException.class)
    ProblemDetail conflit(ConflitException ex) {
        return probleme(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ValidationMetierException.class)
    ProblemDetail validationMetier(ValidationMetierException ex) {
        return probleme(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validationFormat(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + " : " + e.getDefaultMessage())
            .findFirst().orElse("Requête invalide");
        return probleme(HttpStatus.BAD_REQUEST, detail);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail inattendue(Exception ex) {
        log.error("Erreur non gérée", ex);
        return probleme(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne");
    }

    private static ProblemDetail probleme(HttpStatus statut, String detail) {
        return ProblemDetail.forStatusAndDetail(statut, detail);
    }
}
