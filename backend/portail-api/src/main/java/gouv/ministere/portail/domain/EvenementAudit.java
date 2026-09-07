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

/**
 * Événement d'audit — <strong>append-only</strong>. Aucune méthode de modification ;
 * la base interdit également {@code UPDATE}/{@code DELETE} par déclencheur.
 */
@Entity
@Table(name = "evenement_audit")
public class EvenementAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Instant horodatage = Instant.now();

    @Column(name = "sujet_utilisateur", updatable = false, length = 150)
    private String sujetUtilisateur;

    @Column(name = "matricule", updatable = false, length = 50)
    private String matricule;

    @Column(name = "nom_utilisateur", updatable = false, length = 200)
    private String nomUtilisateur;

    @Column(nullable = false, updatable = false, length = 40)
    private String action;

    @Column(name = "application_code", updatable = false, length = 50)
    private String applicationCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 8)
    private ResultatAudit resultat;

    @Column(name = "adresse_ip", updatable = false, length = 45)
    private String adresseIp;

    @Column(name = "user_agent", updatable = false, length = 400)
    private String userAgent;

    @Column(name = "identifiant_correlation", updatable = false, length = 64)
    private String identifiantCorrelation;

    @Column(updatable = false, columnDefinition = "json")
    private String detail;

    protected EvenementAudit() {
    }

    private EvenementAudit(Builder b) {
        this.sujetUtilisateur = b.sujetUtilisateur;
        this.matricule = b.matricule;
        this.nomUtilisateur = b.nomUtilisateur;
        this.action = b.action;
        this.applicationCode = b.applicationCode;
        this.resultat = b.resultat;
        this.adresseIp = b.adresseIp;
        this.userAgent = b.userAgent;
        this.identifiantCorrelation = b.identifiantCorrelation;
        this.detail = b.detail;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public Instant getHorodatage() {
        return horodatage;
    }

    public String getSujetUtilisateur() {
        return sujetUtilisateur;
    }

    public String getMatricule() {
        return matricule;
    }

    public String getNomUtilisateur() {
        return nomUtilisateur;
    }

    public String getAction() {
        return action;
    }

    public String getApplicationCode() {
        return applicationCode;
    }

    public ResultatAudit getResultat() {
        return resultat;
    }

    public String getAdresseIp() {
        return adresseIp;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public String getIdentifiantCorrelation() {
        return identifiantCorrelation;
    }

    public String getDetail() {
        return detail;
    }

    /** Construction d'un événement immuable. */
    public static final class Builder {
        private String sujetUtilisateur;
        private String matricule;
        private String nomUtilisateur;
        private String action;
        private String applicationCode;
        private ResultatAudit resultat = ResultatAudit.SUCCES;
        private String adresseIp;
        private String userAgent;
        private String identifiantCorrelation;
        private String detail;

        public Builder sujet(String sujet, String matricule, String nom) {
            this.sujetUtilisateur = sujet;
            this.matricule = matricule;
            this.nomUtilisateur = nom;
            return this;
        }

        public Builder action(ActionAudit action) {
            this.action = action.name();
            return this;
        }

        public Builder application(String applicationCode) {
            this.applicationCode = applicationCode;
            return this;
        }

        public Builder resultat(ResultatAudit resultat) {
            this.resultat = resultat;
            return this;
        }

        public Builder requete(String adresseIp, String userAgent, String correlation) {
            this.adresseIp = adresseIp;
            this.userAgent = userAgent;
            this.identifiantCorrelation = correlation;
            return this;
        }

        public Builder detail(String detailJson) {
            this.detail = detailJson;
            return this;
        }

        public EvenementAudit build() {
            return new EvenementAudit(this);
        }
    }
}
