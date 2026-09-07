-- Données de référence, requises dans tous les environnements. Idempotentes.

INSERT INTO categorie_application (code, libelle, ordre_affichage) VALUES
  ('SCOLARITE', 'Scolarité',           10),
  ('SERVICES',  'Services aux agents',  20),
  ('RH',        'Ressources humaines',  30),
  ('FINANCE',   'Finance',              40)
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle), ordre_affichage = VALUES(ordre_affichage);

INSERT INTO domaine_autorise (domaine, description, actif, cree_par) VALUES
  ('edusn.ministere.gouv',      'Application EDUSN (scolarité)', 1, 'systeme:migration'),
  ('restaurant.ministere.gouv', 'Application de restauration',   1, 'systeme:migration')
ON DUPLICATE KEY UPDATE description = VALUES(description), actif = VALUES(actif);

INSERT INTO configuration_portail (cle, valeur, description, modifie_par) VALUES
  ('portail.titre',                'Portail Applicatif du Ministère',         'Titre affiché dans l''en-tête',         'systeme:migration'),
  ('portail.sous_titre',           'Accès unifié aux applications',           'Sous-titre de la page d''accueil',       'systeme:migration'),
  ('portail.banniere_message',     '',                                       'Bandeau d''information (vide = masqué)', 'systeme:migration'),
  ('portail.lien_support',         'https://support.ministere.gouv',          'Lien d''assistance',                    'systeme:migration'),
  ('portail.mentions_legales_url', 'https://ministere.gouv/mentions-legales', 'URL des mentions légales',              'systeme:migration')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Espaces réservés pour les applications réelles : masquées, sans politique active,
-- jusqu'à l'étape d'intégration (déclaration d'un client Keycloak).
INSERT INTO application
  (code, nom, description, url_acces, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'EDUSN', 'EDUSN', 'Gestion des établissements scolaires.',
       'https://edusn.ministere.gouv/', c.id, 'MASQUEE', 10,
       0, 1, 0, 'systeme:migration', 'systeme:migration'
FROM categorie_application c WHERE c.code = 'SCOLARITE'
ON DUPLICATE KEY UPDATE nom = VALUES(nom);

INSERT INTO application
  (code, nom, description, url_acces, categorie_id, statut, ordre_affichage,
   ouvrir_nouvel_onglet, sensible, archivee, cree_par, modifie_par)
SELECT 'RESTAURANT', 'Restauration', 'Service de restauration du Ministère.',
       'https://restaurant.ministere.gouv/', c.id, 'MASQUEE', 20,
       0, 0, 0, 'systeme:migration', 'systeme:migration'
FROM categorie_application c WHERE c.code = 'SERVICES'
ON DUPLICATE KEY UPDATE nom = VALUES(nom);
