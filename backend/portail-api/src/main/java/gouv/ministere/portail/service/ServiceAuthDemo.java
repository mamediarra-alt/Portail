package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.AgentDemo;
import gouv.ministere.portail.domain.ResultatAudit;
import gouv.ministere.portail.repository.AgentDemoRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentification des agents en mode démo (matricule + mot de passe), à défaut de Keycloak.
 * Verrouillage après échecs répétés, journalisation des tentatives.
 */
@Service
public class ServiceAuthDemo {

    public static final int SEUIL_VERROU = 5;
    private static final Duration DUREE_VERROU = Duration.ofMinutes(10);

    private final AgentDemoRepository agents;
    private final ServiceAudit audit;
    private final PasswordEncoder encodeur = PasswordEncoderFactories.createDelegatingPasswordEncoder();

    public ServiceAuthDemo(AgentDemoRepository agents, ServiceAudit audit) {
        this.agents = agents;
        this.audit = audit;
    }

    public record Resultat(String statut, IdentiteUtilisateur identite) {
        static Resultat ok(IdentiteUtilisateur i) {
            return new Resultat("OK", i);
        }

        static Resultat ko(String statut) {
            return new Resultat(statut, null);
        }
    }

    @Transactional
    public Resultat verifier(String matricule, String motDePasse, ContexteAudit ctx) {
        String mat = matricule == null ? "" : matricule.trim();
        AgentDemo agent = agents.findById(mat).orElse(null);

        if (agent == null || !agent.isActif()) {
            journaliser(mat, ResultatAudit.ECHEC, "matricule inconnu");
            return Resultat.ko("IDENTIFIANTS_INVALIDES");
        }
        if (agent.estVerrouille()) {
            journaliser(mat, ResultatAudit.ECHEC, "compte verrouillé");
            return Resultat.ko("VERROUILLE");
        }
        if (!encodeur.matches(motDePasse == null ? "" : motDePasse, agent.getMotDePasse())) {
            agent.echecConnexion(SEUIL_VERROU, DUREE_VERROU);
            journaliser(mat, ResultatAudit.ECHEC, "mot de passe invalide");
            return Resultat.ko("IDENTIFIANTS_INVALIDES");
        }

        agent.succesConnexion();
        journaliser(mat, ResultatAudit.SUCCES, null);
        return Resultat.ok(identite(agent));
    }

    @Transactional(readOnly = true)
    public IdentiteUtilisateur profil(String matricule) {
        return agents.findById(matricule == null ? "" : matricule.trim())
            .filter(AgentDemo::isActif)
            .map(this::identite)
            .orElse(null);
    }

    private IdentiteUtilisateur identite(AgentDemo a) {
        List<String> roles = a.rolesListe();
        return new IdentiteUtilisateur(
            "agent:" + a.getMatricule(), a.getMatricule(), a.getNom(), null,
            Set.copyOf(roles), Set.of(), null);
    }

    private void journaliser(String matricule, ResultatAudit resultat, String motif) {
        IdentiteUtilisateur u = new IdentiteUtilisateur(
            "agent:" + matricule, matricule, matricule, null, Set.of(), Set.of(), null);
        audit.journaliser(u, ActionAudit.CONNEXION, resultat, null, ContexteAudit.vide(),
            motif == null ? null : "{\"motif\":\"" + motif + "\"}");
    }
}
