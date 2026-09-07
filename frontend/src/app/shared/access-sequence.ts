import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';

type Phase = 'controle' | 'autorise' | 'ouverture' | 'refuse' | 'indisponible' | 'erreur';

interface Etape {
  cle: Phase;
  titre: string;
}

/**
 * Séquence animée d'accès à une application : contrôle des droits → autorisation →
 * ouverture. En cas de refus, l'overlay se transforme en carte explicative.
 */
@Component({
  selector: 'app-access-sequence',
  standalone: true,
  template: `
    @if (ouvert()) {
      <div class="backdrop" (click)="fermerSiFini()">
        <div class="boite" (click)="$event.stopPropagation()">
          @if (estRefus()) {
            <div class="refus reveal">
              <div class="ic-refus">✕</div>
              <h3>{{ phase() === 'indisponible' ? 'Application indisponible' : 'Accès non autorisé' }}</h3>
              <p class="muted">{{ messageRefus() }}</p>
              <button class="btn btn-ghost" (click)="fermer()">Compris</button>
            </div>
          } @else {
            <div class="entete">
              <span class="cible">{{ nomApp() }}</span>
              <span class="mini muted">Vérification en cours…</span>
            </div>
            <ol class="etapes">
              @for (e of etapes; track e.cle; let i = $index) {
                <li [class.on]="indice() >= i" [class.now]="indice() === i && !estRefus()">
                  <span class="pastille">
                    @if (indice() > i) { ✓ } @else { {{ i + 1 }} }
                  </span>
                  <span class="lbl">{{ e.titre }}</span>
                </li>
              }
            </ol>
            <div class="barre"><span [style.width.%]="progression()"></span></div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(9, 20, 33, 0.45);
        backdrop-filter: blur(3px);
        display: grid;
        place-items: center;
        z-index: 200;
        animation: fade-in 0.2s ease;
      }
      .boite {
        width: min(420px, 92vw);
        background: #fff;
        border-radius: 22px;
        padding: 1.6rem 1.7rem;
        box-shadow: var(--shadow-lg);
        animation: pop-in 0.28s var(--ease);
      }
      .entete {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 1.1rem;
      }
      .cible {
        font-weight: 800;
        color: var(--brand-strong);
        font-size: 1.05rem;
      }
      .mini {
        font-size: 0.8rem;
      }
      .etapes {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.7rem;
      }
      .etapes li {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        opacity: 0.45;
        transition: opacity 0.25s;
      }
      .etapes li.on {
        opacity: 1;
      }
      .pastille {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        color: #fff;
        background: #c6d2dc;
        flex: none;
        transition: background 0.25s;
      }
      .etapes li.on .pastille {
        background: var(--brand);
      }
      .etapes li.now .pastille {
        animation: pulse-ring 1.4s infinite;
      }
      .lbl {
        font-weight: 600;
        color: var(--ink);
      }
      .barre {
        margin-top: 1.2rem;
        height: 6px;
        border-radius: 4px;
        background: var(--surface-3);
        overflow: hidden;
      }
      .barre span {
        display: block;
        height: 100%;
        background: var(--grad-hero);
        transition: width 0.4s var(--ease);
      }
      .refus {
        text-align: center;
      }
      .ic-refus {
        width: 54px;
        height: 54px;
        margin: 0 auto 0.6rem;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-size: 1.5rem;
        font-weight: 800;
        color: #fff;
        background: linear-gradient(135deg, #f87171, #dc2626);
        animation: pop-in 0.3s var(--ease);
      }
      .refus h3 {
        margin: 0.2rem 0 0.4rem;
      }
      .refus .btn {
        margin-top: 0.9rem;
      }
    `,
  ],
})
export class AccessSequence {
  private readonly api = inject(ApiService);

  readonly etapes: Etape[] = [
    { cle: 'controle', titre: "Contrôle de vos droits d'accès" },
    { cle: 'autorise', titre: 'Autorisation vérifiée' },
    { cle: 'ouverture', titre: "Ouverture de l'application" },
  ];

  readonly ouvert = signal(false);
  readonly phase = signal<Phase>('controle');
  private readonly nom = signal('');
  private readonly refusMsg = signal('');

  nomApp() {
    return this.nom();
  }
  indice() {
    return { controle: 0, autorise: 1, ouverture: 2, refuse: 0, indisponible: 0, erreur: 0 }[this.phase()];
  }
  progression() {
    return { controle: 25, autorise: 65, ouverture: 100, refuse: 100, indisponible: 100, erreur: 100 }[
      this.phase()
    ];
  }
  estRefus() {
    return ['refuse', 'indisponible', 'erreur'].includes(this.phase());
  }
  messageRefus() {
    return this.refusMsg();
  }

  /** Lance la séquence pour une application donnée. */
  demarrer(code: string, nom: string, nouvelOnglet: boolean): void {
    this.nom.set(nom);
    this.phase.set('controle');
    this.ouvert.set(true);

    setTimeout(() => {
      if (!this.ouvert()) return;
      this.api.acceder(code).subscribe({
        next: (r) => {
          this.phase.set('autorise');
          setTimeout(() => {
            this.phase.set('ouverture');
            setTimeout(() => {
              this.ouvert.set(false);
              if (nouvelOnglet || r.nouvelOnglet) {
                window.open(r.url, '_blank', 'noopener');
              } else {
                window.location.assign(r.url);
              }
            }, 750);
          }, 550);
        },
        error: (e) => {
          if (e?.status === 403) {
            this.phase.set('refuse');
            this.refusMsg.set("Votre profil n'ouvre pas l'accès à cette application.");
          } else if (e?.status === 409) {
            this.phase.set('indisponible');
            this.refusMsg.set('Cette application est momentanément indisponible. Réessayez plus tard.');
          } else {
            this.phase.set('erreur');
            this.refusMsg.set("L'accès n'a pas pu aboutir.");
          }
        },
      });
    }, 500);
  }

  fermer() {
    this.ouvert.set(false);
  }
  fermerSiFini() {
    if (this.estRefus()) this.fermer();
  }
}
