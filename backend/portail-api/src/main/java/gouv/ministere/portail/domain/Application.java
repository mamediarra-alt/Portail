package gouv.ministere.portail.domain;

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

/**
 * Entrée générique du catalogue : métadonnées d'une application du Ministère + URL d'accès.
 * Ne contient aucune donnée métier de l'application cible.
 */
@Entity
@Table(name = "application")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Clé métier, unique et immuable après création. */
    @Column(nullable = false, unique = true, updatable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(nullable = false, length = 1000)
    private String description = "";

    @Column(name = "url_acces", nullable = false, length = 2048)
    private String urlAcces;

    @Column(name = "url_icone", length = 2048)
    private String urlIcone;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categorie_id")
    private CategorieApplication categorie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutApplication statut = StatutApplication.MASQUEE;

    @Column(name = "ordre_affichage", nullable = false)
    private int ordreAffichage;

    @Column(name = "ouvrir_nouvel_onglet", nullable = false)
    private boolean ouvrirNouvelOnglet;

    /** Application sensible : les politiques d'accès passent en double validation. */
    @Column(nullable = false)
    private boolean sensible;

    /** Suppression logique : jamais de suppression physique (préservation de l'audit). */
    @Column(nullable = false)
    private boolean archivee;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    @Column(name = "date_modification", nullable = false)
    private Instant dateModification = Instant.now();

    @Column(name = "cree_par", nullable = false, updatable = false, length = 150)
    private String creePar;

    @Column(name = "modifie_par", nullable = false, length = 150)
    private String modifiePar;

    public Application() {
    }

    public boolean estMasquee() {
        return statut == StatutApplication.MASQUEE;
    }

    public boolean accesBloqueParStatut() {
        return statut == StatutApplication.MAINTENANCE || statut == StatutApplication.INDISPONIBLE;
    }

    public void toucher(String modifiePar) {
        this.modifiePar = modifiePar;
        this.dateModification = Instant.now();
    }

    // --- accesseurs -----------------------------------------------------------

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description == null ? "" : description;
    }

    public String getUrlAcces() {
        return urlAcces;
    }

    public void setUrlAcces(String urlAcces) {
        this.urlAcces = urlAcces;
    }

    public String getUrlIcone() {
        return urlIcone;
    }

    public void setUrlIcone(String urlIcone) {
        this.urlIcone = urlIcone;
    }

    public CategorieApplication getCategorie() {
        return categorie;
    }

    public void setCategorie(CategorieApplication categorie) {
        this.categorie = categorie;
    }

    public StatutApplication getStatut() {
        return statut;
    }

    public void setStatut(StatutApplication statut) {
        this.statut = statut;
    }

    public int getOrdreAffichage() {
        return ordreAffichage;
    }

    public void setOrdreAffichage(int ordreAffichage) {
        this.ordreAffichage = ordreAffichage;
    }

    public boolean isOuvrirNouvelOnglet() {
        return ouvrirNouvelOnglet;
    }

    public void setOuvrirNouvelOnglet(boolean ouvrirNouvelOnglet) {
        this.ouvrirNouvelOnglet = ouvrirNouvelOnglet;
    }

    public boolean isSensible() {
        return sensible;
    }

    public void setSensible(boolean sensible) {
        this.sensible = sensible;
    }

    public boolean isArchivee() {
        return archivee;
    }

    public void setArchivee(boolean archivee) {
        this.archivee = archivee;
    }

    public Instant getDateCreation() {
        return dateCreation;
    }

    public Instant getDateModification() {
        return dateModification;
    }

    public String getCreePar() {
        return creePar;
    }

    public void setCreePar(String creePar) {
        this.creePar = creePar;
    }

    public String getModifiePar() {
        return modifiePar;
    }

    public void setModifiePar(String modifiePar) {
        this.modifiePar = modifiePar;
    }
}
