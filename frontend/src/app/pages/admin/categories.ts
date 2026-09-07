import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Categorie } from '../../core/models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Catégories</h2>
    <form id="form-categorie" class="card ligne" (ngSubmit)="enregistrer()">
      <h3 class="ftitre">{{ edition() ? 'Modifier « ' + code + ' »' : 'Nouvelle catégorie' }}</h3>
      <div class="field">
        <label>Code</label>
        <input [(ngModel)]="code" name="code" [disabled]="edition()" placeholder="EX : RH" />
      </div>
      <div class="field">
        <label>Libellé</label>
        <input [(ngModel)]="libelle" name="libelle" />
      </div>
      <div class="field">
        <label>Ordre</label>
        <input type="number" [(ngModel)]="ordre" name="ordre" />
      </div>
      <div class="btns">
        <button class="btn btn-primary">Enregistrer</button>
        @if (edition()) {
          <button type="button" class="btn btn-ghost" (click)="annuler()">Annuler</button>
        }
      </div>
    </form>

    <table class="grid">
      <thead>
        <tr><th>Code</th><th>Libellé</th><th>Ordre</th><th></th></tr>
      </thead>
      <tbody>
        @for (c of items(); track c.code) {
          <tr>
            <td class="mono">{{ c.code }}</td>
            <td><strong>{{ c.libelle }}</strong></td>
            <td>{{ c.ordreAffichage }}</td>
            <td class="right"><button class="btn btn-ghost btn-sm" (click)="editer(c)">Modifier</button></td>
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
      .ligne {
        display: grid;
        grid-template-columns: 1fr 2fr 0.6fr auto;
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
export class AdminCategories {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly items = signal<Categorie[]>([]);
  readonly edition = signal(false);
  code = '';
  libelle = '';
  ordre = 50;

  constructor() {
    this.charger();
  }

  private charger() {
    this.api.categories().subscribe((l) => this.items.set(l));
  }

  editer(c: Categorie) {
    this.edition.set(true);
    this.code = c.code;
    this.libelle = c.libelle;
    this.ordre = c.ordreAffichage;
    this.toast.info(`Modification de « ${c.code} » — formulaire ci-dessus.`);
    this.allerAuFormulaire();
  }

  annuler() {
    this.reinitialiser();
  }

  enregistrer() {
    if (!this.code.trim() || !this.libelle.trim()) {
      this.toast.erreur('Code et libellé requis.');
      return;
    }
    this.api
      .enregistrerCategorie({ code: this.code.trim(), libelle: this.libelle.trim(), ordreAffichage: this.ordre })
      .subscribe({
        next: () => {
          this.toast.succes('Catégorie enregistrée.');
          this.reinitialiser();
          this.charger();
        },
        error: (e) => this.toast.erreur(e?.error?.detail ?? 'Échec.'),
      });
  }

  private reinitialiser() {
    this.edition.set(false);
    this.code = '';
    this.libelle = '';
    this.ordre = 50;
  }

  private allerAuFormulaire() {
    setTimeout(() =>
      document
        .getElementById('form-categorie')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }
}
