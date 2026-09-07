package gouv.ministere.portail.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Agent du Ministère habilité à se connecter au portail (mode démo, à défaut de Keycloak).
 * En production, cette identité vient du fournisseur d'identité de l'État.
 */
@Entity
@Table(name = "agent_demo")
public class AgentDemo {

    @Id
    @Column(length = 50)
    private String matricule;

    @Column(nullable = false, length = 200)
    private String nom;

    /** Empreinte du mot de passe ({bcrypt}… ou {noop}… en démo). */
    @Column(name = "mot_de_passe", nullable = false, length = 200)
    private String motDePasse;

    /** Rôles realm séparés par des virgules. */
    @Column(nullable = false, length = 300)
    private String roles = "AGENT";

    @Column(nullable = false)
    private boolean actif = true;

    @Column(name = "tentatives_echouees", nullable = false)
    private int tentativesEchouees;

    @Column(name = "verrouille_jusqu")
    private Instant verrouilleJusqu;

    protected AgentDemo() {
    }

    public boolean estVerrouille() {
        return verrouilleJusqu != null && verrouilleJusqu.isAfter(Instant.now());
    }

    public void echecConnexion(int seuil, java.time.Duration duree) {
        this.tentativesEchouees++;
        if (this.tentativesEchouees >= seuil) {
            this.verrouilleJusqu = Instant.now().plus(duree);
            this.tentativesEchouees = 0;
        }
    }

    public void succesConnexion() {
        this.tentativesEchouees = 0;
        this.verrouilleJusqu = null;
    }

    public String getMatricule() {
        return matricule;
    }

    public String getNom() {
        return nom;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public java.util.List<String> rolesListe() {
        return java.util.Arrays.stream(roles.split(",")).map(String::trim)
            .filter(s -> !s.isEmpty()).toList();
    }

    public boolean isActif() {
        return actif;
    }
}
