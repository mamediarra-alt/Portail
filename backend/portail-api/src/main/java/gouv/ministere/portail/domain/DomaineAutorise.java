package gouv.ministere.portail.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Liste blanche des domaines vers lesquels une redirection est autorisée (anti open-redirect). */
@Entity
@Table(name = "domaine_autorise")
public class DomaineAutorise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 253)
    private String domaine;

    @Column(nullable = false, length = 300)
    private String description = "";

    @Column(nullable = false)
    private boolean actif = true;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    @Column(name = "cree_par", nullable = false, updatable = false, length = 150)
    private String creePar;

    protected DomaineAutorise() {
    }

    public DomaineAutorise(String domaine, String description, String creePar) {
        this.domaine = domaine;
        this.description = description == null ? "" : description;
        this.creePar = creePar;
    }

    public Long getId() {
        return id;
    }

    public String getDomaine() {
        return domaine;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description == null ? "" : description;
    }

    public boolean isActif() {
        return actif;
    }

    public void setActif(boolean actif) {
        this.actif = actif;
    }

    public Instant getDateCreation() {
        return dateCreation;
    }

    public String getCreePar() {
        return creePar;
    }
}
