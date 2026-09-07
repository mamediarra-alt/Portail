package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.DemandeAcces;
import gouv.ministere.portail.domain.StatutDemande;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemandeAccesRepository extends JpaRepository<DemandeAcces, Long> {

    List<DemandeAcces> findByDemandeurSujetOrderByDateDemandeDesc(String sujet);

    List<DemandeAcces> findByStatutOrderByDateDemandeAsc(StatutDemande statut);

    boolean existsByDemandeurSujetAndApplicationCodeAndStatut(
        String sujet, String applicationCode, StatutDemande statut);
}
