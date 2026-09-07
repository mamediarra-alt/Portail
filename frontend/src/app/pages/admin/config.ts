import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { ConfigItem } from '../../core/models';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Configuration du portail</h2>
    <p class="muted">Titre, bannière et liens affichés dans l'interface.</p>

    @if (items().length === 0) {
      <div class="spinner"></div>
    }
    <div class="liste">
      @for (c of items(); track c.cle) {
        <div class="card item">
          <div class="haut">
            <span class="cle mono">{{ c.cle }}</span>
            <span class="muted">{{ c.description }}</span>
          </div>
          <div class="edit">
            <input [(ngModel)]="c.valeur" [name]="c.cle" />
            <button class="btn btn-primary btn-sm" (click)="enregistrer(c)">Enregistrer</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      h2 {
        color: var(--ink-indigo);
      }
      .liste {
        display: grid;
        gap: 0.9rem;
      }
      .item {
        padding: 1.1rem 1.3rem;
      }
      .haut {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.6rem;
        flex-wrap: wrap;
      }
      .cle {
        font-weight: 800;
        color: var(--ink-violet);
      }
      .edit {
        display: flex;
        gap: 0.6rem;
      }
    `,
  ],
})
export class AdminConfig {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly items = signal<ConfigItem[]>([]);

  constructor() {
    this.api.config().subscribe((l) => this.items.set(l));
  }

  enregistrer(c: ConfigItem) {
    this.api.majConfig(c.cle, c.valeur).subscribe({
      next: () => this.toast.succes('Configuration mise à jour.'),
      error: (e) => this.toast.erreur(e?.error?.detail ?? 'Valeur refusée.'),
    });
  }
}
