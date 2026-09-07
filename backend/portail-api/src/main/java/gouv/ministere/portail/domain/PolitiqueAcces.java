package gouv.ministere.portail.domain;

import gouv.ministere.portail.security.IdentiteUtilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/** Règle « qui voit / peut accéder » à une application, appliquée au niveau du portail. */
@Entity
@Table(name = "politique_acces")
public class PolitiqueAcces {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_regle", nullable = false, length = 20)
    private TypeReglePolitique typeRegle;

    @Column(length = 150)
    private String valeur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private EffetPolitique effet = EffetPolitique.AUTORISER;

    @Column(nullable = false)
    private boolean actif;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_validation", nullable = false, length = 24)
    private StatutValidationPolitique statutValidation = StatutValidationPolitique.ACTIVE_DIRECTE;

    @Column(name = "demandee_par", nullable = false, length = 150)
    private String demandeePar;

    @Column(name = "approuvee_par", length = 150)
    private String approuveePar;

    @Column(name = "date_demande", nullable = false, updatable = false)
    private Instant dateDemande = Instant.now();

    @Column(name = "date_decision")
    private Instant dateDecision;

    @Column(name = "commentaire_decision", length = 500)
    private String commentaireDecision;

    /** Échéance de l'accès (accès nominatif) ; null = sans expiration. */
    @Column(name = "date_expiration")
    private Instant dateExpiration;

    public PolitiqueAcces() {
    }

    /** Prise en compte dans l'évaluation d'accès. */
    public boolean estEvaluable() {
        boolean nonExpiree = dateExpiration == null || dateExpiration.isAfter(Instant.now());
        return actif && nonExpiree
            && (statutValidation == StatutValidationPolitique.ACTIVE_DIRECTE
                || statutValidation == StatutValidationPolitique.APPROUVEE);
    }

    /** Vrai si l'identité satisfait la règle. */
    public boolean correspondA(IdentiteUtilisateur u) {
        return switch (typeRegle) {
            case OUVERT_A_TOUS -> true;
            case ROLE_REQUIS -> valeur != null && u.roles().contains(valeur);
            case GROUPE_REQUIS -> valeur != null && u.groupes().contains(valeur);
            case ORIGINE_REQUISE -> valeur != null && valeur.equals(u.origine());
            case UTILISATEUR_REQUIS -> valeur != null && valeur.equals(u.sujet());
        };
    }

    // --- accesseurs ---------------------------------------------------------

    public Long getId() {
        return id;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public TypeReglePolitique getTypeRegle() {
        return typeRegle;
    }

    public void setTypeRegle(TypeReglePolitique typeRegle) {
        this.typeRegle = typeRegle;
    }

    public String getValeur() {
        return valeur;
    }

    public void setValeur(String valeur) {
        this.valeur = valeur;
    }

    public EffetPolitique getEffet() {
        return effet;
    }

    public void setEffet(EffetPolitique effet) {
        this.effet = effet;
    }

    public boolean isActif() {
        return actif;
    }

    public void setActif(boolean actif) {
        this.actif = actif;
    }

    public StatutValidationPolitique getStatutValidation() {
        return statutValidation;
    }

    public void setStatutValidation(StatutValidationPolitique statutValidation) {
        this.statutValidation = statutValidation;
    }

    public String getDemandeePar() {
        return demandeePar;
    }

    public void setDemandeePar(String demandeePar) {
        this.demandeePar = demandeePar;
    }

    public String getApprouveePar() {
        return approuveePar;
    }

    public void setApprouveePar(String approuveePar) {
        this.approuveePar = approuveePar;
    }

    public Instant getDateDemande() {
        return dateDemande;
    }

    public Instant getDateDecision() {
        return dateDecision;
    }

    public void setDateDecision(Instant dateDecision) {
        this.dateDecision = dateDecision;
    }

    public String getCommentaireDecision() {
        return commentaireDecision;
    }

    public void setCommentaireDecision(String commentaireDecision) {
        this.commentaireDecision = commentaireDecision;
    }

    public Instant getDateExpiration() {
        return dateExpiration;
    }

    public void setDateExpiration(Instant dateExpiration) {
        this.dateExpiration = dateExpiration;
    }
}
