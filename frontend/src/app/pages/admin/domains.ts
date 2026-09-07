import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { DomaineAutorise } from '../../core/models';

@Component({
  selector: 'app-admin-domains',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Domaines autorisés</h2>
    <p class="muted">
      Liste blanche des domaines vers lesquels une redirection est permise. Toute URL d'accès
      d'application doit être en <strong class="green">https</strong> et pointer vers l'un de ces
      domaines (protection contre les redirections ouvertes).
    </p>

    <form id="form-domaine" class="card ligne" (ngSubmit)="enregistrer()">
      <h3 class="ftitre">{{ edition() ? 'Modifier « ' + domaine + ' »' : 'Nouveau domaine' }}</h3>
      <div class="field">
        <label>Domaine</label>
        <input [(ngModel)]="domaine" name="domaine" [disabled]="edition()" placeholder="ex : rh.ministere.gouv" />
      </div>
      <div class="field">
        <label>Description</label>
        <input [(ngModel)]="description" name="description" />
      </div>
      <label class="case"><input type="checkbox" [(ngModel)]="actif" name="actif" /> Actif</label>
      <div class="btns">
        <button class="btn btn-primary">Enregistrer</button>
        @if (edition()) {
          <button type="button" class="btn btn-ghost" (click)="annuler()">Annuler</button>
        }
      </div>
    </form>

    <table class="grid">
      <thead>
        <tr><th>Domaine</th><th>Description</th><th>État</th><th></th></tr>
      </thead>
      <tbody>
        @for (d of items(); track d.domaine) {
          <tr>
            <td class="mono">{{ d.domaine }}</td>
            <td>{{ d.description || '—' }}</td>
            <td>
              @if (d.actif) {
                <span class="badge badge-green">Actif</span>
              } @else {
                <span class="badge badge-slate">Inactif</span>
              }
            </td>
            <td class="right"><button class="btn btn-ghost btn-sm" (click)="editer(d)">Modifier</button></td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      h2 {
        color: var(--ink-indigo);
      }
      .green {
        color: var(--ink-green);
      }
      .ligne {
        display: grid;
        grid-template-columns: 1.2fr 1.6fr auto auto;
        gap: 1rem;
        align-items: end;
        padding: 1.3rem;
        margin-bottom: 1.4rem;
      }
      .ftitre {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--ink-violet);
      }
      .case {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-transform: none;
        font-weight: 600;
        color: var(--ink);
      }
      .case input {
        width: auto;
      }
      .btns {
        display: flex;
        gap: 0.5rem;
      }
      .right {
        text-align: right;
      }
    `,
  ],
})
export class AdminDomains {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly items = signal<DomaineAutorise[]>([]);
  readonly edition = signal(false);
  domaine = '';
  description = '';
  actif = true;

  constructor() {
    this.charger();
  }

  private charger() {
    this.api.domaines().subscribe((l) => this.items.set(l));
  }

  editer(d: DomaineAutorise) {
    this.edition.set(true);
    this.domaine = d.domaine;
    this.description = d.description;
    this.actif = d.actif;
    this.toast.info(`Modification de « ${d.domaine} » — formulaire ci-dessus.`);
    this.allerAuFormulaire();
  }

  annuler() {
    this.reinitialiser();
  }

  enregistrer() {
    if (!this.domaine.trim()) {
      this.toast.erreur('Domaine requis.');
      return;
    }
    this.api
      .enregistrerDomaine({
        domaine: this.domaine.trim().toLowerCase(),
        description: this.description.trim(),
        actif: this.actif,
      })
      .subscribe({
        next: () => {
          this.toast.succes('Domaine enregistré.');
          this.reinitialiser();
          this.charger();
        },
        error: (e) => this.toast.erreur(e?.error?.detail ?? 'Format de domaine invalide.'),
      });
  }

  private reinitialiser() {
    this.edition.set(false);
    this.domaine = '';
    this.description = '';
    this.actif = true;
  }

  private allerAuFormulaire() {
    setTimeout(() =>
      document
        .getElementById('form-domaine')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }
}
