import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogueStore } from '../core/catalogue.store';
import { SessionService } from '../core/session.service';
import { ThemeService } from '../core/theme.service';

interface Cmd {
  id: string;
  titre: string;
  sous: string;
  icone: string;
  action: () => void;
  motsCles: string;
}

/** Palette de commandes globale — Ctrl/⌘ + K. Recherche d'applications + navigation. */
@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (ouvert()) {
      <div class="backdrop" (click)="fermer()">
        <div class="palette" (click)="$event.stopPropagation()">
          <div class="entree">
            <span class="loupe">⌘K</span>
            <input
              #champ
              [ngModel]="q()"
              (ngModelChange)="surSaisie($event)"
              name="q"
              placeholder="Rechercher une application, une action…"
              autocomplete="off"
            />
          </div>
          <ul class="res">
            @for (c of resultats(); track c.id; let i = $index) {
              <li [class.actif]="i === curseur()" (mouseenter)="curseur.set(i)" (click)="lancer(c)">
                <span class="ic">{{ c.icone }}</span>
                <span class="txt"><strong>{{ c.titre }}</strong><span>{{ c.sous }}</span></span>
              </li>
            } @empty {
              <li class="vide">Aucun résultat</li>
            }
          </ul>
          <div class="pied muted">↑ ↓ pour naviguer · Entrée pour ouvrir · Échap pour fermer</div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(9, 20, 33, 0.5);
        backdrop-filter: blur(3px);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 12vh;
        z-index: 300;
        animation: fade-in 0.15s ease;
      }
      .palette {
        width: min(620px, 92vw);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        animation: pop-in 0.2s var(--ease);
      }
      .entree {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 1rem 1.2rem;
        border-bottom: 1px solid var(--border);
      }
      .loupe {
        font-size: 0.72rem;
        font-weight: 800;
        color: var(--ink-faint);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.15rem 0.35rem;
      }
      .entree input {
        border: none;
        padding: 0;
        font-size: 1.05rem;
        background: transparent;
      }
      .entree input:focus {
        outline: none;
        box-shadow: none;
      }
      .res {
        list-style: none;
        margin: 0;
        padding: 0.4rem;
        max-height: 46vh;
        overflow: auto;
      }
      .res li {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.6rem 0.8rem;
        border-radius: 10px;
        cursor: pointer;
      }
      .res li.actif {
        background: var(--brand-050);
      }
      .ic {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: var(--surface-2);
        flex: none;
      }
      .txt {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .txt strong {
        font-size: 0.92rem;
      }
      .txt span {
        font-size: 0.78rem;
        color: var(--ink-faint);
      }
      .vide {
        color: var(--ink-faint);
        justify-content: center;
      }
      .pied {
        padding: 0.6rem 1.2rem;
        font-size: 0.76rem;
        border-top: 1px solid var(--border);
      }
    `,
  ],
})
export class CommandPalette {
  private readonly router = inject(Router);
  private readonly catalogue = inject(CatalogueStore);
  private readonly session = inject(SessionService);
  private readonly theme = inject(ThemeService);

  readonly ouvert = signal(false);
  readonly q = signal('');
  readonly curseur = signal(0);

  private commandes = computed<Cmd[]>(() => {
    const apps: Cmd[] = this.catalogue.apps().map((a) => ({
      id: 'app:' + a.code,
      titre: a.nom,
      sous: (a.categorieLibelle ?? 'Application') + (a.accesBloque ? ' · indisponible' : ''),
      icone: '▸',
      motsCles: (a.nom + ' ' + a.code + ' ' + (a.categorieLibelle ?? '')).toLowerCase(),
      action: () => this.router.navigate(['/application', a.code]),
    }));
    const nav: Cmd[] = [
      { id: 'nav:dash', titre: 'Tableau de bord', sous: 'Vos applications', icone: '⌂' },
      { id: 'nav:profil', titre: 'Mon profil', sous: 'Identité et rôles', icone: '☺' },
    ].map((n) => ({ ...n, motsCles: (n.titre + ' ' + n.sous).toLowerCase(), action: () => this.router.navigate([n.id === 'nav:dash' ? '/tableau-de-bord' : '/profil']) }));
    const admin: Cmd[] = this.session.estAdmin()
      ? [
          ['/admin', 'Administration', 'Tableau de bord admin'],
          ['/admin/applications', 'Gérer les applications', 'Catalogue'],
          ['/admin/politiques', "Politiques d'accès", 'Workflow de validation'],
          ['/admin/audit', "Journal d'audit", 'Traçabilité'],
        ].map(([url, t, s]) => ({
          id: 'adm:' + url,
          titre: t,
          sous: s,
          icone: '⚙',
          motsCles: (t + ' ' + s).toLowerCase(),
          action: () => this.router.navigate([url]),
        }))
      : [];
    const actions: Cmd[] = [
      {
        id: 'act:theme',
        titre: 'Basculer le thème clair / sombre',
        sous: 'Apparence',
        icone: '◐',
        motsCles: 'theme sombre clair dark mode apparence',
        action: () => this.theme.basculer(),
      },
      {
        id: 'act:logout',
        titre: 'Se déconnecter',
        sous: 'Fermer la session',
        icone: '⏻',
        motsCles: 'deconnexion logout quitter',
        action: () => this.session.deconnexion(),
      },
    ];
    return [...apps, ...nav, ...admin, ...actions];
  });

  readonly resultats = computed<Cmd[]>(() => {
    const t = this.q().trim().toLowerCase();
    const base = this.commandes();
    if (!t) {
      return base.slice(0, 8);
    }
    return base.filter((c) => c.motsCles.includes(t) || c.titre.toLowerCase().includes(t)).slice(0, 12);
  });

  @HostListener('window:keydown', ['$event'])
  raccourci(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.basculer();
      return;
    }
    if (!this.ouvert()) {
      return;
    }
    if (e.key === 'Escape') {
      this.fermer();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.curseur.set(Math.min(this.curseur() + 1, this.resultats().length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.curseur.set(Math.max(this.curseur() - 1, 0));
    } else if (e.key === 'Enter') {
      const c = this.resultats()[this.curseur()];
      if (c) {
        this.lancer(c);
      }
    }
  }

  basculer(): void {
    const o = !this.ouvert();
    this.ouvert.set(o);
    if (o) {
      this.q.set('');
      this.curseur.set(0);
      this.catalogue.charger();
      setTimeout(() => document.querySelector<HTMLInputElement>('.palette input')?.focus(), 30);
    }
  }

  fermer(): void {
    this.ouvert.set(false);
  }

  surSaisie(valeur: string): void {
    this.q.set(valeur);
    this.curseur.set(0);
  }

  lancer(c: Cmd): void {
    this.fermer();
    c.action();
  }
}
