import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';
import { EtatServices, ServiceEtat } from '../core/models';

@Component({
  selector: 'app-etat-services',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h1 class="titre">État des services</h1>

    @if (etat(); as e) {
      <p class="muted">Dernière vérification : {{ e.verifieLe | date: 'dd/MM/yy HH:mm:ss' }}</p>

      <h3>Composants du portail</h3>
      <div class="grille">
        @for (s of e.composants; track s.nom) {
          <div class="s" [class]="classe(s)">
            <span class="pt"></span>
            <div class="txt">
              <strong>{{ s.nom }}</strong>
              <span>{{ libelle(s.etat) }} · {{ s.detail }}</span>
            </div>
          </div>
        }
      </div>

      <h3 class="mt">Applications</h3>
      <div class="grille">
        @for (s of e.applications; track s.detail) {
          <div class="s" [class]="classe(s)">
            <span class="pt"></span>
            <div class="txt">
              <strong>{{ s.nom }}</strong>
              <span>{{ libelle(s.etat) }}</span>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="spinner"></div>
    }
  `,
  styles: [
    `
      .titre {
        color: var(--brand-strong);
      }
      h3 {
        color: var(--brand-deep);
        margin: 1.4rem 0 0.7rem;
      }
      .mt {
        margin-top: 2rem;
      }
      .grille {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 0.9rem;
      }
      .s {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.9rem 1.1rem;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: var(--surface);
      }
      .pt {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex: none;
      }
      .txt {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }
      .txt span {
        font-size: 0.82rem;
        color: var(--ink-faint);
      }
      .ok .pt {
        background: var(--ok);
        box-shadow: 0 0 0 4px var(--ok-050);
      }
      .warn .pt {
        background: var(--warn);
        box-shadow: 0 0 0 4px var(--warn-050);
      }
      .ko .pt {
        background: var(--danger);
        box-shadow: 0 0 0 4px var(--danger-050);
      }
      .off .pt {
        background: #94a3b8;
      }
      .ok {
        border-color: color-mix(in srgb, var(--ok) 40%, var(--border));
      }
      .ko {
        border-color: color-mix(in srgb, var(--danger) 40%, var(--border));
      }
    `,
  ],
})
export class EtatServicesPage {
  private readonly api = inject(ApiService);
  readonly etat = signal<EtatServices | null>(null);

  constructor() {
    this.api.etatServices().subscribe((e) => this.etat.set(e));
  }

  classe(s: ServiceEtat): string {
    switch (s.etat) {
      case 'OPERATIONNEL':
        return 'ok';
      case 'MAINTENANCE':
        return 'warn';
      case 'INDISPONIBLE':
        return 'ko';
      default:
        return 'off';
    }
  }
  libelle(etat: string): string {
    return (
      {
        OPERATIONNEL: 'Opérationnel',
        MAINTENANCE: 'En maintenance',
        INDISPONIBLE: 'Indisponible',
        MASQUEE: 'Non publiée',
      }[etat] ?? etat
    );
  }
}
