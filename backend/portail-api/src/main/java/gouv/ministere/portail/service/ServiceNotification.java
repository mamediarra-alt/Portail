package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.Notification;
import gouv.ministere.portail.domain.TypeNotification;
import gouv.ministere.portail.error.RessourceIntrouvableException;
import gouv.ministere.portail.repository.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Notifications personnelles (cloche de l'en-tête). */
@Service
public class ServiceNotification {

    private final NotificationRepository depot;

    public ServiceNotification(NotificationRepository depot) {
        this.depot = depot;
    }

    @Transactional
    public void creer(String destinataireSujet, String titre, String corps,
                      TypeNotification type, String lien) {
        depot.save(new Notification(destinataireSujet, titre, corps, type, lien));
    }

    @Transactional(readOnly = true)
    public List<Notification> pour(String sujet) {
        return depot.findTop30ByDestinataireSujetOrderByDateCreationDesc(sujet);
    }

    @Transactional(readOnly = true)
    public long compteNonLues(String sujet) {
        return depot.countByDestinataireSujetAndLueFalse(sujet);
    }

    @Transactional
    public void marquerLue(Long id, String sujet) {
        Notification n = depot.findById(id)
            .filter(x -> x.getDestinataireSujet().equals(sujet))
            .orElseThrow(() -> new RessourceIntrouvableException("Notification introuvable"));
        n.marquerLue();
    }

    @Transactional
    public void marquerToutesLues(String sujet) {
        depot.findByDestinataireSujetAndLueFalse(sujet).forEach(Notification::marquerLue);
    }
}
