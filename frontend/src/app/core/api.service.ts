import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AccesARecertifier,
  ApercuConnexions,
  ApplicationAdmin,
  Categorie,
  ConfigItem,
  DemandeAdmin,
  DetailApplication,
  DomaineAutorise,
  EffetPolitique,
  EtatServices,
  ItemCatalogue,
  MaDemande,
  NotificationItem,
  PageAudit,
  Politique,
  PolitiqueEnAttente,
  Profil,
  ReponseAcces,
  Statistiques,
  StatutApplication,
  TypeReglePolitique,
  UtilisateurActivite,
} from './models';

export interface CommandeApplication {
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
}

/** Accès unique à l'API du portail (via le BFF). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // --- Consultation -----------------------------------------------------
  catalogue(): Observable<ItemCatalogue[]> {
    return this.http.get<ItemCatalogue[]>('/api/catalogue');
  }
  catalogueDemandables(): Observable<ItemCatalogue[]> {
    return this.http.get<ItemCatalogue[]>('/api/catalogue/demandables');
  }
  mesDemandes(): Observable<MaDemande[]> {
    return this.http.get<MaDemande[]>('/api/demandes/miennes');
  }
  creerDemande(applicationCode: string, motif: string): Observable<MaDemande> {
    return this.http.post<MaDemande>('/api/demandes', { applicationCode, motif });
  }
  demandesEnAttente(): Observable<DemandeAdmin[]> {
    return this.http.get<DemandeAdmin[]>('/api/admin/demandes-acces');
  }
  approuverDemande(id: number): Observable<DemandeAdmin> {
    return this.http.post<DemandeAdmin>(`/api/admin/demandes-acces/${id}/approbation`, {});
  }
  refuserDemande(id: number, motif: string): Observable<DemandeAdmin> {
    return this.http.post<DemandeAdmin>(`/api/admin/demandes-acces/${id}/refus`, { motif });
  }
  etatServices(): Observable<EtatServices> {
    return this.http.get<EtatServices>('/api/etat-services');
  }
  notifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>('/api/notifications');
  }
  compteurNotifications(): Observable<{ nonLues: number }> {
    return this.http.get<{ nonLues: number }>('/api/notifications/compteur');
  }
  marquerNotifLue(id: number): Observable<void> {
    return this.http.post<void>(`/api/notifications/${id}/lue`, {});
  }
  marquerNotifsToutLu(): Observable<void> {
    return this.http.post<void>('/api/notifications/tout-lu', {});
  }
  accesARecertifier(): Observable<AccesARecertifier[]> {
    return this.http.get<AccesARecertifier[]>('/api/admin/acces-a-recertifier');
  }
  recertifier(id: number): Observable<void> {
    return this.http.post<void>(`/api/admin/politiques/${id}/recertification`, {});
  }
  revoquer(id: number): Observable<void> {
    return this.http.post<void>(`/api/admin/politiques/${id}/revocation`, {});
  }
  detail(code: string): Observable<DetailApplication> {
    return this.http.get<DetailApplication>(`/api/applications/${encodeURIComponent(code)}`);
  }
  acceder(code: string): Observable<ReponseAcces> {
    return this.http.post<ReponseAcces>(`/api/acces/${encodeURIComponent(code)}`, {});
  }
  profil(): Observable<Profil> {
    return this.http.get<Profil>('/api/moi');
  }
  config(): Observable<ConfigItem[]> {
    return this.http.get<ConfigItem[]>('/api/config');
  }
  mesAccesRecents(): Observable<{ code: string; nom: string; horodatage: string }[]> {
    return this.http.get<{ code: string; nom: string; horodatage: string }[]>('/api/mes-acces-recents');
  }
  statistiques(): Observable<Statistiques> {
    return this.http.get<Statistiques>('/api/admin/statistiques');
  }
  activiteUtilisateurs(): Observable<UtilisateurActivite[]> {
    return this.http.get<UtilisateurActivite[]>('/api/admin/statistiques/utilisateurs');
  }
  connexions(): Observable<ApercuConnexions> {
    return this.http.get<ApercuConnexions>('/api/admin/statistiques/connexions');
  }
  politiquesEnAttente(): Observable<PolitiqueEnAttente[]> {
    return this.http.get<PolitiqueEnAttente[]>('/api/admin/politiques-en-attente');
  }
  simuler(
    codeApp: string,
    profil: { roles: string[]; groupes: string[]; origine: string | null },
  ): Observable<{ autorise: boolean; applicationBloquee: boolean; motif: string | null }> {
    return this.http.post<{ autorise: boolean; applicationBloquee: boolean; motif: string | null }>(
      `/api/admin/applications/${encodeURIComponent(codeApp)}/simulation`,
      profil,
    );
  }

  // --- Administration : applications ----------------------------------
  adminApplications(): Observable<ApplicationAdmin[]> {
    return this.http.get<ApplicationAdmin[]>('/api/admin/applications');
  }
  creerApplication(cmd: CommandeApplication): Observable<ApplicationAdmin> {
    return this.http.post<ApplicationAdmin>('/api/admin/applications', cmd);
  }
  modifierApplication(code: string, cmd: CommandeApplication): Observable<ApplicationAdmin> {
    return this.http.put<ApplicationAdmin>(`/api/admin/applications/${encodeURIComponent(code)}`, cmd);
  }
  archiverApplication(code: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/applications/${encodeURIComponent(code)}`);
  }

  // --- Administration : catégories & domaines ------------------------
  categories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>('/api/admin/categories');
  }
  enregistrerCategorie(c: Categorie): Observable<Categorie> {
    return this.http.put<Categorie>('/api/admin/categories', c);
  }
  domaines(): Observable<DomaineAutorise[]> {
    return this.http.get<DomaineAutorise[]>('/api/admin/domaines-autorises');
  }
  enregistrerDomaine(d: DomaineAutorise): Observable<DomaineAutorise> {
    return this.http.put<DomaineAutorise>('/api/admin/domaines-autorises', d);
  }

  // --- Administration : politiques (workflow) -----------------------
  politiques(codeApp: string): Observable<Politique[]> {
    return this.http.get<Politique[]>(
      `/api/admin/applications/${encodeURIComponent(codeApp)}/politiques`,
    );
  }
  ajouterPolitique(
    codeApp: string,
    p: { typeRegle: TypeReglePolitique; valeur: string | null; effet: EffetPolitique },
  ): Observable<Politique> {
    return this.http.post<Politique>(
      `/api/admin/applications/${encodeURIComponent(codeApp)}/politiques`,
      p,
    );
  }
  approuverPolitique(id: number): Observable<Politique> {
    return this.http.post<Politique>(`/api/admin/politiques/${id}/approbation`, {});
  }
  rejeterPolitique(id: number, motif: string): Observable<Politique> {
    return this.http.post<Politique>(`/api/admin/politiques/${id}/rejet`, { motif });
  }

  // --- Administration : configuration & audit -----------------------
  majConfig(cle: string, valeur: string): Observable<ConfigItem> {
    return this.http.put<ConfigItem>(`/api/admin/config/${encodeURIComponent(cle)}`, { valeur });
  }
  audit(filtres: {
    sujet?: string;
    action?: string;
    applicationCode?: string;
    page?: number;
    taille?: number;
  }): Observable<PageAudit> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filtres)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return this.http.get<PageAudit>('/api/admin/audit', { params });
  }
}
