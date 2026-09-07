package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.AgentDemo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentDemoRepository extends JpaRepository<AgentDemo, String> {
}
