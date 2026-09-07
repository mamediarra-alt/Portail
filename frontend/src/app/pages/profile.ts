import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { CatalogueStore } from '../core/catalogue.store';
import { Profil } from '../core/models';

const LIBELLES: Record<string, { nom: string; desc: string }> = {
  AGENT: { nom: 'Agent', desc: 'Consulte le catalogue et accède aux applications autorisées.' },
  ADMIN_PORTAIL: {
    nom: 'Administrateur du portail',
    desc: 'Gère le catalogue, les catégories, les politiques d’accès et la configuration.',
  },
  AUDITEUR_PORTAIL: {
    nom: 'Auditeur',
    desc: 'Consulte le journal d’audit (lecture seule).',
  },
  GESTIONNAIRE_HABILITATIONS: {
    nom: 'Gestionnaire d’habilitations',
    desc: 'Attribue et révoque les accès applicatifs.',
  },
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h1 class="titre">Mon profil</h1>

    @if (profil(); as p) {
      <div class="grille">
        <!-- Carte identité -->
        <div class="card identite">
          <span class="pastille">{{ initiales(p.nom) }}</span>
          <h2>{{ p.nom }}</h2>
          <p class="mail">{{ p.email ?? '—' }}</p>
          <div class="etats">
            <span class="badge badge-green">Compte actif</span>
            <span class="badge badge-blue">Session en cours</span>
          </div>
          <dl class="meta">
            <div><dt>Identifiant technique</dt><dd class="mono">{{ p.sujet }}</dd></div>
            <div><dt>Rôle principal</dt><dd>{{ rolePrincipal() }}</dd></div>
            <div><dt>Origine</dt><dd>{{ p.origine ?? '—' }}</dd></div>
          </dl>
        </div>

        <!-- Habilitations -->
        <div class="card">
          <h3>Rôles &amp; habilitations</h3>
          <ul class="roles">
            @for (r of p.roles; track r) {
              <li>
                <span class="r-nom">{{ libelle(r).nom }}</span>
                <span class="r-code chip mono">{{ r }}</span>
                <span class="r-desc muted">{{ libelle(r).desc }}</span>
              </li>
            } @empty {
              <li class="muted">Aucun rôle attribué.</li>
            }
          </ul>
          @if (p.groupes.length) {
            <h3 class="mt">Groupes</h3>
            <div class="tags">
              @for (g of p.groupes; track g) {
                <span class="tag">{{ g }}</span>
              }
            </div>
          }
        </div>

        <!-- Applications accessibles -->
        <div class="card">
          <h3>Vos applications <span class="cpt">{{ apps().length }}</span></h3>
          @if (apps().length) {
            <ul class="apps">
              @for (a of apps(); track a.code) {
                <li>
                  <span class="a-nom">{{ a.nom }}</span>
                  <span class="badge" [class]="a.accesBloque ? 'badge-amber' : 'badge-green'">
                    {{ a.accesBloque ? 'Indisponible' : 'Accessible' }}
                  </span>
                </li>
              }
            </ul>
          } @else {
            <p class="muted">Aucune application ouverte à votre profil.</p>
          }
        </div>

        <!-- Activité récente -->
        <div class="card">
          <h3>Activité récente</h3>
          @if (recents().length) {
            <ul class="acts">
              @for (e of recents(); track e.code) {
                <li>
                  <span class="dot"></span>
                  <span class="a-nom">Accès à {{ e.nom }}</span>
                  <span class="quand muted">{{ e.horodatage | date: 'dd/MM/yy HH:mm' }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="muted">Aucun accès enregistré pour l'instant.</p>
          }
        </div>
      </div>

      <p class="aide muted">
        La gestion du mot de passe et de la double authentification se fait dans l'espace
        « Mon compte » du service d'authentification de l'État.
      </p>
    } @else {
      <div class="spinner"></div>
    }
  `,
  styles: [
    `
      .titre {
        color: var(--brand-strong);
        margin-bottom: 1.4rem;
      }
      .grille {
        display: grid;
        grid-template-columns: 320px 1fr 1fr;
        gap: 1.2rem;
      }
      .identite {
        grid-row: span 2;
        padding: 1.7rem;
      }
      .card {
        padding: 1.4rem;
      }
      .card h3 {
        color: var(--brand-deep);
        font-size: 1rem;
        margin: 0 0 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .mt {
        margin-top: 1.4rem;
      }
      .cpt {
        font-size: 0.76rem;
        font-weight: 800;
        color: var(--brand-strong);
        background: var(--brand-050);
        padding: 0.05rem 0.5rem;
        border-radius: 999px;
      }
      .pastille {
        width: 68px;
        height: 68px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 1.5rem;
        color: #fff;
        background: var(--grad-violet);
        margin-bottom: 0.7rem;
      }
      h2 {
        margin: 0;
      }
      .mail {
        margin: 0.15rem 0 0.8rem;
        color: var(--ink-soft);
      }
      .etats {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .meta {
        margin: 1.2rem 0 0;
        display: grid;
        gap: 0.7rem;
      }
      .meta div {
        display: grid;
        gap: 0.1rem;
      }
      .meta dt {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ink-faint);
        font-weight: 700;
      }
      .meta dd {
        margin: 0;
        font-size: 0.86rem;
        word-break: break-all;
      }
      .roles {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.9rem;
      }
      .roles li {
        display: grid;
        grid-template-columns: auto auto;
        gap: 0.4rem 0.6rem;
        align-items: center;
      }
      .r-nom {
        font-weight: 800;
        color: var(--ink);
      }
      .r-desc {
        grid-column: 1 / -1;
        font-size: 0.84rem;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .tag {
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.8rem;
        background: var(--brand-050);
        color: var(--brand-strong);
      }
      .apps,
      .acts {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.6rem;
      }
      .apps li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.9rem;
      }
      .a-nom {
        font-weight: 700;
      }
      .acts li {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.88rem;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--brand);
        flex: none;
      }
      .quand {
        margin-left: auto;
        font-size: 0.8rem;
      }
      .aide {
        margin-top: 1.4rem;
        font-size: 0.88rem;
        max-width: 60ch;
      }
      @media (max-width: 980px) {
        .grille {
          grid-template-columns: 1fr;
        }
        .identite {
          grid-row: auto;
        }
      }
    `,
  ],
})
export class Profile {
  private readonly api = inject(ApiService);
  private readonly store = inject(CatalogueStore);

  readonly profil = signal<Profil | null>(null);
  readonly recents = signal<{ code: string; nom: string; horodatage: string }[]>([]);
  readonly apps = computed(() => this.store.apps());

  private readonly ordreRoles = ['ADMIN_PORTAIL', 'AUDITEUR_PORTAIL', 'GESTIONNAIRE_HABILITATIONS', 'AGENT'];

  constructor() {
    this.api.profil().subscribe((p) => this.profil.set(p));
    this.api.mesAccesRecents().subscribe({ next: (l) => this.recents.set(l), error: () => {} });
    this.store.charger().catch(() => {});
  }

  libelle(role: string): { nom: string; desc: string } {
    return LIBELLES[role] ?? { nom: role, desc: '' };
  }

  rolePrincipal(): string {
    const roles = this.profil()?.roles ?? [];
    const p = this.ordreRoles.find((r) => roles.includes(r));
    return p ? this.libelle(p).nom : 'Agent';
  }

  initiales(nom: string): string {
    const p = nom.trim().split(/\s+/);
    return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase();
  }
}
