import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { EvenementAudit } from '../../core/models';
import { classeAction } from '../../shared/labels';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <h2>Journal d'audit</h2>
    <p class="muted">
      Journal en lecture seule. Chaque événement est aussi exporté vers le SIEM de l'État.
    </p>

    <form class="filtres card" (ngSubmit)="rechercher(0)">
      <div class="field">
        <label>Utilisateur (sub)</label>
        <input [(ngModel)]="fSujet" name="sujet" />
      </div>
      <div class="field">
        <label>Action</label>
        <input [(ngModel)]="fAction" name="action" placeholder="ex : ACCES_APPLICATION_REFUSE" />
      </div>
      <div class="field">
        <label>Application</label>
        <input [(ngModel)]="fApp" name="app" />
      </div>
      <button class="btn btn-primary">Rechercher</button>
      <button type="button" class="btn btn-ghost" (click)="exporterCsv()">⬇ CSV</button>
    </form>

    @if (chargement()) {
      <div class="spinner"></div>
    } @else {
      <table class="grid">
        <thead>
          <tr>
            <th>Horodatage</th>
            <th>Matricule</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Application</th>
            <th>Résultat</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          @for (e of page().contenu; track e.id) {
            <tr>
              <td class="mono nowrap">{{ e.horodatage | date: 'dd/MM/yy HH:mm:ss' }}</td>
              <td class="mono">{{ e.matricule ?? '—' }}</td>
              <td>{{ e.nomUtilisateur ?? e.sujetUtilisateur ?? '—' }}</td>
              <td><span class="badge" [class]="classeAction(e.action)">{{ e.action }}</span></td>
              <td class="mono">{{ e.applicationCode ?? '—' }}</td>
              <td>
                @if (e.resultat === 'SUCCES') {
                  <span class="badge badge-green">Succès</span>
                } @else {
                  <span class="badge badge-rose">Échec</span>
                }
              </td>
              <td class="mono">{{ e.adresseIp ?? '—' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="muted center">Aucun événement.</td></tr>
          }
        </tbody>
      </table>

      <div class="pagination">
        <button class="btn btn-ghost btn-sm" [disabled]="page().page === 0" (click)="rechercher(page().page - 1)">
          ← Précédent
        </button>
        <span class="muted">
          Page {{ page().page + 1 }} · {{ page().total }} événement(s)
        </span>
        <button
          class="btn btn-ghost btn-sm"
          [disabled]="(page().page + 1) * page().taille >= page().total"
          (click)="rechercher(page().page + 1)"
        >
          Suivant →
        </button>
      </div>
    }
  `,
  styles: [
    `
      h2 {
        color: var(--ink-indigo);
      }
      .filtres {
        display: grid;
        grid-template-columns: 1fr 1.4fr 1fr auto auto;
        gap: 1rem;
        align-items: end;
        padding: 1.3rem;
        margin-bottom: 1.4rem;
      }
      .nowrap {
        white-space: nowrap;
      }
      .center {
        text-align: center;
      }
      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 1.2rem;
      }
    `,
  ],
})
export class AdminAudit {
  private readonly api = inject(ApiService);
  readonly classeAction = classeAction;

  readonly page = signal<{ contenu: EvenementAudit[]; page: number; taille: number; total: number }>({
    contenu: [],
    page: 0,
    taille: 50,
    total: 0,
  });
  readonly chargement = signal(true);

  fSujet = '';
  fAction = '';
  fApp = '';

  constructor() {
    this.rechercher(0);
  }

  exporterCsv(): void {
    const lignes = [
      ['horodatage', 'matricule', 'utilisateur', 'sujet', 'action', 'application', 'resultat', 'ip', 'correlation'],
      ...this.page().contenu.map((e) => [
        e.horodatage,
        e.matricule ?? '',
        e.nomUtilisateur ?? '',
        e.sujetUtilisateur ?? '',
        e.action,
        e.applicationCode ?? '',
        e.resultat,
        e.adresseIp ?? '',
        e.identifiantCorrelation ?? '',
      ]),
    ];
    const csv = lignes.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-portail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  rechercher(p: number): void {
    this.chargement.set(true);
    this.api
      .audit({
        sujet: this.fSujet.trim() || undefined,
        action: this.fAction.trim() || undefined,
        applicationCode: this.fApp.trim() || undefined,
        page: p,
        taille: 50,
      })
      .subscribe({
        next: (r) => {
          this.page.set(r);
          this.chargement.set(false);
        },
        error: () => this.chargement.set(false),
      });
  }
}
