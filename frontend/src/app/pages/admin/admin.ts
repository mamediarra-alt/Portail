import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../../core/session.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <h1 class="titre">Administration du portail</h1>
    <p class="muted intro">
      Catalogue, catégories, politiques d'accès, domaines autorisés, configuration et audit.
    </p>

    <nav class="sub">
      <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="on">Vue d'ensemble</a>
      <a routerLink="applications" routerLinkActive="on">Applications</a>
      <a routerLink="politiques" routerLinkActive="on">Politiques d'accès</a>
      <a routerLink="demandes" routerLinkActive="on">Demandes d'accès</a>
      <a routerLink="utilisateurs" routerLinkActive="on">Utilisateurs</a>
      <a routerLink="connexions" routerLinkActive="on">Connexions</a>
      <a routerLink="categories" routerLinkActive="on">Catégories</a>
      <a routerLink="domaines" routerLinkActive="on">Domaines autorisés</a>
      <a routerLink="configuration" routerLinkActive="on">Configuration</a>
      @if (session.estAuditeur()) {
        <a routerLink="audit" routerLinkActive="on">Journal d'audit</a>
      }
    </nav>

    <router-outlet />
  `,
  styles: [
    `
      .titre {
        color: var(--ink-violet);
        margin-bottom: 0.2rem;
      }
      .intro {
        margin-top: 0;
      }
      .sub {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 1.2rem 0 1.6rem;
        border-bottom: 2px solid var(--border);
        padding-bottom: 0.6rem;
      }
      .sub a {
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        font-weight: 700;
        color: var(--ink-soft);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .sub a:hover {
        background: var(--surface-2);
      }
      .sub a.on {
        color: #fff;
        background: var(--grad-violet);
      }
    `,
  ],
})
export class Admin {
  readonly session = inject(SessionService);
}
