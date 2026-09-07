package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.CategorieApplication;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategorieApplicationRepository extends JpaRepository<CategorieApplication, Long> {

    Optional<CategorieApplication> findByCode(String code);

    boolean existsByCode(String code);

    List<CategorieApplication> findAllByOrderByOrdreAffichageAsc();
}
