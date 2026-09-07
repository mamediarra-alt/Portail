package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.EffetPolitique;
import gouv.ministere.portail.domain.TypeReglePolitique;

/** Données d'ajout d'une politique d'accès. */
public record CommandePolitique(TypeReglePolitique typeRegle, String valeur, EffetPolitique effet) {
}
