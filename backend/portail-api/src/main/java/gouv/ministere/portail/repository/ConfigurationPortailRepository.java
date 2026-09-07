package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.ConfigurationPortail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfigurationPortailRepository extends JpaRepository<ConfigurationPortail, String> {
}
