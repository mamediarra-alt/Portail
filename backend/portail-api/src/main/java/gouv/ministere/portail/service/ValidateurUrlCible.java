package gouv.ministere.portail.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Validation des URL cibles du catalogue.
 *
 * <p>Une URL d'accès est acceptable dès lors qu'elle est en {@code https} et qu'elle pointe vers un
 * nom de domaine pleinement qualifié (au moins un point, une extension de 2 lettres ou plus). Toute
 * application professionnelle déjà déployée sur Internet peut donc être référencée directement par
 * son lien : elle devient alors une tuile cliquable du portail.</p>
 *
 * <p>Sont refusés : les schémas autres que {@code https}, les adresses IP brutes, les hôtes sans
 * domaine (ex. {@code intranet} seul) et les URL comportant des identifiants ({@code user:pass@}).</p>
 *
 * <p>En développement ({@code portail.acces.local=true}), on tolère également
 * {@code http(s)://localhost}, {@code 127.0.0.1} et les hôtes {@code *.local} pour les applications
 * lancées sur le poste.</p>
 */
@Service
public class ValidateurUrlCible {

    /** Nom de domaine pleinement qualifié : labels alphanumériques séparés par des points, TLD ≥ 2 lettres. */
    private static final Pattern DOMAINE_QUALIFIE = Pattern.compile(
        "^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$");

    private final boolean autoriserLocal;

    public ValidateurUrlCible(@Value("${portail.acces.local:false}") boolean autoriserLocal) {
        this.autoriserLocal = autoriserLocal;
    }

    public boolean estAutorisee(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        final URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException e) {
            return false;
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        String hote = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        if (hote.isEmpty()) {
            return false;
        }
        // Dev : autorise http(s)://localhost et 127.0.0.1 (applications lancées en local).
        if (autoriserLocal
                && (scheme.equals("http") || scheme.equals("https"))
                && (hote.equals("localhost") || hote.equals("127.0.0.1") || hote.endsWith(".local"))) {
            return true;
        }
        if (!scheme.equals("https")) {
            return false;
        }
        // Pas d'identifiants dans l'URL (user:pass@hote) — signe d'un lien non professionnel.
        if (uri.getUserInfo() != null) {
            return false;
        }
        // Uniquement un vrai nom de domaine d'application (exclut les IP brutes et les hôtes nus).
        return DOMAINE_QUALIFIE.matcher(hote).matches();
    }
}
