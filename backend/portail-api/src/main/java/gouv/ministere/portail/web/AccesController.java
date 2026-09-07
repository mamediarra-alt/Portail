package gouv.ministere.portail.web;

import gouv.ministere.portail.service.ResultatRedirection;
import gouv.ministere.portail.service.ServiceAcces;
import gouv.ministere.portail.security.UtilisateurCourant;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * UC05 — Accéder à une application. Requête mutable : le BFF exige un jeton CSRF en amont.
 * Réponse = URL canonique issue du catalogue (jamais une URL fournie par le client).
 */
@RestController
@RequestMapping("/api/acces")
public class AccesController {

    private final ServiceAcces serviceAcces;
    private final UtilisateurCourant utilisateurCourant;

    public AccesController(ServiceAcces serviceAcces, UtilisateurCourant utilisateurCourant) {
        this.serviceAcces = serviceAcces;
        this.utilisateurCourant = utilisateurCourant;
    }

    @PostMapping("/{code}")
    public ReponseAcces acceder(@PathVariable String code, HttpServletRequest requete) {
        ResultatRedirection r = serviceAcces.preparerRedirection(
            code, utilisateurCourant.obtenir(), RequeteContexte.contexte(requete));
        return new ReponseAcces(r.url(), r.nouvelOnglet());
    }

    public record ReponseAcces(String url, boolean nouvelOnglet) {
    }
}
