package gouv.ministere.portail.repository;

import gouv.ministere.portail.domain.EvenementAudit;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Journal d'audit. <strong>Lecture et insertion uniquement</strong> : ne jamais exposer
 * {@code delete*} / {@code save} sur des entités existantes (la base l'interdit aussi).
 */
public interface EvenementAuditRepository extends JpaRepository<EvenementAudit, Long> {

    @Query("""
           select e from EvenementAudit e
           where (:sujet   is null or e.sujetUtilisateur = :sujet)
             and (:action  is null or e.action = :action)
             and (:codeApp is null or e.applicationCode = :codeApp)
             and (:debut   is null or e.horodatage >= :debut)
             and (:fin     is null or e.horodatage <  :fin)
           order by e.horodatage desc
           """)
    Page<EvenementAudit> rechercher(@Param("sujet") String sujet,
                                    @Param("action") String action,
                                    @Param("codeApp") String codeApp,
                                    @Param("debut") Instant debut,
                                    @Param("fin") Instant fin,
                                    Pageable pageable);

    /** Événements depuis une date, pour les agrégats du tableau de bord. */
    List<EvenementAudit> findByHorodatageGreaterThanEqual(Instant depuis);

    /** Derniers accès autorisés d'un utilisateur (pour « Accès récents »). */
    List<EvenementAudit> findTop30BySujetUtilisateurAndActionOrderByHorodatageDesc(
        String sujet, String action);
}
