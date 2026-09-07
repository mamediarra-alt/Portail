import { Component, computed, input } from '@angular/core';
import { StatutValidationPolitique } from '../core/models';

interface Etape {
  cle: string;
  titre: string;
  sous: string;
  couleur: string;
}

/**
 * Frise animée du workflow de validation d'une politique d'accès :
 * Demande → En attente d'un second administrateur → Décision (approbation / rejet).
 */
@Component({
  selector: 'app-workflow-stepper',
  standalone: true,
  template: `
    <div class="wf" [class.rejet]="statut() === 'REJETEE'">
      @for (e of etapes; track e.cle; let i = $index) {
        <div
          class="step"
          [class.on]="indexActif() >= i"
          [class.now]="indexActif() === i && enCours()"
          [style.--c]="e.couleur"
        >
          @if (i > 0) {
            <div class="bar"><span [class.plein]="indexActif() >= i"></span></div>
          }
          <div class="dot">
            @if (indexActif() > i || (indexActif() === i && !enCours())) {
              <span class="tick">{{ statut() === 'REJETEE' && i === 2 ? '✕' : '✓' }}</span>
            } @else {
              <span>{{ i + 1 }}</span>
            }
          </div>
          <div class="txt">
            <strong>{{ e.titre }}</strong>
            <span>{{ e.sous }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wf {
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .step {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0 1.6rem 0 0;
        opacity: 0.4;
        transition: opacity 0.35s var(--ease);
      }
      .step.on {
        opacity: 1;
      }
      .bar {
        position: absolute;
        left: -1.2rem;
        top: 17px;
        width: 1.5rem;
        height: 3px;
        border-radius: 2px;
        background: #dde5eb;
        overflow: hidden;
      }
      .bar span {
        display: block;
        height: 100%;
        width: 0;
        background: var(--c);
        transition: width 0.5s var(--ease) 0.1s;
      }
      .bar span.plein {
        width: 100%;
      }
      .dot {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        color: #fff;
        background: #cbd5df;
        flex: none;
        transition:
          background 0.35s var(--ease),
          transform 0.2s var(--ease);
      }
      .step.on .dot {
        background: var(--c);
        box-shadow: 0 6px 16px color-mix(in srgb, var(--c) 40%, transparent);
      }
      .step.now .dot {
        animation: pulse-ring 1.5s infinite;
      }
      .tick {
        display: inline-block;
        animation: pop-in 0.32s var(--ease);
      }
      .txt {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .txt strong {
        color: var(--ink);
        font-size: 0.9rem;
      }
      .txt span {
        color: var(--ink-faint);
        font-size: 0.76rem;
      }
      .step.on .txt strong {
        color: var(--c);
      }
      .wf.rejet .step.on:last-child {
        --c: var(--danger);
      }
    `,
  ],
})
export class WorkflowStepper {
  readonly statut = input.required<StatutValidationPolitique>();

  readonly etapes: Etape[] = [
    { cle: 'demande', titre: 'Demande créée', sous: 'par un administrateur', couleur: 'var(--brand)' },
    { cle: 'attente', titre: 'En attente', sous: 'second administrateur', couleur: 'var(--accent)' },
    { cle: 'decision', titre: 'Décision', sous: 'approbation ou rejet', couleur: 'var(--ok)' },
  ];

  readonly enCours = computed(() => this.statut() === 'EN_ATTENTE_APPROBATION');

  indexActif(): number {
    switch (this.statut()) {
      case 'ACTIVE_DIRECTE':
        return 2;
      case 'EN_ATTENTE_APPROBATION':
        return 1;
      case 'APPROUVEE':
      case 'REJETEE':
        return 2;
    }
  }
}
