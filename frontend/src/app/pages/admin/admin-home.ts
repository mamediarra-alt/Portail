import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { AccesARecertifier, PolitiqueEnAttente, Statistiques } from '../../core/models';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    @if (stats()?.refus15min && stats()!.refus15min >= 3) {
      <div class="alerte-secu">
        🚨 <strong>{{ stats()!.refus15min }} refus d'accès</strong> dans les 15 dernières minutes —
        vérifiez le <a routerLink="/admin/audit">journal d'audit</a>.
      </div>
    }

    @if (aRecertifier().length) {
      <div class="card recert">
        <h3>🔁 Accès à re-certifier <span class="cpt">{{ aRecertifier().length }}</span></h3>
        <ul>
          @for (a of aRecertifier(); track a.id) {
            <li>
              <span class="ra-app">{{ a.applicationNom }}</span>
              <span class="mono chip">{{ a.beneficiaireSujet }}</span>
              <span [class.muted]="!a.expire" [class.exp]="a.expire">
                {{ a.expire ? 'expiré' : 'expire' }} le {{ a.dateExpiration | date: 'dd/MM/yy' }}
              </span>
              <span class="ra-act">
                <button class="btn btn-green btn-sm" (click)="recertifier(a)">Prolonger</button>
                <button class="btn btn-rose btn-sm" (click)="revoquer(a)">Révoquer</button>
              </span>
            </li>
          }
        </ul>
      </div>
    }

    @if (enAttente().length) {
      <div class="card valider">
        <h3>🕓 Politiques à valider <span class="cpt">{{ enAttente().length }}</span></h3>
        <ul>
          @for (p of enAttente(); track p.id) {
            <li>
              <span class="pa-app">{{ p.applicationNom }}</span>
              <span class="pa-regle">
                <span class="e" [class.autor]="p.effet === 'AUTORISER'" [class.refus]="p.effet === 'REFUSER'">{{ p.effet }}</span>
                {{ p.typeRegle }}@if (p.valeur) { · <span class="mono">{{ p.valeur }}</span> }
              </span>
              <span class="pa-dem muted">demandée par {{ p.demandeePar }} · {{ p.dateDemande | date: 'dd/MM HH:mm' }}</span>
              <span class="pa-act">
                <button class="btn btn-green btn-sm" (click)="approuver(p)">Approuver</button>
                <button class="btn btn-rose btn-sm" (click)="rejeter(p)">Rejeter</button>
              </span>
            </li>
          }
        </ul>
      </div>
    }

    @if (stats(); as s) {
      <div class="tiles">
        <div class="tile reveal" style="--i:0">
          <span class="v">{{ s.nbApplications }}</span>
          <span class="k">Applications</span>
          <span class="sub">{{ s.nbApplicationsActives }} active(s)</span>
        </div>
        <div class="tile reveal" style="--i:1">
          <span class="v teal">{{ s.accesAujourdhui }}</span>
          <span class="k">Accès aujourd'hui</span>
          <span class="sub">autorisés</span>
        </div>
        <div class="tile reveal" style="--i:2">
          <span class="v rouge">{{ s.refusAujourdhui }}</span>
          <span class="k">Refus aujourd'hui</span>
          <span class="sub">accès bloqués</span>
        </div>
        <div class="tile reveal" style="--i:3" [class.alerte]="s.politiquesEnAttente > 0">
          <span class="v amber">{{ s.politiquesEnAttente }}</span>
          <span class="k">À valider</span>
          <a class="sub lien" routerLink="/admin/politiques">politiques en attente →</a>
        </div>
        <div class="tile reveal" style="--i:4">
          <span class="v">{{ s.nbCategories }}</span>
          <span class="k">Catégories</span>
          <span class="sub">de classement</span>
        </div>
      </div>

      <div class="cols">
        <div class="card graphe">
          <h3>Accès — 7 derniers jours</h3>
          <svg [attr.viewBox]="'0 0 ' + largeur + ' 160'" preserveAspectRatio="none">
            @for (p of s.septDerniersJours; track p.date; let i = $index) {
              <g [attr.transform]="'translate(' + (i * pas + 24) + ',0)'">
                <rect
                  [attr.x]="0"
                  [attr.y]="130 - hauteur(p.autorises)"
                  [attr.width]="barre"
                  [attr.height]="hauteur(p.autorises)"
                  rx="3"
                  fill="#10b981"
                />
                <rect
                  [attr.x]="barre + 3"
                  [attr.y]="130 - hauteur(p.refuses)"
                  [attr.width]="barre"
                  [attr.height]="hauteur(p.refuses)"
                  rx="3"
                  fill="#ef4444"
                />
                <text [attr.x]="barre + 1" y="148" text-anchor="middle" font-size="9" fill="#90a2b1">
                  {{ jour(p.date) }}
                </text>
              </g>
            }
          </svg>
          <div class="leg">
            <span><i style="background:#10b981"></i> autorisés</span>
            <span><i style="background:#ef4444"></i> refusés</span>
          </div>
        </div>

        <div class="card top">
          <h3>Applications les plus utilisées</h3>
          @if (s.topApplications.length) {
            <ol>
              @for (t of s.topApplications; track t.code) {
                <li>
                  <span class="nom">{{ t.nom }}</span>
                  <span class="jauge"><i [style.width.%]="pct(t.nombre)"></i></span>
                  <span class="nb">{{ t.nombre }}</span>
                </li>
              }
            </ol>
          } @else {
            <p class="muted">Aucun accès enregistré sur la période.</p>
          }
        </div>
      </div>

      <div class="raccourcis">
        <a class="rc" routerLink="/admin/applications">➕ Ajouter une application</a>
        <a class="rc" routerLink="/admin/politiques">🔐 Gérer les politiques d'accès</a>
        <a class="rc" routerLink="/admin/domaines">🌐 Domaines autorisés</a>
        <a class="rc" routerLink="/admin/audit">📜 Journal d'audit</a>
      </div>
    } @else {
      <div class="spinner"></div>
    }
  `,
  styles: [
    `
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 1rem;
        margin-bottom: 1.6rem;
      }
      .tile {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.1rem 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        animation-delay: calc(var(--i) * 60ms);
      }
      .tile.alerte {
        border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
        background: var(--accent-050);
      }
      .v {
        font-size: 2rem;
        font-weight: 900;
        line-height: 1;
        color: var(--ink);
      }
      .v.teal {
        color: var(--brand-strong);
      }
      .v.rouge {
        color: var(--danger);
      }
      .v.amber {
        color: var(--accent-strong);
      }
      .k {
        font-weight: 700;
        font-size: 0.9rem;
      }
      .sub {
        font-size: 0.78rem;
        color: var(--ink-faint);
      }
      .lien {
        color: var(--brand-strong);
        font-weight: 700;
      }
      .cols {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 1.2rem;
        margin-bottom: 1.6rem;
      }
      .card {
        padding: 1.3rem;
      }
      .card h3 {
        margin: 0 0 0.9rem;
        color: var(--brand-deep);
      }
      .graphe svg {
        width: 100%;
        height: 160px;
        display: block;
      }
      .leg {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: var(--ink-soft);
        margin-top: 0.4rem;
      }
      .leg i {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 3px;
        margin-right: 0.3rem;
      }
      .top ol {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.7rem;
      }
      .top li {
        display: grid;
        grid-template-columns: 1fr 90px 28px;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.9rem;
      }
      .top .nom {
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .jauge {
        height: 8px;
        border-radius: 4px;
        background: var(--surface-3);
        overflow: hidden;
      }
      .jauge i {
        display: block;
        height: 100%;
        background: var(--grad-hero);
      }
      .nb {
        text-align: right;
        font-weight: 800;
        color: var(--brand-strong);
      }
      .alerte-secu {
        background: var(--danger-050);
        border: 1px solid color-mix(in srgb, var(--danger) 45%, var(--border));
        color: var(--ink-rose);
        border-radius: 12px;
        padding: 0.8rem 1.1rem;
        margin-bottom: 1.4rem;
        font-weight: 600;
      }
      .recert {
        padding: 1.3rem;
        margin-bottom: 1.6rem;
        border-color: color-mix(in srgb, var(--brand) 45%, var(--border));
      }
      .recert h3 {
        margin: 0 0 0.9rem;
        color: var(--brand-deep);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .recert ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.7rem;
      }
      .recert li {
        display: grid;
        grid-template-columns: 1.3fr 1.2fr 1fr auto;
        gap: 0.6rem;
        align-items: center;
        font-size: 0.88rem;
        padding-bottom: 0.7rem;
        border-bottom: 1px solid var(--border);
      }
      .recert li:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .ra-app {
        font-weight: 800;
      }
      .exp {
        color: var(--danger);
        font-weight: 700;
      }
      .ra-act {
        display: flex;
        gap: 0.4rem;
      }
      .valider {
        padding: 1.3rem;
        margin-bottom: 1.6rem;
        border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
      }
      .valider h3 {
        margin: 0 0 0.9rem;
        color: var(--accent-strong);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .valider ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.7rem;
      }
      .valider li {
        display: grid;
        grid-template-columns: 1.2fr 1.4fr 1.6fr auto;
        gap: 0.6rem;
        align-items: center;
        font-size: 0.88rem;
        padding-bottom: 0.7rem;
        border-bottom: 1px solid var(--border);
      }
      .valider li:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .pa-app {
        font-weight: 800;
      }
      .e {
        font-weight: 800;
        font-size: 0.72rem;
        padding: 0.1rem 0.4rem;
        border-radius: 5px;
        color: #fff;
      }
      .e.autor {
        background: var(--ok);
      }
      .e.refus {
        background: var(--danger);
      }
      .pa-act {
        display: flex;
        gap: 0.4rem;
      }
      .raccourcis {
        display: flex;
        flex-wrap: wrap;
        gap: 0.7rem;
      }
      @media (max-width: 820px) {
        .valider li {
          grid-template-columns: 1fr;
        }
      }
      .rc {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 12px;
        padding: 0.7rem 1rem;
        font-weight: 700;
        color: var(--ink);
      }
      .rc:hover {
        background: var(--brand-050);
        text-decoration: none;
      }
      @media (max-width: 820px) {
        .cols {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminHome {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly stats = signal<Statistiques | null>(null);
  readonly enAttente = signal<PolitiqueEnAttente[]>([]);
  readonly aRecertifier = signal<AccesARecertifier[]>([]);

  readonly barre = 14;
  readonly pas = 46;
  readonly largeur = 7 * 46 + 40;

  private readonly maxJour = computed(() => {
    const s = this.stats();
    if (!s) return 1;
    return Math.max(1, ...s.septDerniersJours.flatMap((p) => [p.autorises, p.refuses]));
  });
  private readonly maxTop = computed(() =>
    Math.max(1, ...(this.stats()?.topApplications.map((t) => t.nombre) ?? [1])),
  );

  constructor() {
    this.charger();
  }

  private charger(): void {
    this.api.statistiques().subscribe((s) => this.stats.set(s));
    this.api.politiquesEnAttente().subscribe({ next: (l) => this.enAttente.set(l), error: () => {} });
    this.api.accesARecertifier().subscribe({ next: (l) => this.aRecertifier.set(l), error: () => {} });
  }

  recertifier(a: AccesARecertifier): void {
    this.api.recertifier(a.id).subscribe({
      next: () => {
        this.toast.succes('Accès prolongé.');
        this.charger();
      },
      error: () => this.toast.erreur('Échec.'),
    });
  }

  revoquer(a: AccesARecertifier): void {
    if (!confirm(`Révoquer l'accès de ${a.beneficiaireSujet} à « ${a.applicationNom} » ?`)) return;
    this.api.revoquer(a.id).subscribe({
      next: () => {
        this.toast.info('Accès révoqué.');
        this.charger();
      },
      error: () => this.toast.erreur('Échec.'),
    });
  }

  approuver(p: PolitiqueEnAttente): void {
    this.api.approuverPolitique(p.id).subscribe({
      next: () => {
        this.toast.succes('Politique approuvée.');
        this.charger();
      },
      error: (e) =>
        this.toast.erreur(
          e?.status === 409
            ? 'Un autre administrateur doit approuver (vous êtes le demandeur).'
            : "Échec de l'approbation.",
        ),
    });
  }

  rejeter(p: PolitiqueEnAttente): void {
    const motif = prompt('Motif du rejet ?') ?? '';
    this.api.rejeterPolitique(p.id, motif).subscribe({
      next: () => {
        this.toast.info('Politique rejetée.');
        this.charger();
      },
      error: () => this.toast.erreur('Échec du rejet.'),
    });
  }

  hauteur(v: number): number {
    return Math.round((v / this.maxJour()) * 110);
  }
  pct(v: number): number {
    return Math.round((v / this.maxTop()) * 100);
  }
  jour(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'][d.getDay()];
  }
}
