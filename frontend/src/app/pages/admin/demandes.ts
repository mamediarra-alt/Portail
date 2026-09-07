import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { DemandeAdmin } from '../../core/models';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h2>Demandes d'accès</h2>
    <p class="muted">
      Demandes formulées par les agents. Approuver crée un <strong>accès nominatif</strong>
      (politique <span class="mono">UTILISATEUR_REQUIS</span>) — l'application devient
      immédiatement visible pour le demandeur.
    </p>

    @if (chargement()) {
      <div class="spinner"></div>
    } @else if (demandes().length === 0) {
      <div class="panel vide muted">Aucune demande en attente. 🎉</div>
    } @else {
      <div class="liste">
        @for (d of demandes(); track d.id) {
          <div class="dm card">
            <div class="tete">
              <span class="app">{{ d.applicationNom }}</span>
              <span class="mono chip">{{ d.applicationCode }}</span>
              <span class="quand muted">{{ d.dateDemande | date: 'dd/MM/yy HH:mm' }}</span>
            </div>
            <div class="qui">
              <span class="mat">{{ d.demandeurMatricule ?? '—' }}</span>
              <strong>{{ d.demandeurNom ?? d.demandeurMatricule }}</strong>
            </div>
            @if (d.motif) {
              <p class="motif">« {{ d.motif }} »</p>
            }
            <div class="act">
              <button class="btn btn-green btn-sm" (click)="approuver(d)">Approuver</button>
              <button class="btn btn-rose btn-sm" (click)="refuser(d)">Refuser</button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      h2 {
        color: var(--ink-indigo);
      }
      .liste {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }
      .dm {
        padding: 1.1rem 1.3rem;
        border-left: 5px solid var(--accent);
      }
      .tete {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .app {
        font-weight: 800;
        font-size: 1.02rem;
      }
      .quand {
        margin-left: auto;
        font-size: 0.82rem;
      }
      .qui {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.6rem 0 0.3rem;
      }
      .mat {
        font-family: 'Cascadia Code', 'Consolas', ui-monospace, monospace;
        font-weight: 800;
        color: var(--brand-strong);
        background: var(--brand-050);
        padding: 0.12rem 0.5rem;
        border-radius: 6px;
      }
      .motif {
        margin: 0.3rem 0 0.7rem;
        color: var(--ink-soft);
        font-style: italic;
      }
      .act {
        display: flex;
        gap: 0.5rem;
      }
      .vide {
        text-align: center;
        padding: 2rem;
      }
    `,
  ],
})
export class AdminDemandes {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly demandes = signal<DemandeAdmin[]>([]);
  readonly chargement = signal(true);

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.chargement.set(true);
    this.api.demandesEnAttente().subscribe({
      next: (l) => {
        this.demandes.set(l);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  approuver(d: DemandeAdmin): void {
    this.api.approuverDemande(d.id).subscribe({
      next: () => {
        this.toast.succes(`Accès accordé à ${d.demandeurNom ?? d.demandeurMatricule}.`);
        this.charger();
      },
      error: () => this.toast.erreur("Échec de l'approbation."),
    });
  }

  refuser(d: DemandeAdmin): void {
    // prompt() est bloqué dans certains navigateurs intégrés (aperçu IDE) : on prévoit un motif par défaut.
    const motif = (prompt('Motif du refus ?') ?? '').trim() || 'Refusée par l’administrateur';
    this.api.refuserDemande(d.id, motif).subscribe({
      next: () => {
        this.toast.info('Demande refusée.');
        this.charger();
      },
      error: () => this.toast.erreur('Échec du refus.'),
    });
  }
}
