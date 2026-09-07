import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { ApercuConnexions } from '../../core/models';

@Component({
  selector: 'app-admin-connexions',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h2>Connexions des agents</h2>
    <p class="muted">
      Matricule et informations de connexion de chaque agent qui accède au portail
      (source : journal d'audit, 90 derniers jours).
    </p>

    @if (data(); as d) {
      <h3>Agents</h3>
      <table class="grid">
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Connexions</th>
            <th>Échecs</th>
            <th>Première</th>
            <th>Dernière</th>
            <th>Dernière IP</th>
            <th>Navigateur</th>
          </tr>
        </thead>
        <tbody>
          @for (a of d.agents; track a.matricule || a.sujet) {
            <tr>
              <td><span class="mat">{{ a.matricule ?? '—' }}</span></td>
              <td><strong>{{ a.nom ?? '—' }}</strong></td>
              <td><span class="badge badge-green">{{ a.connexions }}</span></td>
              <td>
                @if (a.echecs > 0) {
                  <span class="badge badge-rose">{{ a.echecs }}</span>
                } @else {
                  <span class="muted">0</span>
                }
              </td>
              <td class="mono">{{ a.premiere | date: 'dd/MM/yy' }}</td>
              <td class="mono">{{ a.derniere | date: 'dd/MM/yy HH:mm' }}</td>
              <td class="mono">{{ a.derniereIp ?? '—' }}</td>
              <td>{{ a.dernierNavigateur ?? '—' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="8" class="muted center">Aucune connexion enregistrée.</td></tr>
          }
        </tbody>
      </table>

      <h3 class="mt">Connexions récentes</h3>
      <table class="grid">
        <thead>
          <tr>
            <th>Horodatage</th>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Adresse IP</th>
            <th>Navigateur</th>
            <th>Résultat</th>
          </tr>
        </thead>
        <tbody>
          @for (e of d.recentes; track $index) {
            <tr>
              <td class="mono nowrap">{{ e.horodatage | date: 'dd/MM/yy HH:mm:ss' }}</td>
              <td class="mono">{{ e.matricule ?? '—' }}</td>
              <td>{{ e.nom ?? '—' }}</td>
              <td class="mono">{{ e.adresseIp ?? '—' }}</td>
              <td>{{ e.navigateur ?? '—' }}</td>
              <td>
                @if (e.resultat === 'SUCCES') {
                  <span class="badge badge-green">Réussie</span>
                } @else {
                  <span class="badge badge-rose">Échec</span>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="muted center">Aucune connexion récente.</td></tr>
          }
        </tbody>
      </table>
    } @else {
      <div class="spinner"></div>
    }
  `,
  styles: [
    `
      h2 {
        color: var(--ink-indigo);
      }
      h3 {
        color: var(--brand-deep);
        margin: 1.4rem 0 0.7rem;
      }
      .mt {
        margin-top: 2rem;
      }
      .mat {
        font-family: 'Cascadia Code', 'Consolas', ui-monospace, monospace;
        font-weight: 800;
        color: var(--brand-strong);
        background: var(--brand-050);
        padding: 0.12rem 0.5rem;
        border-radius: 6px;
      }
      .nowrap {
        white-space: nowrap;
      }
      .center {
        text-align: center;
      }
    `,
  ],
})
export class AdminConnexions {
  private readonly api = inject(ApiService);
  readonly data = signal<ApercuConnexions | null>(null);

  constructor() {
    this.api.connexions().subscribe((d) => this.data.set(d));
  }
}
