package gouv.ministere.portail.service;

/**
 * Éléments techniques de la requête, joints à chaque événement d'audit.
 *
 * @param adresseIp   adresse IP de l'appelant (selon la politique RGPD retenue)
 * @param userAgent   en-tête User-Agent, tronqué
 * @param correlation identifiant de corrélation propagé (trace)
 */
public record ContexteAudit(String adresseIp, String userAgent, String correlation) {

    public static ContexteAudit vide() {
        return new ContexteAudit(null, null, null);
    }
}
