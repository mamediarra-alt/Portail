package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.StatutApplication;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByCode(String code);

    boolean existsByCode(String code);

    /** Applications candidates à l'affichage : ni archivées, ni masquées. */
    @Query("""
           select a from Application a
           left join fetch a.categorie
           where a.archivee = false and a.statut <> :masquee
           order by a.ordreAffichage asc, a.nom asc
           """)
    List<Application> listerCandidatesCatalogue(StatutApplication masquee);

    /** Vue d'administration : toutes les applications non archivées. */
    @Query("select a from Application a left join fetch a.categorie where a.archivee = false "
            + "order by a.ordreAffichage asc, a.nom asc")
    List<Application> listerPourAdministration();
}
