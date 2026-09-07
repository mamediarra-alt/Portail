package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.PolitiqueAcces;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.domain.StatutValidationPolitique;
import gouv.ministere.portail.domain.TypeReglePolitique;
import gouv.ministere.portail.error.ConflitException;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.error.ValidationMetierException;
import gouv.ministere.portail.repository.ApplicationRepository;
import gouv.ministere.portail.repository.PolitiqueAccesRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cas d'utilisation UC09 — gestion des politiques d'accès, avec double validation
 * (« quatre yeux ») pour les applications sensibles.
 */
@Service
public class ServicePolitiqueAcces {

    private final PolitiqueAccesRepository politiques;
    private final ApplicationRepository applications;
    private final ServiceControleAcces controleAcces;
    private final ServiceAudit audit;
    private final boolean modeDemo;

    public ServicePolitiqueAcces(PolitiqueAccesRepository politiques, ApplicationRepository applications,
                                 ServiceControleAcces controleAcces, ServiceAudit audit,
                                 Environment environnement) {
        this.politiques = politiques;
        this.applications = applications;
        this.controleAcces = controleAcces;
        this.audit = audit;
        // En profil « dev » (démo sans Keycloak), un seul utilisateur fictif existe : on l'autorise
        // à approuver sa propre politique pour pouvoir dérouler le workflow de validation.
        this.modeDemo = environnement.matchesProfiles("dev");
    }

    /** Simulateur : quel serait le verdict pour un profil donné (aucun effet de bord). */
    @Transactional(readOnly = true)
    public DecisionAcces simuler(String code, List<String> roles, List<String> groupes, String origine) {
        Application app = chargerApplication(code);
        IdentiteUtilisateur profil = new IdentiteUtilisateur(
            "simulation", "simulation", "Profil simulé", null,
            Set.copyOf(roles == null ? List.of() : roles),
            Set.copyOf(groupes == null ? List.of() : groupes),
            origine);
        return controleAcces.evaluer(profil, app);
    }

    @Transactional(readOnly = true)
    public List<PolitiqueAcces> listerPourApplication(String code) {
        Application app = chargerApplication(code);
        return politiques.findByApplicationId(app.getId());
    }

    public record PolitiqueEnAttente(
            Long id, String applicationCode, String applicationNom,
            String typeRegle, String valeur, String effet, String demandeePar, java.time.Instant dateDemande) {
    }

    public record AccesARecertifier(
            Long id, String applicationCode, String applicationNom, String beneficiaireSujet,
            java.time.Instant dateExpiration, boolean expire) {
    }

    /** Accès nominatifs qui expirent dans moins de 30 jours (ou déjà expirés). */
    @Transactional(readOnly = true)
    public List<AccesARecertifier> listerARecertifier() {
        java.time.Instant limite = java.time.Instant.now().plus(30, java.time.temporal.ChronoUnit.DAYS);
        return politiques.aRecertifier(limite).stream()
            .map(p -> new AccesARecertifier(
                p.getId(), p.getApplication().getCode(), p.getApplication().getNom(),
                p.getValeur(), p.getDateExpiration(),
                p.getDateExpiration().isBefore(java.time.Instant.now())))
            .toList();
    }

    @Transactional
    public void recertifier(Long id, IdentiteUtilisateur admin, ContexteAudit ctx) {
        PolitiqueAcces p = politiques.findById(id)
            .orElseThrow(() -> new RessourceIntrouvableException("Politique introuvable"));
        p.setDateExpiration(java.time.Instant.now()
            .plus(ServiceDemandeAcces.MOIS_VALIDITE_ACCES * 30L, java.time.temporal.ChronoUnit.DAYS));
        audit.journaliser(admin, ActionAudit.ADMIN_POLITIQUE_MODIFIEE, ResultatAudit.SUCCES,
            p.getApplication().getCode(), ctx, "{\"recertification\":" + id + "}");
    }

    @Transactional
    public void revoquer(Long id, IdentiteUtilisateur admin, ContexteAudit ctx) {
        PolitiqueAcces p = politiques.findById(id)
            .orElseThrow(() -> new RessourceIntrouvableException("Politique introuvable"));
        p.setActif(false);
        audit.journaliser(admin, ActionAudit.ADMIN_POLITIQUE_MODIFIEE, ResultatAudit.SUCCES,
            p.getApplication().getCode(), ctx, "{\"revocation\":" + id + "}");
    }

    /** File d'attente globale des politiques à valider (« quatre yeux »). */
    @Transactional(readOnly = true)
    public List<PolitiqueEnAttente> listerEnAttente() {
        return politiques
            .findByStatutValidationOrderByDateDemandeDesc(
                gouv.ministere.portail.domain.StatutValidationPolitique.EN_ATTENTE_APPROBATION)
            .stream()
            .map(p -> new PolitiqueEnAttente(
                p.getId(),
                p.getApplication().getCode(),
                p.getApplication().getNom(),
                p.getTypeRegle().name(),
                p.getValeur(),
                p.getEffet().name(),
                p.getDemandeePar(),
                p.getDateDemande()))
            .toList();
    }

    /**
     * Ajoute une politique. Sur application sensible, elle est créée en attente d'approbation
     * (inactive) ; sinon elle est active immédiatement.
     */
    @Transactional
    public PolitiqueAcces ajouter(String code, CommandePolitique cmd, IdentiteUtilisateur u,
                                  ContexteAudit ctx) {
        Application app = chargerApplication(code);
        if (cmd.typeRegle() != TypeReglePolitique.OUVERT_A_TOUS
                && (cmd.valeur() == null || cmd.valeur().isBlank())) {
            throw new ValidationMetierException("Une valeur est requise pour ce type de règle");
        }
        PolitiqueAcces p = new PolitiqueAcces();
        p.setApplication(app);
        p.setTypeRegle(cmd.typeRegle());
        p.setValeur(cmd.typeRegle() == TypeReglePolitique.OUVERT_A_TOUS ? null : cmd.valeur().trim());
        p.setEffet(cmd.effet());
        p.setDemandeePar(u.sujet());
        if (app.isSensible()) {
            p.setActif(false);
            p.setStatutValidation(StatutValidationPolitique.EN_ATTENTE_APPROBATION);
        } else {
            p.setActif(true);
            p.setStatutValidation(StatutValidationPolitique.ACTIVE_DIRECTE);
        }
        PolitiqueAcces enregistre = politiques.save(p);
        audit.journaliser(u, ActionAudit.ADMIN_POLITIQUE_MODIFIEE, ResultatAudit.SUCCES, code, ctx,
            "{\"politiqueId\":" + enregistre.getId() + ",\"statut\":\"" + enregistre.getStatutValidation() + "\"}");
        return enregistre;
    }

    /** Approbation par un second administrateur (différent du demandeur). */
    @Transactional
    public PolitiqueAcces approuver(Long id, IdentiteUtilisateur u, ContexteAudit ctx) {
        PolitiqueAcces p = politiques.findById(id)
            .orElseThrow(() -> new RessourceIntrouvableException("Politique introuvable"));
        if (p.getStatutValidation() != StatutValidationPolitique.EN_ATTENTE_APPROBATION) {
            throw new ConflitException("Cette politique n'est pas en attente d'approbation");
        }
        if (!modeDemo && u.sujet().equals(p.getDemandeePar())) {
            throw new ConflitException("Un autre administrateur doit approuver cette politique");
        }
        p.setStatutValidation(StatutValidationPolitique.APPROUVEE);
        p.setActif(true);
        p.setApprouveePar(u.sujet());
        p.setDateDecision(Instant.now());
        PolitiqueAcces enregistre = politiques.save(p);
        audit.journaliser(u, ActionAudit.ADMIN_POLITIQUE_APPROUVEE, ResultatAudit.SUCCES,
            p.getApplication().getCode(), ctx, "{\"politiqueId\":" + id + "}");
        return enregistre;
    }

    @Transactional
    public PolitiqueAcces rejeter(Long id, String motif, IdentiteUtilisateur u, ContexteAudit ctx) {
        PolitiqueAcces p = politiques.findById(id)
            .orElseThrow(() -> new RessourceIntrouvableException("Politique introuvable"));
        p.setStatutValidation(StatutValidationPolitique.REJETEE);
        p.setActif(false);
        p.setApprouveePar(u.sujet());
        p.setDateDecision(Instant.now());
        p.setCommentaireDecision(motif);
        PolitiqueAcces enregistre = politiques.save(p);
        audit.journaliser(u, ActionAudit.ADMIN_POLITIQUE_MODIFIEE, ResultatAudit.SUCCES,
            p.getApplication().getCode(), ctx, "{\"politiqueId\":" + id + ",\"statut\":\"REJETEE\"}");
        return enregistre;
    }

    private Application chargerApplication(String code) {
        return applications.findByCode(code)
            .orElseThrow(() -> new RessourceIntrouvableException("Application introuvable"));
    }
}
