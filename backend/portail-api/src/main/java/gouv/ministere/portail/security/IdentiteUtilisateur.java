package gouv.ministere.portail.security;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Projection des <em>claims</em> du jeton Keycloak. Objet valeur : jamais persisté (RG02).
 *
 * @param sujet     identifiant technique ({@code sub})
 * @param matricule matricule de l'agent ({@code matricule} / {@code employeeNumber})
 * @param nom       nom affiché
 * @param email     adresse électronique
 * @param roles     rôles realm ({@code realm_access.roles})
 * @param groupes   groupes ({@code groups})
 * @param origine   application d'appartenance ({@code origine}), si fournie
 */
public record IdentiteUtilisateur(
        String sujet,
        String matricule,
        String nom,
        String email,
        Set<String> roles,
        Set<String> groupes,
        String origine) {

    public static final String ROLE_ADMIN = "ADMIN_PORTAIL";
    public static final String ROLE_AUDITEUR = "AUDITEUR_PORTAIL";
    public static final String ROLE_AGENT = "AGENT";

    public boolean aRole(String role) {
        return roles.contains(role);
    }

    public boolean estAdministrateur() {
        return aRole(ROLE_ADMIN);
    }

    public boolean estAuditeur() {
        return aRole(ROLE_AUDITEUR) || estAdministrateur();
    }

    /** Construit l'identité à partir d'un jeton validé. */
    @SuppressWarnings("unchecked")
    public static IdentiteUtilisateur depuis(Jwt jwt) {
        Set<String> roles = new LinkedHashSet<>();
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> map && map.get("roles") instanceof Collection<?> r) {
            r.forEach(x -> roles.add(String.valueOf(x)));
        }
        Set<String> groupes = new LinkedHashSet<>();
        Object g = jwt.getClaim("groups");
        if (g instanceof Collection<?> c) {
            c.forEach(x -> groupes.add(String.valueOf(x)));
        }
        String nom = premierNonVide(
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("preferred_username"),
                jwt.getSubject());
        String matricule = premierNonVide(
                jwt.getClaimAsString("matricule"),
                jwt.getClaimAsString("employeeNumber"),
                jwt.getClaimAsString("preferred_username"));
        return new IdentiteUtilisateur(
                jwt.getSubject(),
                matricule,
                nom,
                jwt.getClaimAsString("email"),
                Set.copyOf(roles),
                Set.copyOf(groupes),
                jwt.getClaimAsString("origine"));
    }

    private static String premierNonVide(String... valeurs) {
        for (String v : valeurs) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return "inconnu";
    }

    /** Rôles Keycloak d'intérêt pour le portail, exposés en lecture. */
    public List<String> rolesPortail() {
        return roles.stream().filter(r -> r.startsWith("ADMIN") || r.startsWith("AUDITEUR")
                || r.equals(ROLE_AGENT) || r.startsWith("GESTIONNAIRE")).toList();
    }
}
