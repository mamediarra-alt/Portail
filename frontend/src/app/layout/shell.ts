import { Component, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../core/session.service';
import { AccueilSonoreService } from '../core/accueil-sonore.service';
import { ThemeService } from '../core/theme.service';
import { NotificationService } from '../core/notification.service';
import { ToastHost } from '../shared/toast-host';
import { CommandPalette } from '../shared/command-palette';
import { NotificationBell } from '../shared/notification-bell';
import { DrapeauSenegal } from '../shared/drapeau-senegal';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastHost,
    CommandPalette,
    NotificationBell,
    DrapeauSenegal,
  ],
  template: `
    <header class="bar">
      <div class="container inner">
        <a class="brand" routerLink="/tableau-de-bord">
          <app-drapeau-senegal class="logo" />
          <span class="brand-txt">
            <strong>Portail applicatif</strong>
            <em>Ministère de l'Emploi et de la Formation professionnelle et technique</em>
          </span>
        </a>

        <nav class="nav">
          <a routerLink="/tableau-de-bord" routerLinkActive="actif">Tableau de bord</a>
          <a routerLink="/etat-des-services" routerLinkActive="actif">État des services</a>
          <a routerLink="/profil" routerLinkActive="actif">Profil</a>
          @if (session.estAdmin()) {
            <a routerLink="/admin" routerLinkActive="actif">Administration</a>
          }
          @if (session.estAuditeur() && !session.estAdmin()) {
            <a routerLink="/admin/audit" routerLinkActive="actif">Audit</a>
          }
        </nav>

        <div class="user">
          <app-notification-bell />
          <button class="rond" type="button" title="Rechercher (Ctrl+K)" (click)="palette()?.basculer()">
            <span class="kbd">⌘K</span>
          </button>
          <button
            class="rond"
            type="button"
            [title]="theme.theme() === 'sombre' ? 'Passer en clair' : 'Passer en sombre'"
            (click)="theme.basculer()"
          >
            {{ theme.theme() === 'sombre' ? '☀' : '☾' }}
          </button>
          <button
            class="rond"
            type="button"
            [title]="accueil.muet() ? 'Accueil sonore coupé' : 'Couper l’accueil sonore'"
            (click)="accueil.basculerMuet()"
          >
            {{ accueil.muet() ? '🔇' : '🔊' }}
          </button>
          <span class="who">
            <span class="pastille">{{ initiales() }}</span>
            <span class="who-txt">
              <strong>{{ session.nom() }}</strong>
              <em>{{ roleLisible() }}</em>
            </span>
          </span>
          <button class="btn btn-ghost btn-sm" (click)="session.deconnexion()">Se déconnecter</button>
        </div>
      </div>
    </header>

    <main class="container zone">
      <router-outlet />
    </main>

    <footer class="pied">
      <div class="container">
        Portail Applicatif du Ministère · accès unifié aux applications · usage interne
      </div>
    </footer>

    <app-toast-host />
    <app-command-palette />
  `,
  styles: [
    `
      .bar {
        position: sticky;
        top: 0;
        z-index: 40;
        background: color-mix(in srgb, var(--surface) 88%, transparent);
        backdrop-filter: saturate(180%) blur(10px);
        border-bottom: 1px solid var(--border);
      }
      .inner {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        height: 68px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        text-decoration: none;
      }
      .logo {
        width: 34px;
        border-radius: 5px;
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        flex: none;
      }
      .brand-txt {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        max-width: 340px;
      }
      .brand-txt strong {
        color: var(--ink-violet);
        font-size: 1rem;
        letter-spacing: -0.02em;
      }
      .brand-txt em {
        color: var(--ink-faint);
        font-style: normal;
        font-size: 0.75rem;
      }
      .nav {
        display: flex;
        gap: 0.3rem;
        margin-left: auto;
      }
      .nav a {
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        font-weight: 700;
        color: var(--ink-soft);
        text-decoration: none;
        font-size: 0.92rem;
      }
      .nav a:hover {
        background: var(--surface-2);
        color: var(--ink);
      }
      .nav a.actif {
        color: #fff;
        background: var(--grad-blue);
      }
      .user {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .rond {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--ink);
        border-radius: 999px;
        min-width: 34px;
        height: 34px;
        padding: 0 0.5rem;
        cursor: pointer;
        font-size: 0.95rem;
        line-height: 1;
        transition: background 0.14s;
      }
      .rond:hover {
        background: var(--brand-050);
      }
      .kbd {
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--ink-faint);
      }
      .who {
        display: flex;
        align-items: center;
        gap: 0.55rem;
      }
      .pastille {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        color: #fff;
        background: var(--grad-violet);
      }
      .who-txt {
        display: flex;
        flex-direction: column;
        line-height: 1.1;
      }
      .who-txt strong {
        font-size: 0.9rem;
      }
      .who-txt em {
        font-style: normal;
        font-size: 0.75rem;
        color: var(--ink-cyan);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .zone {
        padding: 2rem 1.5rem 4rem;
        min-height: calc(100vh - 68px - 60px);
      }
      .pied {
        border-top: 1px solid var(--border);
        color: var(--ink-faint);
        font-size: 0.85rem;
      }
      .pied .container {
        padding: 1.2rem 1.5rem;
      }
      @media (max-width: 820px) {
        .who-txt,
        .brand-txt em {
          display: none;
        }
        .nav a {
          padding: 0.5rem 0.6rem;
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class Shell {
  readonly session = inject(SessionService);
  readonly accueil = inject(AccueilSonoreService);
  readonly theme = inject(ThemeService);
  readonly palette = viewChild(CommandPalette);
  private readonly notif = inject(NotificationService);

  constructor() {
    this.notif.demarrer();
  }

  initiales(): string {
    const n = this.session.nom().trim();
    if (!n) return '?';
    const p = n.split(/\s+/);
    return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase();
  }

  roleLisible(): string {
    if (this.session.estAdmin()) return 'Administrateur';
    if (this.session.estAuditeur()) return 'Auditeur';
    return 'Agent';
  }
}
