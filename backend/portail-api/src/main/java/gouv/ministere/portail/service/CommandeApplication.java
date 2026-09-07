package gouv.ministere.portail.service;

import gouv.ministere.portail.domain.StatutApplication;

/** Données de création / modification d'une application (déjà validées en format par la couche web). */
public record CommandeApplication(
        String code,
        String nom,
        String description,
        String urlAcces,
        String urlIcone,
        String categorieCode,
        StatutApplication statut,
        int ordreAffichage,
        boolean ouvrirNouvelOnglet,
        boolean sensible) {
}
