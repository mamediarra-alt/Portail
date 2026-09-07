package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.ActionAudit;
import gouv.ministere.portail.domain.Application;
import gouv.ministere.portail.domain.EvenementAudit;
import gouv.ministere.portail.domain.StatutValidationPolitique;
import gouv.ministere.portail.repository.ApplicationRepository;
import gouv.ministere.portail.repository.CategorieApplicationRepository;
import gouv.ministere.portail.repository.EvenementAuditRepository;
import gouv.ministere.portail.repository.PolitiqueAccesRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Agrégats pour le tableau de bord d'administration. */
@Service
public class ServiceStatistiques {

    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final String AUTORISE = ActionAudit.ACCES_APPLICATION_AUTORISE.name();
    private static final String REFUSE = ActionAudit.ACCES_APPLICATION_REFUSE.name();

    private final ApplicationRepository applications;
    private final CategorieApplicationRepository categories;
    private final PolitiqueAccesRepository politiques;
    private final EvenementAuditRepository audit;

    public ServiceStatistiques(ApplicationRepository applications,
                               CategorieApplicationRepository categories,
                               PolitiqueAccesRepository politiques,
                               EvenementAuditRepository audit) {
        this.applications = applications;
        this.categories = categories;
        this.politiques = politiques;
        this.audit = audit;
    }

    public record PointJour(String date, long autorises, long refuses) {
    }

    public record TopApplication(String code, String nom, long nombre) {
    }

    public record UtilisateurActivite(
            String sujet, String matricule, String nom, long acces, long refus, long actionsAdmin,
            java.time.Instant derniereActivite) {
    }

    public record ConnexionAgent(
            String matricule, String nom, String sujet, long connexions, long echecs,
            java.time.Instant premiere, java.time.Instant derniere,
            String derniereIp, String dernierNavigateur) {
    }

    public record ConnexionRecente(
            java.time.Instant horodatage, String matricule, String nom,
            String adresseIp, String navigateur, String resultat) {
    }

    public record ApercuConnexions(List<ConnexionAgent> agents, List<ConnexionRecente> recentes) {
    }

    /** Matricules et informations de connexion des agents (90 derniers jours). */
    @Transactional(readOnly = true)
    public ApercuConnexions apercuConnexions() {
        var depuis = LocalDate.now(ZONE).minusDays(90).atStartOfDay(ZONE).toInstant();
        List<EvenementAudit> conn = audit.findByHorodatageGreaterThanEqual(depuis).stream()
            .filter(e -> "CONNEXION".equals(e.getAction()))
            .sorted(Comparator.comparing(EvenementAudit::getHorodatage).reversed())
            .toList();

        Map<String, ConnexionAgent> parAgent = new LinkedHashMap<>();
        for (EvenementAudit e : conn) {
            String cle = e.getMatricule() != null ? e.getMatricule() : e.getSujetUtilisateur();
            if (cle == null) {
                continue;
            }
            boolean succes = "SUCCES".equals(e.getResultat().name());
            ConnexionAgent a = parAgent.get(cle);
            if (a == null) {
                parAgent.put(cle, new ConnexionAgent(
                    e.getMatricule(), e.getNomUtilisateur(), e.getSujetUtilisateur(),
                    succes ? 1 : 0, succes ? 0 : 1,
                    e.getHorodatage(), e.getHorodatage(),
                    e.getAdresseIp(), navigateur(e.getUserAgent())));
            } else {
                parAgent.put(cle, new ConnexionAgent(
                    a.matricule(), a.nom(), a.sujet(),
                    a.connexions() + (succes ? 1 : 0), a.echecs() + (succes ? 0 : 1),
                    e.getHorodatage().isBefore(a.premiere()) ? e.getHorodatage() : a.premiere(),
                    a.derniere(), a.derniereIp(), a.dernierNavigateur()));
            }
        }

        List<ConnexionRecente> recentes = conn.stream().limit(30)
            .map(e -> new ConnexionRecente(
                e.getHorodatage(), e.getMatricule(), e.getNomUtilisateur(),
                e.getAdresseIp(), navigateur(e.getUserAgent()), e.getResultat().name()))
            .toList();

        return new ApercuConnexions(new ArrayList<>(parAgent.values()), recentes);
    }

    private static String navigateur(String ua) {
        if (ua == null) {
            return "—";
        }
        if (ua.contains("Edg/")) {
            return "Edge";
        }
        if (ua.contains("Firefox/")) {
            return "Firefox";
        }
        if (ua.contains("Chrome/")) {
            return "Chrome";
        }
        if (ua.contains("Safari/")) {
            return "Safari";
        }
        return "Autre";
    }

    /** Activité des utilisateurs vue par le journal d'audit (30 derniers jours). */
    @Transactional(readOnly = true)
    public List<UtilisateurActivite> activiteUtilisateurs() {
        var depuis = LocalDate.now(ZONE).minusDays(29).atStartOfDay(ZONE).toInstant();
        Map<String, long[]> compteurs = new LinkedHashMap<>();
        Map<String, String> noms = new LinkedHashMap<>();
        Map<String, String> matricules = new LinkedHashMap<>();
        Map<String, java.time.Instant> derniere = new LinkedHashMap<>();
        for (EvenementAudit e : audit.findByHorodatageGreaterThanEqual(depuis)) {
            String s = e.getSujetUtilisateur();
            if (s == null) {
                continue;
            }
            long[] c = compteurs.computeIfAbsent(s, k -> new long[3]);
            noms.putIfAbsent(s, e.getNomUtilisateur() != null ? e.getNomUtilisateur() : s);
            if (e.getMatricule() != null) {
                matricules.putIfAbsent(s, e.getMatricule());
            }
            derniere.merge(s, e.getHorodatage(), (a, b) -> a.isAfter(b) ? a : b);
            String a = e.getAction();
            if (a.equals(AUTORISE)) {
                c[0]++;
            } else if (a.equals(REFUSE)) {
                c[1]++;
            } else if (a.startsWith("ADMIN_")) {
                c[2]++;
            }
        }
        return compteurs.entrySet().stream()
            .map(en -> new UtilisateurActivite(
                en.getKey(), matricules.getOrDefault(en.getKey(), "—"), noms.get(en.getKey()),
                en.getValue()[0], en.getValue()[1], en.getValue()[2],
                derniere.get(en.getKey())))
            .sorted(Comparator.comparing(UtilisateurActivite::derniereActivite).reversed())
            .toList();
    }

    public record Statistiques(
            long nbApplications,
            long nbApplicationsActives,
            long nbCategories,
            long politiquesEnAttente,
            long accesAujourdhui,
            long refusAujourdhui,
            long refus15min,
            List<PointJour> septDerniersJours,
            List<TopApplication> topApplications) {
    }

    @Transactional(readOnly = true)
    public Statistiques calculer() {
        List<Application> toutes = applications.listerPourAdministration();
        long nbActives = toutes.stream().filter(a -> a.getStatut().name().equals("ACTIVE")).count();

        var depuis = LocalDate.now(ZONE).minusDays(6).atStartOfDay(ZONE).toInstant();
        List<EvenementAudit> events = audit.findByHorodatageGreaterThanEqual(depuis);

        LocalDate aujourdhui = LocalDate.now(ZONE);
        long accesJour = events.stream()
            .filter(e -> e.getAction().equals(AUTORISE))
            .filter(e -> LocalDate.ofInstant(e.getHorodatage(), ZONE).equals(aujourdhui))
            .count();
        long refusJour = events.stream()
            .filter(e -> e.getAction().equals(REFUSE))
            .filter(e -> LocalDate.ofInstant(e.getHorodatage(), ZONE).equals(aujourdhui))
            .count();

        Map<LocalDate, long[]> parJour = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            parJour.put(aujourdhui.minusDays(i), new long[2]);
        }
        for (EvenementAudit e : events) {
            LocalDate j = LocalDate.ofInstant(e.getHorodatage(), ZONE);
            long[] c = parJour.get(j);
            if (c == null) {
                continue;
            }
            if (e.getAction().equals(AUTORISE)) {
                c[0]++;
            } else if (e.getAction().equals(REFUSE)) {
                c[1]++;
            }
        }
        List<PointJour> serie = parJour.entrySet().stream()
            .map(en -> new PointJour(en.getKey().toString(), en.getValue()[0], en.getValue()[1]))
            .toList();

        var ilYa15min = java.time.Instant.now().minus(15, ChronoUnit.MINUTES);
        long refus15 = events.stream()
            .filter(e -> e.getAction().equals(REFUSE))
            .filter(e -> e.getHorodatage().isAfter(ilYa15min))
            .count();

        Map<String, Long> parApp = new LinkedHashMap<>();
        events.stream().filter(e -> e.getAction().equals(AUTORISE) && e.getApplicationCode() != null)
            .forEach(e -> parApp.merge(e.getApplicationCode(), 1L, Long::sum));
        Map<String, String> noms = new LinkedHashMap<>();
        toutes.forEach(a -> noms.put(a.getCode(), a.getNom()));
        List<TopApplication> top = new ArrayList<>(parApp.entrySet().stream()
            .map(en -> new TopApplication(en.getKey(), noms.getOrDefault(en.getKey(), en.getKey()), en.getValue()))
            .sorted(Comparator.comparingLong(TopApplication::nombre).reversed())
            .limit(5)
            .toList());

        return new Statistiques(
            toutes.size(),
            nbActives,
            categories.count(),
            politiques.countByStatutValidation(StatutValidationPolitique.EN_ATTENTE_APPROBATION),
            accesJour,
            refusJour,
            refus15,
            serie,
            top);
    }

    /** Nombre de jours écoulés depuis une date (utilitaire d'affichage). */
    public static long joursDepuis(java.time.Instant t) {
        return ChronoUnit.DAYS.between(LocalDate.ofInstant(t, ZONE), LocalDate.now(ZONE));
    }
}
