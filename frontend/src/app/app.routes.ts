import { Routes } from '@angular/router';
import { adminGuard, auditeurGuard, authGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./pages/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
      {
        path: 'tableau-de-bord',
        loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'application/:code',
        loadComponent: () => import('./pages/app-detail').then((m) => m.AppDetail),
      },
      {
        path: 'profil',
        loadComponent: () => import('./pages/profile').then((m) => m.Profile),
      },
      {
        path: 'etat-des-services',
        loadComponent: () => import('./pages/etat-services').then((m) => m.EtatServicesPage),
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/admin/admin-home').then((m) => m.AdminHome),
          },
          {
            path: 'applications',
            loadComponent: () =>
              import('./pages/admin/applications').then((m) => m.AdminApplications),
          },
          {
            path: 'politiques',
            loadComponent: () => import('./pages/admin/policies').then((m) => m.AdminPolicies),
          },
          {
            path: 'demandes',
            loadComponent: () => import('./pages/admin/demandes').then((m) => m.AdminDemandes),
          },
          {
            path: 'categories',
            loadComponent: () => import('./pages/admin/categories').then((m) => m.AdminCategories),
          },
          {
            path: 'domaines',
            loadComponent: () => import('./pages/admin/domains').then((m) => m.AdminDomains),
          },
          {
            path: 'utilisateurs',
            loadComponent: () => import('./pages/admin/users').then((m) => m.AdminUsers),
          },
          {
            path: 'connexions',
            loadComponent: () => import('./pages/admin/connexions').then((m) => m.AdminConnexions),
          },
          {
            path: 'configuration',
            loadComponent: () => import('./pages/admin/config').then((m) => m.AdminConfig),
          },
          {
            path: 'audit',
            canActivate: [auditeurGuard],
            loadComponent: () => import('./pages/admin/audit').then((m) => m.AdminAudit),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
