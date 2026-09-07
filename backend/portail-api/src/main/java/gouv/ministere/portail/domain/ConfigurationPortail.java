package gouv.ministere.portail.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Paramètre de configuration du portail (clé / valeur). */
@Entity
@Table(name = "configuration_portail")
public class ConfigurationPortail {

    @Id
    @Column(length = 100)
    private String cle;

    @Column(nullable = false, length = 2000)
    private String valeur = "";

    @Column(nullable = false, length = 300)
    private String description = "";

    @Column(name = "date_modification", nullable = false)
    private Instant dateModification = Instant.now();

    @Column(name = "modifie_par", nullable = false, length = 150)
    private String modifiePar;

    protected ConfigurationPortail() {
    }

    public String getCle() {
        return cle;
    }

    public String getValeur() {
        return valeur;
    }

    public void setValeur(String valeur) {
        this.valeur = valeur == null ? "" : valeur;
    }

    public String getDescription() {
        return description;
    }

    public Instant getDateModification() {
        return dateModification;
    }

    public void setDateModification(Instant dateModification) {
        this.dateModification = dateModification;
    }

    public String getModifiePar() {
        return modifiePar;
    }

    public void setModifiePar(String modifiePar) {
        this.modifiePar = modifiePar;
    }
}
