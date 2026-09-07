package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.CategorieApplication;
import gouv.ministere.portail.domain.DomaineAutorise;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.error.ValidationMetierException;
import gouv.ministere.portail.repository.ApplicationRepository;
import gouv.ministere.portail.repository.CategorieApplicationRepository;
import gouv.ministere.portail.repository.DomaineAutoriseRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.text.Normalizer;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cas d'utilisation UC07 / UC08 — administration des applications, catégories et domaines autorisés. */
@Service
public class ServiceAdministrationCatalogue {

    private static final Pattern CODE = Pattern.compile("^[A-Z0-9_]{2,50}$");
    private static final Pattern NON_CODE = Pattern.compile("[^A-Z0-9]+");
    private static final Pattern MARQUES = Pattern.compile("\\p{M}+");

    private final ApplicationRepository applications;
    private final CategorieApplicationRepository categories;
    private final DomaineAutoriseRepository domaines;
    private final ValidateurUrlCible validateurUrl;
    private final ServiceAudit audit;

    public ServiceAdministrationCatalogue(ApplicationRepository applications,
                                          CategorieApplicationRepository categories,
                                          DomaineAutoriseRepository domaines,
                                          ValidateurUrlCible validateurUrl,
                                          ServiceAudit audit) {
        this.applications = applications;
        this.categories = categories;
        this.domaines = domaines;
        this.validateurUrl = validateurUrl;
        this.audit = audit;
    }

    // --- applications -------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Application> listerApplications() {
        return applications.listerPourAdministration();
    }

    @Transactional
    public Application creerApplication(CommandeApplication cmd, IdentiteUtilisateur u, ContexteAudit ctx) {
        String code = genererCodeUnique(cmd.code(), cmd.nom());
        Application app = new Application();
        app.setCode(code);
        app.setCreePar(u.sujet());
        appliquer(app, cmd, u);
        Application enregistre = applications.save(app);
        audit.journaliser(u, ActionAudit.ADMIN_APPLICATION_CREEE, ResultatAudit.SUCCES,
            enregistre.getCode(), ctx, null);
        return enregistre;
    }

    @Transactional
    public Application modifierApplication(String code, CommandeApplication cmd, IdentiteUtilisateur u,
                                          ContexteAudit ctx) {
        Application app = chargerApplication(code);
        appliquer(app, cmd, u);
        Application enregistre = applications.save(app);
        audit.journaliser(u, ActionAudit.ADMIN_APPLICATION_MODIFIEE, ResultatAudit.SUCCES, code, ctx, null);
        return enregistre;
    }

    @Transactional
    public void archiverApplication(String code, IdentiteUtilisateur u, ContexteAudit ctx) {
        Application app = chargerApplication(code);
        app.setArchivee(true);
        app.toucher(u.sujet());
        applications.save(app);
        audit.journaliser(u, ActionAudit.ADMIN_APPLICATION_ARCHIVEE, ResultatAudit.SUCCES, code, ctx, null);
    }

    private void appliquer(Application app, CommandeApplication cmd, IdentiteUtilisateur u) {
        if (cmd.urlAcces() == null || !validateurUrl.estAutorisee(cmd.urlAcces())) {
            throw new ValidationMetierException(
                "L'URL d'accès doit être un lien https vers un nom de domaine d'application valide");
        }
        if (cmd.urlIcone() != null && !cmd.urlIcone().isBlank()
                && !cmd.urlIcone().toLowerCase().startsWith("https://")) {
            throw new ValidationMetierException("L'URL de l'icône doit être en https");
        }
        CategorieApplication categorie = null;
        if (cmd.categorieCode() != null && !cmd.categorieCode().isBlank()) {
            categorie = categories.findByCode(cmd.categorieCode())
                .orElseThrow(() -> new ValidationMetierException("Catégorie inconnue : " + cmd.categorieCode()));
        }
        app.setNom(cmd.nom());
        app.setDescription(cmd.description());
        app.setUrlAcces(cmd.urlAcces());
        app.setUrlIcone(cmd.urlIcone());
        app.setCategorie(categorie);
        app.setStatut(cmd.statut());
        app.setOrdreAffichage(cmd.ordreAffichage());
        app.setOuvrirNouvelOnglet(cmd.ouvrirNouvelOnglet());
        app.setSensible(cmd.sensible());
        app.toucher(u.sujet());
    }

    private Application chargerApplication(String code) {
        return applications.findByCode(code)
            .filter(a -> !a.isArchivee())
            .orElseThrow(() -> new RessourceIntrouvableException("Application introuvable"));
    }

    /**
     * Détermine le code technique d'une nouvelle application. Le champ « code » est libre et
     * facultatif : ce qui est saisi est normalisé (majuscules, accents retirés, séparateurs → {@code _}) ;
     * s'il est vide, le code est dérivé du nom. Un suffixe {@code _2}, {@code _3}… est ajouté au besoin
     * pour garantir l'unicité.
     */
    private String genererCodeUnique(String codeSaisi, String nom) {
        String base = normaliserCode(codeSaisi);
        if (base.isEmpty()) {
            base = normaliserCode(nom);
        }
        if (base.isEmpty()) {
            base = "APP";
        }
        String candidat = base;
        int suffixe = 2;
        while (applications.existsByCode(candidat)) {
            candidat = tronquer(base, 50 - (1 + String.valueOf(suffixe).length())) + "_" + suffixe;
            suffixe++;
        }
        return candidat;
    }

    /** Rend une chaîne compatible avec {@code ^[A-Z0-9_]{1,50}$} (accents retirés, non-alphanum → {@code _}). */
    private static String normaliserCode(String valeur) {
        if (valeur == null || valeur.isBlank()) {
            return "";
        }
        String sansAccents = MARQUES.matcher(
                Normalizer.normalize(valeur, Normalizer.Form.NFD)).replaceAll("");
        String code = NON_CODE.matcher(sansAccents.toUpperCase(java.util.Locale.ROOT)).replaceAll("_");
        code = code.replaceAll("^_+", "").replaceAll("_+$", "");
        return tronquer(code, 50);
    }

    private static String tronquer(String valeur, int max) {
        return valeur.length() <= max ? valeur : valeur.substring(0, max);
    }

    // --- catégories -------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CategorieApplication> listerCategories() {
        return categories.findAllByOrderByOrdreAffichageAsc();
    }

    @Transactional
    public CategorieApplication enregistrerCategorie(String code, String libelle, int ordre,
                                                     IdentiteUtilisateur u, ContexteAudit ctx) {
        if (!CODE.matcher(code).matches()) {
            throw new ValidationMetierException("Code de catégorie invalide");
        }
        CategorieApplication categorie = categories.findByCode(code)
            .orElseGet(() -> new CategorieApplication(code, libelle, ordre));
        categorie.setLibelle(libelle);
        categorie.setOrdreAffichage(ordre);
        CategorieApplication enregistre = categories.save(categorie);
        audit.journaliser(u, ActionAudit.ADMIN_CATEGORIE_MODIFIEE, ResultatAudit.SUCCES, null, ctx,
            "{\"code\":\"" + code + "\"}");
        return enregistre;
    }

    // --- domaines autorisés ---------------------------------------------

    @Transactional(readOnly = true)
    public List<DomaineAutorise> listerDomaines() {
        return domaines.findAll();
    }

    @Transactional
    public DomaineAutorise enregistrerDomaine(String domaine, String description, boolean actif,
                                              IdentiteUtilisateur u, ContexteAudit ctx) {
        DomaineAutorise d = domaines.findByDomaine(domaine)
            .orElseGet(() -> new DomaineAutorise(domaine, description, u.sujet()));
        d.setDescription(description);
        d.setActif(actif);
        DomaineAutorise enregistre = domaines.save(d);
        audit.journaliser(u, ActionAudit.ADMIN_DOMAINE_MODIFIE, ResultatAudit.SUCCES, null, ctx,
            "{\"domaine\":\"" + domaine + "\",\"actif\":" + actif + "}");
        return enregistre;
    }
}
