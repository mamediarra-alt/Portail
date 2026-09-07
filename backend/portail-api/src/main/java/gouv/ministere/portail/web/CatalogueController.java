package gouv.ministere.portail.web;

import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.CategorieApplication;
import gouv.ministere.portail.domain.StatutApplication;
import gouv.ministere.portail.service.ServiceCatalogue;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import gouv.ministere.portail.security.UtilisateurCourant;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** UC03 — tableau de bord (catalogue filtré) ; UC04 — détail d'une application. */
@RestController
@RequestMapping("/api")
public class CatalogueController {

    private final ServiceCatalogue catalogue;
    private final UtilisateurCourant utilisateurCourant;

    public CatalogueController(ServiceCatalogue catalogue, UtilisateurCourant utilisateurCourant) {
        this.catalogue = catalogue;
        this.utilisateurCourant = utilisateurCourant;
    }

    @GetMapping("/catalogue")
    public ResponseEntity<List<ItemCatalogue>> catalogue() {
        IdentiteUtilisateur u = utilisateurCourant.obtenir();
        List<ItemCatalogue> items = catalogue.listerApplicationsVisibles(u).stream()
            .map(ItemCatalogue::depuis)
            .toList();
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(items);
    }

    @GetMapping("/catalogue/demandables")
    public List<ItemCatalogue> demandables() {
        return catalogue.listerDemandables(utilisateurCourant.obtenir()).stream()
            .map(ItemCatalogue::depuis)
            .toList();
    }

    @GetMapping("/applications/{code}")
    public DetailApplication detail(@PathVariable String code) {
        return DetailApplication.depuis(catalogue.obtenirDetail(code, utilisateurCourant.obtenir()));
    }

    public record ItemCatalogue(
            String code, String nom, String description, String urlIcone,
            String categorieCode, String categorieLibelle,
            StatutApplication statut, boolean accesBloque, boolean ouvrirNouvelOnglet) {

        static ItemCatalogue depuis(Application a) {
            CategorieApplication c = a.getCategorie();
            return new ItemCatalogue(
                a.getCode(), a.getNom(), a.getDescription(), a.getUrlIcone(),
                c != null ? c.getCode() : null,
                c != null ? c.getLibelle() : null,
                a.getStatut(),
                a.accesBloqueParStatut(),
                a.isOuvrirNouvelOnglet());
        }
    }

    public record DetailApplication(
            String code, String nom, String description, String urlIcone,
            String categorieLibelle, StatutApplication statut, boolean accesBloque) {

        static DetailApplication depuis(Application a) {
            return new DetailApplication(
                a.getCode(), a.getNom(), a.getDescription(), a.getUrlIcone(),
                a.getCategorie() != null ? a.getCategorie().getLibelle() : null,
                a.getStatut(), a.accesBloqueParStatut());
        }
    }
}
