package gouv.ministere.portail.web;

import gouv.ministere.portail.security.IdentiteUtilisateur;
import gouv.ministere.portail.security.UtilisateurCourant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** UC06 — Consulter son profil (projection minimale des claims, lecture seule). */
@RestController
@RequestMapping("/api/moi")
public class ProfilController {

    private final UtilisateurCourant utilisateurCourant;

    public ProfilController(UtilisateurCourant utilisateurCourant) {
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping
    public ReponseProfil profil() {
        IdentiteUtilisateur u = utilisateurCourant.obtenir();
        return new ReponseProfil(u.sujet(), u.nom(), u.email(), u.rolesPortail(),
            List.copyOf(u.groupes()), u.origine(), u.estAdministrateur(), u.estAuditeur());
    }

    public record ReponseProfil(
            String sujet, String nom, String email, List<String> roles, List<String> groupes,
            String origine, boolean administrateur, boolean auditeur) {
    }
}
