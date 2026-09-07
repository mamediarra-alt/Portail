package gouv.ministere.portail.web;

import gouv.ministere.portail.security.IdentiteUtilisateur;
import gouv.ministere.portail.service.ServiceAuthDemo;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentification démo par matricule (appelée par le BFF). En production, remplacée par Keycloak.
 */
@RestController
@RequestMapping("/api/auth-demo")
public class AuthDemoController {

    private final ServiceAuthDemo service;

    public AuthDemoController(ServiceAuthDemo service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ReponseAuth> verifier(@RequestBody RequeteAuth req, HttpServletRequest http) {
        var r = service.verifier(req.matricule(), req.motDePasse(), RequeteContexte.contexte(http));
        return switch (r.statut()) {
            case "OK" -> ResponseEntity.ok(ReponseAuth.depuis(r.identite()));
            case "VERROUILLE" -> ResponseEntity.status(HttpStatus.LOCKED)
                .body(new ReponseAuth(null, null, List.of()));
            default -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ReponseAuth(null, null, List.of()));
        };
    }

    @GetMapping("/profil")
    public ResponseEntity<ReponseAuth> profil(@RequestParam String matricule) {
        IdentiteUtilisateur i = service.profil(matricule);
        return i == null ? ResponseEntity.notFound().build()
            : ResponseEntity.ok(ReponseAuth.depuis(i));
    }

    public record RequeteAuth(String matricule, String motDePasse) {
    }

    public record ReponseAuth(String matricule, String nom, List<String> roles) {
        static ReponseAuth depuis(IdentiteUtilisateur i) {
            return new ReponseAuth(i.matricule(), i.nom(), List.copyOf(i.roles()));
        }
    }
}
