package gouv.ministere.portail.security;

import java.util.List;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Vérifie que le jeton est bien destiné à cette API : la valeur attendue doit figurer
 * dans {@code aud} ou dans {@code azp}. Si aucune audience n'est configurée, le contrôle
 * est ignoré (voir {@code portail.oidc.audience}).
 */
public class ValidateurAudience implements OAuth2TokenValidator<Jwt> {

    private final String attendue;

    public ValidateurAudience(String attendue) {
        this.attendue = attendue == null ? "" : attendue.trim();
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (attendue.isEmpty()) {
            return OAuth2TokenValidatorResult.success();
        }
        List<String> aud = jwt.getAudience();
        String azp = jwt.getClaimAsString("azp");
        if ((aud != null && aud.contains(attendue)) || attendue.equals(azp)) {
            return OAuth2TokenValidatorResult.success();
        }
        return OAuth2TokenValidatorResult.failure(new OAuth2Error(
            "invalid_token",
            "L'audience du jeton ne correspond pas à cette API (" + attendue + ")",
            null));
    }
}
