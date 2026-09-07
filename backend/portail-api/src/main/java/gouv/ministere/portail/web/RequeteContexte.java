package gouv.ministere.portail.web;

import gouv.ministere.portail.service.ContexteAudit;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.util.StringUtils;

/** Construit le {@link ContexteAudit} à partir de la requête HTTP courante. */
public final class RequeteContexte {

    private RequeteContexte() {
    }

    public static ContexteAudit contexte(HttpServletRequest req) {
        String correlation = req.getHeader("X-Correlation-Id");
        if (!StringUtils.hasText(correlation)) {
            correlation = UUID.randomUUID().toString();
        }
        return new ContexteAudit(adresseIp(req), req.getHeader("User-Agent"), correlation);
    }

    private static String adresseIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
