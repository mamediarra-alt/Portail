package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.DomaineAutorise;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DomaineAutoriseRepository extends JpaRepository<DomaineAutorise, Long> {

    List<DomaineAutorise> findByActifTrue();

    Optional<DomaineAutorise> findByDomaine(String domaine);

    boolean existsByDomaine(String domaine);
}
