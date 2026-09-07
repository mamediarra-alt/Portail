package gouv.ministere.portail.error;

/**
 * Anomalie de configuration détectée à l'exécution (ex. URL cible hors liste blanche).
 * Doit déclencher une alerte de sécurité, pas seulement un refus fonctionnel.
 */
public class ConfigurationInvalideException extends RuntimeException {

    public ConfigurationInvalideException(String message) {
        super(message);
    }
}
