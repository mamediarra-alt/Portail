import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, CommandeApplication } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ApplicationAdmin, Categorie, StatutApplication } from '../../core/models';
import { classeStatut, libelleStatut } from '../../shared/labels';

const VIDE: CommandeApplication = {
  code: '',
  nom: '',
  description: '',
  urlAcces: 'https://',
  urlIcone: null,
  categorieCode: null,
  statut: 'MASQUEE',
  ordreAffichage: 100,
  ouvrirNouvelOnglet: false,
  sensible: false,
};

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="tete">
      <h2>Applications du catalogue</h2>
      <span class="actions-tete">
        <button class="btn btn-ghost" (click)="exporter()">⬇ Exporter (JSON)</button>
        <button class="btn btn-violet" (click)="nouveau()">+ Nouvelle application</button>
      </span>
    </div>

    @if (form(); as f) {
      <form id="form-application" class="card formulaire" (ngSubmit)="enregistrer()">
        <h3>{{ edition() ? 'Modifier « ' + f.code + ' »' : 'Nouvelle application' }}</h3>
        <div class="field-row">
          <div class="field">
            <label>Code (optionnel)</label>
            <input
              [(ngModel)]="f.code"
              name="code"
              [disabled]="edition()"
              placeholder="Laissé vide = généré depuis le nom"
            />
          </div>
          <div class="field">
            <label>Nom</label>
            <input [(ngModel)]="f.nom" name="nom" />
          </div>
        </div>
        <div class="field">
          <label>Description</label>
          <textarea [(ngModel)]="f.description" name="description" rows="2"></textarea>
        </div>
        <div class="field-row">
          <div class="field">
            <label>URL d'accès (https)</label>
            <input [(ngModel)]="f.urlAcces" name="urlAcces" />
          </div>
          <div class="field">
            <label>URL de l'icône</label>
            <input [ngModel]="f.urlIcone" (ngModelChange)="f.urlIcone = $event || null" name="urlIcone" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Catégorie</label>
            <select [ngModel]="f.categorieCode" (ngModelChange)="f.categorieCode = $event || null" name="cat">
              <option [ngValue]="null">— aucune —</option>
              @for (c of categories(); track c.code) {
                <option [ngValue]="c.code">{{ c.libelle }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Statut</label>
            <select [(ngModel)]="f.statut" name="statut">
              @for (s of statuts; track s) {
                <option [ngValue]="s">{{ libelleStatut(s) }}</option>
              }
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Ordre d'affichage</label>
            <input type="number" [(ngModel)]="f.ordreAffichage" name="ordre" />
          </div>
          <div class="cases">
            <label class="case"><input type="checkbox" [(ngModel)]="f.ouvrirNouvelOnglet" name="onglet" /> Ouvrir dans un nouvel onglet</label>
            <label class="case"><input type="checkbox" [(ngModel)]="f.sensible" name="sensible" /> Application sensible (double validation des politiques)</label>
          </div>
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="enreg()">
            {{ enreg() ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
          <button type="button" class="btn btn-ghost" (click)="form.set(null)">Annuler</button>
        </div>
      </form>
    }

    @if (chargement()) {
      <div class="spinner"></div>
    } @else {
      <table class="grid">
        <thead>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Statut</th>
            <th>Sensible</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (a of apps(); track a.code) {
            <tr>
              <td class="mono">{{ a.code }}</td>
              <td><strong>{{ a.nom }}</strong></td>
              <td>{{ a.categorieCode ?? '—' }}</td>
              <td><span class="badge" [class]="classeStatut(a.statut)">{{ libelleStatut(a.statut) }}</span></td>
              <td>@if (a.sensible) { <span class="badge badge-rose">Oui</span> } @else { <span class="muted">non</span> }</td>
              <td class="right">
                <a class="lien" [routerLink]="['/admin/politiques']" [queryParams]="{ app: a.code }">Politiques</a>
                <button class="btn btn-ghost btn-sm" (click)="editer(a)">Modifier</button>
                <button class="btn btn-rose btn-sm" (click)="archiver(a)">Archiver</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [
    `
      .tete {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .actions-tete {
        display: flex;
        gap: 0.5rem;
      }
      h2 {
        color: var(--ink-indigo);
        margin: 0;
      }
      .formulaire {
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .formulaire h3 {
        margin-top: 0;
        color: var(--ink-violet);
      }
      .cases {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        justify-content: center;
      }
      .case {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: var(--ink);
        text-transform: none;
      }
      .case input {
        width: auto;
      }
      .actions {
        display: flex;
        gap: 0.6rem;
        margin-top: 0.5rem;
      }
      .right {
        text-align: right;
        white-space: nowrap;
        display: flex;
        gap: 0.4rem;
        justify-content: flex-end;
        align-items: center;
      }
      .lien {
        font-weight: 700;
        color: var(--ink-blue);
        margin-right: 0.3rem;
      }
    `,
  ],
})
export class AdminApplications {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly classeStatut = classeStatut;
  readonly libelleStatut = libelleStatut;
  readonly statuts: StatutApplication[] = ['ACTIVE', 'MAINTENANCE', 'INDISPONIBLE', 'MASQUEE'];

  readonly apps = signal<ApplicationAdmin[]>([]);
  readonly categories = signal<Categorie[]>([]);
  readonly chargement = signal(true);
  readonly form = signal<CommandeApplication | null>(null);
  readonly edition = signal(false);
  readonly enreg = signal(false);

  constructor() {
    this.charger();
    this.api.categories().subscribe((c) => this.categories.set(c));
  }

  private charger(): void {
    this.chargement.set(true);
    this.api.adminApplications().subscribe({
      next: (l) => {
        this.apps.set(l);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  nouveau(): void {
    this.edition.set(false);
    this.form.set({ ...VIDE });
    this.allerAuFormulaire();
  }

  editer(a: ApplicationAdmin): void {
    this.edition.set(true);
    this.form.set({
      code: a.code,
      nom: a.nom,
      description: a.description,
      urlAcces: a.urlAcces,
      urlIcone: a.urlIcone,
      categorieCode: a.categorieCode,
      statut: a.statut,
      ordreAffichage: a.ordreAffichage,
      ouvrirNouvelOnglet: a.ouvrirNouvelOnglet,
      sensible: a.sensible,
    });
    this.toast.info(`Modification de « ${a.code} » — formulaire ci-dessus.`);
    this.allerAuFormulaire();
  }

  private allerAuFormulaire(): void {
    setTimeout(() =>
      document
        .getElementById('form-application')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  enregistrer(): void {
    const f = this.form();
    if (!f) return;
    this.enreg.set(true);
    const obs = this.edition()
      ? this.api.modifierApplication(f.code, f)
      : this.api.creerApplication(f);
    obs.subscribe({
      next: () => {
        this.enreg.set(false);
        this.form.set(null);
        this.toast.succes('Application enregistrée.');
        this.charger();
      },
      error: (e) => {
        this.enreg.set(false);
        this.toast.erreur(e?.error?.detail ?? "Échec de l'enregistrement.");
      },
    });
  }

  exporter(): void {
    const contenu = JSON.stringify(this.apps(), null, 2);
    const url = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogue-portail-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  archiver(a: ApplicationAdmin): void {
    if (!confirm(`Archiver l'application « ${a.nom} » ? Elle disparaîtra du catalogue.`)) return;
    this.api.archiverApplication(a.code).subscribe({
      next: () => {
        this.toast.succes('Application archivée.');
        this.charger();
      },
      error: () => this.toast.erreur("Échec de l'archivage."),
    });
  }
}
