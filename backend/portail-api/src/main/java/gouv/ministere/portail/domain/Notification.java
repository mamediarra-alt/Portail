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

/** Notification personnelle affichée à l'utilisateur (cloche de l'en-tête). */
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "destinataire_sujet", nullable = false, length = 150)
    private String destinataireSujet;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(nullable = false, length = 600)
    private String corps = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TypeNotification type = TypeNotification.INFO;

    @Column(length = 300)
    private String lien;

    @Column(nullable = false)
    private boolean lue;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation = Instant.now();

    protected Notification() {
    }

    public Notification(String destinataireSujet, String titre, String corps,
                        TypeNotification type, String lien) {
        this.destinataireSujet = destinataireSujet;
        this.titre = titre;
        this.corps = corps == null ? "" : corps;
        this.type = type;
        this.lien = lien;
    }

    public void marquerLue() {
        this.lue = true;
    }

    public Long getId() {
        return id;
    }

    public String getDestinataireSujet() {
        return destinataireSujet;
    }

    public String getTitre() {
        return titre;
    }

    public String getCorps() {
        return corps;
    }

    public TypeNotification getType() {
        return type;
    }

    public String getLien() {
        return lien;
    }

    public boolean isLue() {
        return lue;
    }

    public Instant getDateCreation() {
        return dateCreation;
    }
}
