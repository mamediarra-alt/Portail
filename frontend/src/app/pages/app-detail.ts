import { Component, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { DetailApplication } from '../core/models';
import { classeStatut, libelleStatut } from '../shared/labels';
import { AccessSequence } from '../shared/access-sequence';

@Component({
  selector: 'app-app-detail',
  standalone: true,
  imports: [RouterLink, AccessSequence],
  template: `
    <a class="retour" routerLink="/tableau-de-bord">← Retour au tableau de bord</a>

    @if (chargement()) {
      <div class="fiche card">
        <div class="skeleton" style="width:60px;height:60px;border-radius:18px"></div>
        <div class="skeleton" style="height:22px;width:40%;margin-top:1rem"></div>
        <div class="skeleton" style="height:14px;width:80%;margin-top:1rem"></div>
        <div class="skeleton" style="height:38px;width:220px;margin-top:1.4rem;border-radius:999px"></div>
      </div>
    } @else if (!app()) {
      <div class="panel err">Application introuvable.</div>
    } @else {
      <div class="fiche card reveal">
        <div class="tete">
          <span class="ic">{{ app()!.nom[0] }}</span>
          <div>
            <h1>{{ app()!.nom }}</h1>
            @if (app()!.categorieLibelle) {
              <span class="chip">{{ app()!.categorieLibelle }}</span>
            }
            <span class="badge" [class]="classeStatut(app()!.statut)">
              {{ libelleStatut(app()!.statut) }}
            </span>
          </div>
        </div>
        <p class="desc">{{ app()!.description }}</p>
        <button class="btn btn-primary" [disabled]="app()!.accesBloque" (click)="acceder()">
          {{ app()!.accesBloque ? 'Accès indisponible' : 'Accéder à l’application →' }}
        </button>
        @if (app()!.accesBloque) {
          <p class="note muted">Cette application est momentanément indisponible.</p>
        }
      </div>
    }

    <app-access-sequence />
  `,
  styles: [
    `
      .retour {
        display: inline-block;
        margin-bottom: 1.2rem;
        font-weight: 700;
        color: var(--brand-strong);
      }
      .fiche {
        padding: 2rem;
        max-width: 720px;
      }
      .tete {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
      }
      .ic {
        width: 60px;
        height: 60px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        color: #fff;
        font-size: 1.6rem;
        font-weight: 800;
        background: var(--grad-hero);
      }
      h1 {
        margin: 0 0 0.35rem;
      }
      .tete .chip {
        margin-right: 0.4rem;
      }
      .desc {
        color: var(--ink-soft);
        font-size: 1rem;
      }
      .note {
        margin-top: 0.6rem;
        font-size: 0.85rem;
      }
      .err {
        border-left: 4px solid var(--danger);
        color: var(--ink-rose);
      }
    `,
  ],
})
export class AppDetail {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly classeStatut = classeStatut;
  readonly libelleStatut = libelleStatut;

  readonly app = signal<DetailApplication | null>(null);
  readonly chargement = signal(true);
  private readonly sequence = viewChild(AccessSequence);

  private readonly code = this.route.snapshot.paramMap.get('code') ?? '';

  constructor() {
    this.api.detail(this.code).subscribe({
      next: (d) => {
        this.app.set(d);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  acceder(): void {
    const a = this.app();
    if (a) this.sequence()?.demarrer(this.code, a.nom, false);
  }
}
