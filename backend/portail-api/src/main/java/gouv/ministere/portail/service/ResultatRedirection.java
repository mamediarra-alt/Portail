package gouv.ministere.portail.service;

/**
 * URL de redirection validée vers une application cible.
 *
 * @param url         URL canonique issue du catalogue (jamais une URL fournie par le client)
 * @param nouvelOnglet ouvrir dans un nouvel onglet
 */
public record ResultatRedirection(String url, boolean nouvelOnglet) {
}
