package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.PolitiqueAcces;
import gouv.ministere.portail.domain.StatutValidationPolitique;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PolitiqueAccesRepository extends JpaRepository<PolitiqueAcces, Long> {

    List<PolitiqueAcces> findByApplicationId(Long applicationId);

    /** Politiques prises en compte dans l'évaluation d'accès d'une application. */
    List<PolitiqueAcces> findByApplicationIdAndActifTrue(Long applicationId);

    long countByStatutValidation(StatutValidationPolitique statut);

    List<PolitiqueAcces> findByStatutValidationOrderByDateDemandeDesc(StatutValidationPolitique statut);

    /** Accès nominatifs actifs qui expirent bientôt ou sont déjà expirés. */
    @Query("""
           select p from PolitiqueAcces p join fetch p.application
           where p.typeRegle = gouv.ministere.portail.domain.TypeReglePolitique.UTILISATEUR_REQUIS
             and p.actif = true
             and p.dateExpiration is not null
             and p.dateExpiration <= :limite
           order by p.dateExpiration asc
           """)
    List<PolitiqueAcces> aRecertifier(Instant limite);
}
