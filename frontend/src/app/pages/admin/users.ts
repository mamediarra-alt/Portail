import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { UtilisateurActivite } from '../../core/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h2>Utilisateurs &amp; activité</h2>
    <p class="muted">
      Le portail ne gère pas les comptes (c'est le rôle du service d'identité). Cette vue
      récapitule l'activité observée dans le journal d'audit sur les 30 derniers jours.
    </p>

    @if (chargement()) {
      <div class="spinner"></div>
    } @else if (users().length === 0) {
      <p class="muted">Aucune activité enregistrée.</p>
    } @else {
      <table class="grid">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Utilisateur</th>
            <th>Identifiant</th>
            <th>Accès</th>
            <th>Refus</th>
            <th>Actions admin</th>
            <th>Dernière activité</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users(); track u.sujet) {
            <tr>
              <td><span class="mat">{{ u.matricule }}</span></td>
              <td>
                <span class="av">{{ initiales(u.nom) }}</span>
                <strong>{{ u.nom }}</strong>
              </td>
              <td class="mono">{{ u.sujet }}</td>
              <td><span class="badge badge-green">{{ u.acces }}</span></td>
              <td>
                @if (u.refus > 0) {
                  <span class="badge badge-rose">{{ u.refus }}</span>
                } @else {
                  <span class="muted">0</span>
                }
              </td>
              <td>
                @if (u.actionsAdmin > 0) {
                  <span class="badge badge-violet">{{ u.actionsAdmin }}</span>
                } @else {
                  <span class="muted">0</span>
                }
              </td>
              <td class="mono">{{ u.derniereActivite | date: 'dd/MM/yy HH:mm' }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: [
    `
      h2 {
        color: var(--ink-indigo);
      }
      .mat {
        font-family: 'Cascadia Code', 'Consolas', ui-monospace, monospace;
        font-weight: 800;
        color: var(--brand-strong);
        background: var(--brand-050);
        padding: 0.12rem 0.5rem;
        border-radius: 6px;
      }
      .av {
        display: inline-grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--grad-violet);
        color: #fff;
        font-size: 0.72rem;
        font-weight: 800;
        margin-right: 0.5rem;
        vertical-align: middle;
      }
    `,
  ],
})
export class AdminUsers {
  private readonly api = inject(ApiService);
  readonly users = signal<UtilisateurActivite[]>([]);
  readonly chargement = signal(true);

  constructor() {
    this.api.activiteUtilisateurs().subscribe({
      next: (l) => {
        this.users.set(l);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  initiales(nom: string): string {
    const p = nom.trim().split(/\s+/);
    return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase();
  }
}
