// Modèles alignés sur les DTO de portail-api / portail-bff.

export type StatutApplication = 'ACTIVE' | 'MAINTENANCE' | 'INDISPONIBLE' | 'MASQUEE';
export type TypeReglePolitique = 'ROLE_REQUIS' | 'GROUPE_REQUIS' | 'ORIGINE_REQUISE' | 'OUVERT_A_TOUS';
export type EffetPolitique = 'AUTORISER' | 'REFUSER';
export type StatutValidationPolitique =
  | 'ACTIVE_DIRECTE'
  | 'EN_ATTENTE_APPROBATION'
  | 'APPROUVEE'
  | 'REJETEE';

export interface Session {
  authentifie: boolean;
  nom: string | null;
  email: string | null;
  roles: string[];
}

export interface ItemCatalogue {
  code: string;
  nom: string;
  description: string;
  urlIcone: string | null;
  categorieCode: string | null;
  categorieLibelle: string | null;
  statut: StatutApplication;
  accesBloque: boolean;
  ouvrirNouvelOnglet: boolean;
}

export interface DetailApplication {
  code: string;
  nom: string;
  description: string;
  urlIcone: string | null;
  categorieLibelle: string | null;
  statut: StatutApplication;
  accesBloque: boolean;
}

export interface ReponseAcces {
  url: string;
  nouvelOnglet: boolean;
}

export interface Profil {
  sujet: string;
  nom: string;
  email: string | null;
  roles: string[];
  groupes: string[];
  origine: string | null;
  administrateur: boolean;
  auditeur: boolean;
}

export interface ConfigItem {
  cle: string;
  valeur: string;
  description: string;
}

export interface ApplicationAdmin {
  code: string;
  nom: string;
  description: string;
  urlAcces: string;
  urlIcone: string | null;
  categorieCode: string | null;
  statut: StatutApplication;
  ordreAffichage: number;
  ouvrirNouvelOnglet: boolean;
  sensible: boolean;
  archivee: boolean;
  dateModification: string;
}

export interface Categorie {
  code: string;
  libelle: string;
  ordreAffichage: number;
}

export interface DomaineAutorise {
  domaine: string;
  description: string;
  actif: boolean;
}

export interface Politique {
  id: number;
  typeRegle: TypeReglePolitique;
  valeur: string | null;
  effet: EffetPolitique;
  actif: boolean;
  statutValidation: StatutValidationPolitique;
  demandeePar: string;
  approuveePar: string | null;
  dateDecision: string | null;
}

export interface PageAudit {
  contenu: EvenementAudit[];
  page: number;
  taille: number;
  total: number;
}

export interface EvenementAudit {
  id: number;
  horodatage: string;
  sujetUtilisateur: string | null;
  matricule: string | null;
  nomUtilisateur: string | null;
  action: string;
  applicationCode: string | null;
  resultat: 'SUCCES' | 'ECHEC';
  adresseIp: string | null;
  identifiantCorrelation: string | null;
}

export interface PolitiqueEnAttente {
  id: number;
  applicationCode: string;
  applicationNom: string;
  typeRegle: string;
  valeur: string | null;
  effet: string;
  demandeePar: string;
  dateDemande: string;
}

export interface UtilisateurActivite {
  sujet: string;
  matricule: string;
  nom: string;
  acces: number;
  refus: number;
  actionsAdmin: number;
  derniereActivite: string;
}

export interface ConnexionAgent {
  matricule: string | null;
  nom: string | null;
  sujet: string | null;
  connexions: number;
  echecs: number;
  premiere: string;
  derniere: string;
  derniereIp: string | null;
  dernierNavigateur: string | null;
}

export interface ConnexionRecente {
  horodatage: string;
  matricule: string | null;
  nom: string | null;
  adresseIp: string | null;
  navigateur: string | null;
  resultat: 'SUCCES' | 'ECHEC';
}

export interface ApercuConnexions {
  agents: ConnexionAgent[];
  recentes: ConnexionRecente[];
}

export interface MaDemande {
  id: number;
  applicationCode: string;
  applicationNom: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE';
  motif: string;
  dateDemande: string;
  dateDecision: string | null;
  commentaireDecision: string | null;
}

export interface DemandeAdmin {
  id: number;
  applicationCode: string;
  applicationNom: string;
  demandeurMatricule: string | null;
  demandeurNom: string | null;
  motif: string;
  statut: string;
  dateDemande: string;
}

export interface ServiceEtat {
  nom: string;
  type: string;
  etat: string;
  detail: string;
}

export interface EtatServices {
  verifieLe: string;
  composants: ServiceEtat[];
  applications: ServiceEtat[];
}

export interface Statistiques {
  nbApplications: number;
  nbApplicationsActives: number;
  nbCategories: number;
  politiquesEnAttente: number;
  accesAujourdhui: number;
  refusAujourdhui: number;
  refus15min: number;
  septDerniersJours: { date: string; autorises: number; refuses: number }[];
  topApplications: { code: string; nom: string; nombre: number }[];
}

export interface NotificationItem {
  id: number;
  titre: string;
  corps: string;
  type: 'INFO' | 'SUCCES' | 'ALERTE';
  lien: string | null;
  lue: boolean;
  dateCreation: string;
}

export interface AccesARecertifier {
  id: number;
  applicationCode: string;
  applicationNom: string;
  beneficiaireSujet: string;
  dateExpiration: string;
  expire: boolean;
}
