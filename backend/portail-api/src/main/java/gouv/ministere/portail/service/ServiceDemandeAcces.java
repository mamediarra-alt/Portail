package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.DemandeAcces;
import gouv.ministere.portail.domain.EffetPolitique;
import gouv.ministere.portail.domain.PolitiqueAcces;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.domain.StatutDemande;
import gouv.ministere.portail.domain.StatutValidationPolitique;
import gouv.ministere.portail.domain.TypeReglePolitique;
import gouv.ministere.portail.error.ConflitException;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.repository.ApplicationRepository;
import gouv.ministere.portail.repository.DemandeAccesRepository;
import gouv.ministere.portail.repository.PolitiqueAccesRepository;
import gouv.ministere.portail.domain.TypeNotification;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** UC — Demande d'accès self-service (agent) et traitement (administrateur). */
@Service
public class ServiceDemandeAcces {

    /** Durée d'un accès nominatif avant re-certification. */
    public static final int MOIS_VALIDITE_ACCES = 6;

    private final DemandeAccesRepository demandes;
    private final ApplicationRepository applications;
    private final PolitiqueAccesRepository politiques;
    private final ServiceControleAcces controleAcces;
    private final ServiceNotification notifications;
    private final ServiceAudit audit;

    public ServiceDemandeAcces(DemandeAccesRepository demandes, ApplicationRepository applications,
                               PolitiqueAccesRepository politiques, ServiceControleAcces controleAcces,
                               ServiceNotification notifications, ServiceAudit audit) {
        this.demandes = demandes;
        this.applications = applications;
        this.politiques = politiques;
        this.controleAcces = controleAcces;
        this.notifications = notifications;
        this.audit = audit;
    }

    @Transactional
    public DemandeAcces creer(String codeApp, String motif, IdentiteUtilisateur u, ContexteAudit ctx) {
        Application app = applications.findByCode(codeApp)
            .filter(a -> !a.isArchivee() && !a.estMasquee())
            .orElseThrow(() -> new RessourceIntrouvableException("Application introuvable"));
        if (controleAcces.evaluer(u, app).autorise()) {
            throw new ConflitException("Vous avez déjà accès à cette application.");
        }
        if (demandes.existsByDemandeurSujetAndApplicationCodeAndStatut(
                u.sujet(), codeApp, StatutDemande.EN_ATTENTE)) {
            throw new ConflitException("Une demande est déjà en attente pour cette application.");
        }
        DemandeAcces d = demandes.save(new DemandeAcces(
            app.getCode(), app.getNom(), u.sujet(), u.matricule(), u.nom(), motif));
        audit.journaliser(u, ActionAudit.ADMIN_POLITIQUE_MODIFIEE, ResultatAudit.SUCCES, codeApp, ctx,
            "{\"demandeAccesId\":" + d.getId() + ",\"etat\":\"EN_ATTENTE\"}");
        return d;
    }

    @Transactional(readOnly = true)
    public List<DemandeAcces> miennes(String sujet) {
        return demandes.findByDemandeurSujetOrderByDateDemandeDesc(sujet);
    }

    @Transactional(readOnly = true)
    public List<DemandeAcces> enAttente() {
        return demandes.findByStatutOrderByDateDemandeAsc(StatutDemande.EN_ATTENTE);
    }

    @Transactional
    public DemandeAcces approuver(Long id, IdentiteUtilisateur admin, ContexteAudit ctx) {
        DemandeAcces d = charger(id);
        exigerEnAttente(d);
        Application app = applications.findByCode(d.getApplicationCode())
            .orElseThrow(() -> new RessourceIntrouvableException("Application introuvable"));

        PolitiqueAcces p = new PolitiqueAcces();
        p.setApplication(app);
        p.setTypeRegle(TypeReglePolitique.UTILISATEUR_REQUIS);
        p.setValeur(d.getDemandeurSujet());
        p.setEffet(EffetPolitique.AUTORISER);
        p.setActif(true);
        p.setStatutValidation(StatutValidationPolitique.ACTIVE_DIRECTE);
        p.setDemandeePar(admin.sujet());
        p.setDateExpiration(Instant.now().plus(MOIS_VALIDITE_ACCES * 30L, ChronoUnit.DAYS));
        politiques.save(p);

        d.decider(StatutDemande.APPROUVEE, admin.sujet(), null);
        audit.journaliser(admin, ActionAudit.ADMIN_POLITIQUE_APPROUVEE, ResultatAudit.SUCCES,
            d.getApplicationCode(), ctx,
            "{\"demandeAccesId\":" + id + ",\"beneficiaire\":\"" + d.getDemandeurMatricule() + "\"}");
        notifications.creer(d.getDemandeurSujet(),
            "Accès accordé — " + d.getApplicationNom(),
            "Votre demande d'accès a été approuvée. L'application est disponible dans votre tableau de bord "
                + "(accès à re-certifier dans " + MOIS_VALIDITE_ACCES + " mois).",
            TypeNotification.SUCCES, "/tableau-de-bord");
        return d;
    }

    @Transactional
    public DemandeAcces refuser(Long id, String motif, IdentiteUtilisateur admin, ContexteAudit ctx) {
        DemandeAcces d = charger(id);
        exigerEnAttente(d);
        d.decider(StatutDemande.REFUSEE, admin.sujet(), motif);
        audit.journaliser(admin, ActionAudit.ADMIN_POLITIQUE_MODIFIEE, ResultatAudit.SUCCES,
            d.getApplicationCode(), ctx, "{\"demandeAccesId\":" + id + ",\"etat\":\"REFUSEE\"}");
        notifications.creer(d.getDemandeurSujet(),
            "Demande refusée — " + d.getApplicationNom(),
            (motif == null || motif.isBlank()) ? "Votre demande d'accès n'a pas été retenue."
                : "Motif : " + motif,
            TypeNotification.INFO, null);
        return d;
    }

    private DemandeAcces charger(Long id) {
        return demandes.findById(id)
            .orElseThrow(() -> new RessourceIntrouvableException("Demande introuvable"));
    }

    private void exigerEnAttente(DemandeAcces d) {
        if (d.getStatut() != StatutDemande.EN_ATTENTE) {
            throw new ConflitException("Cette demande a déjà été traitée.");
        }
    }
}
