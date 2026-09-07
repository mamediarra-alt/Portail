package gouv.ministere.portail.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Demande d'accès à une application, formulée par un agent, à valider par un administrateur. */
@Entity
@Table(name = "demande_acces")
public class DemandeAcces {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_code", nullable = false, length = 50)
    private String applicationCode;

    @Column(name = "application_nom", nullable = false, length = 150)
    private String applicationNom;

    @Column(name = "demandeur_sujet", nullable = false, length = 150)
    private String demandeurSujet;

    @Column(name = "demandeur_matricule", length = 50)
    private String demandeurMatricule;

    @Column(name = "demandeur_nom", length = 200)
    private String demandeurNom;

    @Column(length = 1000)
    private String motif = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    @Column(name = "traitee_par", length = 150)
    private String traiteePar;

    @Column(name = "date_demande", nullable = false, updatable = false)
    private Instant dateDemande = Instant.now();

    @Column(name = "date_decision")
    private Instant dateDecision;

    @Column(name = "commentaire_decision", length = 500)
    private String commentaireDecision;

    protected DemandeAcces() {
    }

    public DemandeAcces(String applicationCode, String applicationNom, String demandeurSujet,
                        String demandeurMatricule, String demandeurNom, String motif) {
        this.applicationCode = applicationCode;
        this.applicationNom = applicationNom;
        this.demandeurSujet = demandeurSujet;
        this.demandeurMatricule = demandeurMatricule;
        this.demandeurNom = demandeurNom;
        this.motif = motif == null ? "" : motif;
    }

    public void decider(StatutDemande statut, String par, String commentaire) {
        this.statut = statut;
        this.traiteePar = par;
        this.commentaireDecision = commentaire;
        this.dateDecision = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getApplicationCode() {
        return applicationCode;
    }

    public String getApplicationNom() {
        return applicationNom;
    }

    public String getDemandeurSujet() {
        return demandeurSujet;
    }

    public String getDemandeurMatricule() {
        return demandeurMatricule;
    }

    public String getDemandeurNom() {
        return demandeurNom;
    }

    public String getMotif() {
        return motif;
    }

    public StatutDemande getStatut() {
        return statut;
    }

    public String getTraiteePar() {
        return traiteePar;
    }

    public Instant getDateDemande() {
        return dateDemande;
    }

    public Instant getDateDecision() {
        return dateDecision;
    }

    public String getCommentaireDecision() {
        return commentaireDecision;
    }
}
