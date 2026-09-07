package gouv.ministere.portail;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.EffetPolitique;
import gouv.ministere.portail.domain.MotifRefus;
import gouv.ministere.portail.domain.PolitiqueAcces;
import gouv.ministere.portail.domain.StatutApplication;
import gouv.ministere.portail.domain.StatutValidationPolitique;
import gouv.ministere.portail.domain.TypeReglePolitique;
import gouv.ministere.portail.repository.PolitiqueAccesRepository;
import gouv.ministere.portail.security.IdentiteUtilisateur;
import gouv.ministere.portail.service.DecisionAcces;
import gouv.ministere.portail.service.ServiceControleAcces;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ServiceControleAccesTest {

    @Mock
    PolitiqueAccesRepository politiques;

    @InjectMocks
    ServiceControleAcces service;

    private final IdentiteUtilisateur agent = new IdentiteUtilisateur(
        "u1", "MIN-0001", "Agent", "a@x", Set.of("AGENT"), Set.of(), null);

    private Application app(StatutApplication statut, boolean archivee) {
        Application a = new Application();
        a.setCode("APP");
        a.setStatut(statut);
        a.setArchivee(archivee);
        return a;
    }

    private PolitiqueAcces politique(TypeReglePolitique type, String valeur, EffetPolitique effet) {
        PolitiqueAcces p = new PolitiqueAcces();
        p.setTypeRegle(type);
        p.setValeur(valeur);
        p.setEffet(effet);
        p.setActif(true);
        p.setStatutValidation(StatutValidationPolitique.ACTIVE_DIRECTE);
        return p;
    }

    @Test
    void refuse_si_archivee() {
        DecisionAcces d = service.evaluer(agent, app(StatutApplication.ACTIVE, true));
        assertThat(d.autorise()).isFalse();
        assertThat(d.motif()).isEqualTo(MotifRefus.APPLICATION_ARCHIVEE);
    }

    @Test
    void refuse_si_masquee() {
        DecisionAcces d = service.evaluer(agent, app(StatutApplication.MASQUEE, false));
        assertThat(d.motif()).isEqualTo(MotifRefus.APPLICATION_MASQUEE);
    }

    @Test
    void refuse_si_aucune_politique_autorisante() {
        when(politiques.findByApplicationIdAndActifTrue(null)).thenReturn(List.of());
        DecisionAcces d = service.evaluer(agent, app(StatutApplication.ACTIVE, false));
        assertThat(d.autorise()).isFalse();
        assertThat(d.motif()).isEqualTo(MotifRefus.AUCUNE_POLITIQUE_AUTORISANTE);
    }

    @Test
    void autorise_si_role_requis_present() {
        when(politiques.findByApplicationIdAndActifTrue(null))
            .thenReturn(List.of(politique(TypeReglePolitique.ROLE_REQUIS, "AGENT", EffetPolitique.AUTORISER)));
        DecisionAcces d = service.evaluer(agent, app(StatutApplication.ACTIVE, false));
        assertThat(d.autorise()).isTrue();
        assertThat(d.applicationBloquee()).isFalse();
    }

    @Test
    void refus_explicite_prime_sur_autorisation() {
        when(politiques.findByApplicationIdAndActifTrue(null)).thenReturn(List.of(
            politique(TypeReglePolitique.OUVERT_A_TOUS, null, EffetPolitique.AUTORISER),
            politique(TypeReglePolitique.ROLE_REQUIS, "AGENT", EffetPolitique.REFUSER)));
        DecisionAcces d = service.evaluer(agent, app(StatutApplication.ACTIVE, false));
        assertThat(d.autorise()).isFalse();
        assertThat(d.motif()).isEqualTo(MotifRefus.POLITIQUE_REFUS);
    }

    @Test
    void autorise_mais_bloquee_si_maintenance() {
        when(politiques.findByApplicationIdAndActifTrue(null))
            .thenReturn(List.of(politique(TypeReglePolitique.OUVERT_A_TOUS, null, EffetPolitique.AUTORISER)));
        DecisionAcces d = service.evaluer(agent, app(StatutApplication.MAINTENANCE, false));
        assertThat(d.autorise()).isTrue();
        assertThat(d.applicationBloquee()).isTrue();
    }
}
