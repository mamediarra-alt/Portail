import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { CatalogueStore } from '../core/catalogue.store';
import { SessionService } from '../core/session.service';
import { AccueilSonoreService } from '../core/accueil-sonore.service';
import { CommandeVocaleService } from '../core/commande-vocale.service';
import { ToastService } from '../core/toast.service';
import { ItemCatalogue, MaDemande } from '../core/models';
import { classeStatut, libelleStatut } from '../shared/labels';
import { AccessSequence } from '../shared/access-sequence';

interface Groupe {
  code: string;
  libelle: string;
  apps: ItemCatalogue[];
}

const CLE_FAV = 'portail.favoris';
const CLE_VUE = 'portail.vue';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, NgTemplateOutlet, AccessSequence],
  template: `
    @if (banniere()) {
      <div class="bandeau reveal">
        <span class="b-ic">📢</span>
        <span>{{ banniere() }}</span>
        <button class="b-x" (click)="masquerBanniere()" aria-label="Fermer">✕</button>
      </div>
    }

    <section class="hero reveal">
      <div class="hero-txt">
        <p class="kicker">Portail Applicatif du Ministère</p>
        <h1 class="bienvenue" aria-label="Bienvenue">
          @for (l of lettres; track $index) {
            <span [style.--i]="$index">{{ l }}</span>
          }
        </h1>
        <p class="sous">
          <span class="compteur">{{ total() }}</span>
          application{{ total() > 1 ? 's' : '' }} accessible{{ total() > 1 ? 's' : '' }}
          selon vos habilitations.
        </p>
        <button class="ecouter" (click)="accueil.rejouer()" type="button">
          🔊 Réécouter le message d'accueil
        </button>
      </div>
      <div class="hero-orbe" aria-hidden="true"><span></span><span></span><span></span></div>
    </section>

    @if (recents().length) {
      <div class="recents reveal">
        <span class="r-titre">Accès récents</span>
        @for (r of recents(); track r.code) {
          <button class="r-chip" (click)="accederCode(r.code)">{{ r.nom }}</button>
        }
      </div>
    }

    <div class="barre reveal">
      <input
        class="rech"
        [ngModel]="recherche()"
        (ngModelChange)="recherche.set($event)"
        placeholder="Rechercher une application…"
      />
      @if (micDispo) {
        <button
          class="mic"
          [class.on]="voix.ecoute()"
          [disabled]="voix.ecoute()"
          (click)="parler()"
          title="Dire le nom d'une application"
        >
          {{ voix.ecoute() ? '🎙️ J’écoute…' : '🎤 Parler' }}
        </button>
      }
      <div class="vues">
        <button [class.on]="vue() === 'grille'" (click)="setVue('grille')" title="Grille">▦</button>
        <button [class.on]="vue() === 'liste'" (click)="setVue('liste')" title="Liste">≣</button>
      </div>
    </div>

    @if (dernierDit()) {
      <p class="dit reveal">Entendu : « <strong>{{ dernierDit() }}</strong> »</p>
    }

    @if (chargement()) {
      <div class="grille">
        @for (n of [1, 2, 3, 4, 5, 6]; track n) {
          <div class="app sk">
            <div class="skeleton" style="width:44px;height:44px;border-radius:13px"></div>
            <div class="skeleton" style="height:16px;width:60%;margin-top:.8rem"></div>
            <div class="skeleton" style="height:12px;width:90%;margin-top:.6rem"></div>
            <div class="skeleton" style="height:32px;width:100%;margin-top:1rem;border-radius:999px"></div>
          </div>
        }
      </div>
    } @else if (erreur()) {
      <div class="panel err">{{ erreur() }}</div>
    } @else if (total() === 0) {
      <div class="panel vide">
        <div class="vide-ic">🗂️</div>
        <h3>Aucune application disponible</h3>
        <p class="muted">Aucune application n'est ouverte à votre profil pour le moment.</p>
      </div>
    } @else {
      @if (favoris().length) {
        <div class="groupe">
          <h2><span class="pin or"></span>Favoris <span class="cpt">{{ favoris().length }}</span></h2>
          <div class="grille" [class.liste]="vue() === 'liste'">
            @for (a of favoris(); track a.code) {
              <ng-container *ngTemplateOutlet="carte; context: { $implicit: a }" />
            }
          </div>
        </div>
      }

      @for (g of groupes(); track g.code; let gi = $index) {
        <div class="groupe" [style.--i]="gi">
          <h2><span class="pin"></span>{{ g.libelle }} <span class="cpt">{{ g.apps.length }}</span></h2>
          <div class="grille stagger" [class.liste]="vue() === 'liste'">
            @for (a of g.apps; track a.code; let i = $index) {
              <ng-container *ngTemplateOutlet="carte; context: { $implicit: a, i: i }" />
            }
          </div>
        </div>
      } @empty {
        <p class="muted">Aucune application ne correspond à « {{ recherche() }} ».</p>
      }
    }

    @if (mesDemandes().length) {
      <div class="groupe demandes">
        <h2><span class="pin bl"></span>Mes demandes d'accès</h2>
        <div class="dm-liste">
          @for (d of mesDemandes(); track d.id) {
            <div class="dm">
              <strong>{{ d.applicationNom }}</strong>
              <span
                class="badge"
                [class.badge-amber]="d.statut === 'EN_ATTENTE'"
                [class.badge-green]="d.statut === 'APPROUVEE'"
                [class.badge-rose]="d.statut === 'REFUSEE'"
              >
                {{ d.statut === 'EN_ATTENTE' ? 'En attente' : d.statut === 'APPROUVEE' ? 'Approuvée' : 'Refusée' }}
              </span>
              @if (d.commentaireDecision) {
                <span class="muted">— {{ d.commentaireDecision }}</span>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (demandables().length && !chargement()) {
      <div class="groupe">
        <h2><span class="pin bl"></span>Demander un accès <span class="cpt">{{ demandables().length }}</span></h2>
        <p class="muted">Applications auxquelles vous n'avez pas encore accès.</p>
        <div class="grille">
          @for (a of demandables(); track a.code) {
            <article class="app dispo">
              <header>
                <span class="ic" [style.background]="teinte(a.code)">{{ a.nom[0] }}</span>
                <span class="badge" [class]="classeStatut(a.statut)">{{ libelleStatut(a.statut) }}</span>
              </header>
              <h3>{{ a.nom }}</h3>
              <p class="desc">{{ a.description }}</p>
              <footer>
                @if (motifOuvert() === a.code) {
                  <div class="dm-form">
                    <textarea
                      [(ngModel)]="motifTexte"
                      [name]="'motif-' + a.code"
                      rows="2"
                      placeholder="Motif de la demande (facultatif)"
                    ></textarea>
                    <div class="dm-form-act">
                      <button
                        class="btn btn-primary btn-sm"
                        [disabled]="demande() === a.code"
                        (click)="envoyerDemande(a)"
                      >
                        {{ demande() === a.code ? 'Envoi…' : 'Envoyer la demande' }}
                      </button>
                      <button class="btn btn-ghost btn-sm" (click)="motifOuvert.set(null)">Annuler</button>
                    </div>
                  </div>
                } @else {
                  <button class="btn btn-ghost btn-sm" (click)="ouvrirDemande(a)">＋ Demander l’accès</button>
                }
              </footer>
            </article>
          }
        </div>
      </div>
    }

    <ng-template #carte let-a let-i="i">
      <article class="app" [class.bloquee]="a.accesBloque" [style.--i]="i || 0">
        <header>
          <span class="ic" [style.background]="teinte(a.code)">{{ a.nom[0] }}</span>
          <span class="badge" [class]="classeStatut(a.statut)">{{ libelleStatut(a.statut) }}</span>
          <button
            class="fav"
            [class.on]="estFavori(a.code)"
            (click)="basculerFavori(a.code); $event.stopPropagation()"
            [title]="estFavori(a.code) ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            {{ estFavori(a.code) ? '★' : '☆' }}
          </button>
        </header>
        <h3>{{ a.nom }}</h3>
        <p class="desc">{{ a.description }}</p>
        <footer>
          <a class="lien" [routerLink]="['/application', a.code]">Détails</a>
          <button class="btn btn-primary btn-sm" [disabled]="a.accesBloque" (click)="acceder(a)">
            {{ a.accesBloque ? 'Indisponible' : 'Accéder →' }}
          </button>
        </footer>
      </article>
    </ng-template>

    <app-access-sequence />
  `,
  styles: [
    `
      .bandeau {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.8rem 1.1rem;
        border-radius: 14px;
        background: var(--accent-050);
        border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border));
        color: var(--accent-strong);
        font-weight: 600;
        margin-bottom: 1.2rem;
      }
      .b-x {
        margin-left: auto;
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 0.9rem;
      }
      .hero {
        position: relative;
        overflow: hidden;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 2rem 2.2rem;
        border-radius: var(--r-lg);
        background: var(--hero-bg);
        border: 1px solid var(--border);
        margin-bottom: 1.6rem;
      }
      .kicker {
        margin: 0 0 0.2rem;
        color: var(--brand-strong);
        font-weight: 800;
        font-size: 0.78rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        animation: fade-in 0.6s ease both;
      }
      .bienvenue {
        margin: 0.1rem 0 0.4rem;
        font-size: clamp(2.4rem, 6vw, 3.8rem);
        font-weight: 900;
        letter-spacing: -0.02em;
        line-height: 1;
        background: linear-gradient(115deg, #0b7c7c 0%, #10b981 45%, #f59e0b 110%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .bienvenue span {
        display: inline-block;
        animation: fade-up 0.6s var(--ease) both;
        animation-delay: calc(var(--i) * 55ms + 0.08s);
      }
      .sous {
        margin: 0;
        color: var(--ink-soft);
        animation: fade-in 0.6s ease 0.7s both;
      }
      .compteur {
        font-weight: 900;
        color: var(--brand-strong);
        font-size: 1.15rem;
      }
      .ecouter {
        margin-top: 0.9rem;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--brand-strong);
        font: inherit;
        font-weight: 700;
        font-size: 0.82rem;
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        cursor: pointer;
        animation: fade-in 0.6s ease 0.9s both;
      }
      .ecouter:hover {
        background: var(--brand-050);
      }
      .hero-orbe {
        position: relative;
        width: 120px;
        height: 120px;
        flex: none;
      }
      .hero-orbe span {
        position: absolute;
        border-radius: 50%;
        opacity: 0.85;
        animation: float 4s ease-in-out infinite;
      }
      .hero-orbe span:nth-child(1) {
        inset: 0;
        background: radial-gradient(circle at 30% 30%, #34d399, #0ea5a4);
      }
      .hero-orbe span:nth-child(2) {
        width: 46px;
        height: 46px;
        right: -8px;
        top: 8px;
        background: radial-gradient(circle at 30% 30%, #fcd34d, #f59e0b);
        animation-delay: 0.8s;
      }
      .hero-orbe span:nth-child(3) {
        width: 26px;
        height: 26px;
        left: -6px;
        bottom: 6px;
        background: radial-gradient(circle at 30% 30%, #67e8f9, #06b6d4);
        animation-delay: 1.6s;
      }
      .recents {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1.2rem;
      }
      .r-titre {
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ink-faint);
      }
      .r-chip {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--ink);
        border-radius: 999px;
        padding: 0.35rem 0.8rem;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.14s;
      }
      .r-chip:hover {
        background: var(--brand-050);
      }
      .barre {
        display: flex;
        gap: 0.8rem;
        margin-bottom: 1.6rem;
      }
      .rech {
        flex: 1;
        max-width: 420px;
      }
      .vues {
        display: flex;
        gap: 0.3rem;
      }
      .vues button {
        width: 38px;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--ink-soft);
        border-radius: 9px;
        cursor: pointer;
        font-size: 1rem;
      }
      .vues button.on {
        background: var(--grad-hero);
        color: #fff;
        border-color: transparent;
      }
      .mic {
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--brand-strong);
        font: inherit;
        font-weight: 700;
        font-size: 0.85rem;
        padding: 0 0.9rem;
        border-radius: 9px;
        cursor: pointer;
        white-space: nowrap;
      }
      .mic:hover:not(:disabled) {
        background: var(--brand-050);
      }
      .mic.on {
        background: var(--grad-hero);
        color: #fff;
        border-color: transparent;
        animation: pulse-ring 1.4s infinite;
      }
      .dit {
        margin: -0.8rem 0 1.4rem;
        color: var(--ink-soft);
        font-size: 0.9rem;
      }
      .groupe {
        margin-bottom: 2.2rem;
        animation: fade-up 0.5s var(--ease) both;
        animation-delay: calc(var(--i, 0) * 90ms);
      }
      .groupe h2 {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        color: var(--brand-deep);
        font-size: 1.15rem;
      }
      .cpt {
        font-size: 0.78rem;
        font-weight: 800;
        color: var(--brand-strong);
        background: var(--brand-050);
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
      }
      .pin {
        width: 10px;
        height: 22px;
        border-radius: 4px;
        background: var(--grad-hero);
        display: inline-block;
      }
      .pin.or {
        background: var(--grad-amber);
      }
      .pin.bl {
        background: var(--grad-blue);
      }
      .dm-liste {
        display: grid;
        gap: 0.5rem;
      }
      .dm {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.9rem;
        padding: 0.6rem 0.9rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
      }
      .app.dispo {
        border-style: dashed;
      }
      .grille {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
        gap: 1.1rem;
      }
      .grille.liste {
        grid-template-columns: 1fr;
      }
      .grille.liste .app {
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
      }
      .grille.liste .desc {
        width: 100%;
        order: 3;
      }
      .app {
        position: relative;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        transition:
          transform 0.16s var(--ease),
          box-shadow 0.16s var(--ease),
          border-color 0.16s;
      }
      .app:not(.sk):hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
        border-color: color-mix(in srgb, var(--brand) 35%, var(--border));
      }
      .app:not(.sk):hover .ic {
        animation: float 1.4s ease-in-out infinite;
      }
      .app.bloquee {
        opacity: 0.72;
      }
      .app header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.4rem;
      }
      .ic {
        width: 44px;
        height: 44px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 800;
        font-size: 1.2rem;
      }
      .fav {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 1.1rem;
        color: var(--ink-faint);
        line-height: 1;
      }
      .fav.on {
        color: var(--accent);
      }
      .app h3 {
        margin: 0.2rem 0 0;
      }
      .desc {
        margin: 0;
        color: var(--ink-soft);
        font-size: 0.9rem;
        flex: 1;
      }
      .app footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.4rem;
        gap: 0.6rem;
      }
      .dm-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
      }
      .dm-form textarea {
        width: 100%;
        resize: vertical;
        font: inherit;
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: 8px;
      }
      .dm-form-act {
        display: flex;
        gap: 0.5rem;
      }
      .lien {
        font-weight: 700;
        color: var(--brand-strong);
      }
      .sk {
        pointer-events: none;
      }
      .err {
        border-left: 4px solid var(--danger);
        color: var(--ink-rose);
      }
      .vide {
        text-align: center;
        padding: 3rem;
      }
      .vide-ic {
        font-size: 2.4rem;
        margin-bottom: 0.4rem;
      }
      @media (max-width: 640px) {
        .hero-orbe {
          display: none;
        }
      }
    `,
  ],
})
export class Dashboard {
  private readonly api = inject(ApiService);
  private readonly store = inject(CatalogueStore);
  private readonly toast = inject(ToastService);
  readonly session = inject(SessionService);
  readonly accueil = inject(AccueilSonoreService);
  readonly voix = inject(CommandeVocaleService);

  readonly lettres = 'Bienvenue'.split('');
  readonly classeStatut = classeStatut;
  readonly libelleStatut = libelleStatut;

  readonly chargement = signal(true);
  readonly erreur = signal('');
  readonly recherche = signal('');
  readonly recents = signal<{ code: string; nom: string }[]>([]);
  readonly banniere = signal('');
  readonly demandables = signal<ItemCatalogue[]>([]);
  readonly mesDemandes = signal<MaDemande[]>([]);
  readonly demande = signal<string | null>(null);
  readonly motifOuvert = signal<string | null>(null);
  motifTexte = '';
  readonly vue = signal<'grille' | 'liste'>(this.lireVue());
  private readonly favSet = signal<Set<string>>(new Set(this.lireFavoris()));

  readonly micDispo = this.voix.disponible;
  readonly dernierDit = signal('');

  private readonly sequence = viewChild(AccessSequence);

  private readonly filtrees = computed<ItemCatalogue[]>(() => {
    const t = this.recherche().trim().toLowerCase();
    const apps = this.store.apps();
    return t
      ? apps.filter(
          (a) =>
            a.nom.toLowerCase().includes(t) ||
            a.code.toLowerCase().includes(t) ||
            (a.categorieLibelle ?? '').toLowerCase().includes(t),
        )
      : apps;
  });

  readonly total = computed(() => this.store.apps().length);
  readonly favoris = computed(() => this.filtrees().filter((a) => this.favSet().has(a.code)));
  readonly groupes = computed<Groupe[]>(() => {
    const map = new Map<string, Groupe>();
    for (const a of this.filtrees()) {
      const code = a.categorieCode ?? '_';
      const libelle = a.categorieLibelle ?? 'Autres applications';
      if (!map.has(code)) map.set(code, { code, libelle, apps: [] });
      map.get(code)!.apps.push(a);
    }
    return [...map.values()];
  });

  constructor() {
    this.accueil.accueillir();
    const b = sessionStorage.getItem('portail.banniere.fermee');
    this.store
      .charger(true)
      .then(() => this.chargement.set(false))
      .catch(() => {
        this.erreur.set('Impossible de charger le catalogue.');
        this.chargement.set(false);
      });
    this.api.mesAccesRecents().subscribe({
      next: (l) => this.recents.set(l.map((x) => ({ code: x.code, nom: x.nom }))),
      error: () => {},
    });
    this.api.config().subscribe({
      next: (l) => {
        const m = l.find((c) => c.cle === 'portail.banniere_message')?.valeur ?? '';
        if (m && b !== '1') this.banniere.set(m);
      },
      error: () => {},
    });
    this.rafraichirDemandes();
  }

  private rafraichirDemandes(): void {
    this.api.catalogueDemandables().subscribe({ next: (l) => this.demandables.set(l), error: () => {} });
    this.api.mesDemandes().subscribe({ next: (l) => this.mesDemandes.set(l), error: () => {} });
  }

  ouvrirDemande(a: ItemCatalogue): void {
    this.motifTexte = '';
    this.motifOuvert.set(a.code);
  }

  envoyerDemande(a: ItemCatalogue): void {
    this.demande.set(a.code);
    this.api.creerDemande(a.code, this.motifTexte.trim()).subscribe({
      next: () => {
        this.demande.set(null);
        this.motifOuvert.set(null);
        this.motifTexte = '';
        this.toast.succes('Demande envoyée — en attente de validation.');
        this.rafraichirDemandes();
      },
      error: (e) => {
        this.demande.set(null);
        this.toast.erreur(e?.error?.detail ?? "Échec de l'envoi de la demande.");
      },
    });
  }

  teinte(code: string): string {
    const palettes = [
      'var(--grad-violet)',
      'var(--grad-blue)',
      'var(--grad-green)',
      'var(--grad-amber)',
      'linear-gradient(135deg,#5eead4,#0d9488)',
    ];
    let h = 0;
    for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return palettes[h % palettes.length];
  }

  acceder(a: ItemCatalogue): void {
    this.sequence()?.demarrer(a.code, a.nom, a.ouvrirNouvelOnglet);
  }
  accederCode(code: string): void {
    const a = this.store.apps().find((x) => x.code === code);
    if (a) this.acceder(a);
  }

  /** Commande vocale : écoute le nom d'une application et l'ouvre si elle est reconnue. */
  parler(): void {
    if (this.voix.ecoute()) return;
    this.dernierDit.set('');
    this.voix
      .ecouter()
      .then((phrases) => {
        this.dernierDit.set(phrases[0] ?? '');
        const app = this.trouverApp(phrases);
        if (!app) {
          this.toast.info(`Aucune application reconnue pour « ${phrases[0] ?? '…'} ».`);
        } else if (app.accesBloque) {
          this.toast.erreur(`« ${app.nom} » est indisponible pour le moment.`);
        } else {
          this.toast.succes(`Ouverture de « ${app.nom} »…`);
          this.acceder(app);
        }
      })
      .catch((e: Error) => {
        const messages: Record<string, string> = {
          silence: "Je n'ai rien entendu. Réessaie en parlant près du micro.",
          'not-allowed': 'Micro refusé : autorise le microphone dans le navigateur.',
          'no-speech': "Je n'ai rien entendu. Réessaie.",
          indisponible: "La commande vocale n'est pas disponible sur ce navigateur.",
        };
        this.toast.erreur(messages[e.message] ?? "La reconnaissance vocale a échoué.");
      });
  }

  /** Rapproche des transcriptions candidates d'une application du catalogue. */
  private trouverApp(phrases: string[]): ItemCatalogue | null {
    const norm = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const dits = phrases.map(norm).filter((p) => p.length >= 2);
    let meilleur: { app: ItemCatalogue; score: number } | null = null;

    for (const app of this.store.apps()) {
      const cibles = [app.nom, app.code, app.categorieLibelle ?? ''].map(norm).filter(Boolean);
      for (const dit of dits) {
        for (const cible of cibles) {
          let score = 0;
          if (dit === cible) score = 100;
          else if (cible.startsWith(dit) || dit.startsWith(cible)) score = 85;
          else if (dit.length >= 3 && (cible.includes(dit) || dit.includes(cible))) score = 65;
          else {
            const motsCible = new Set(cible.split(' '));
            const communs = dit.split(' ').filter((m) => m.length >= 3 && motsCible.has(m)).length;
            if (communs) score = 40 + communs * 10;
          }
          if (score && (!meilleur || score > meilleur.score)) meilleur = { app, score };
        }
      }
    }
    return meilleur && meilleur.score >= 50 ? meilleur.app : null;
  }

  estFavori(code: string): boolean {
    return this.favSet().has(code);
  }
  basculerFavori(code: string): void {
    const s = new Set(this.favSet());
    s.has(code) ? s.delete(code) : s.add(code);
    this.favSet.set(s);
    try {
      localStorage.setItem(CLE_FAV, JSON.stringify([...s]));
    } catch {
      /* ignore */
    }
  }

  setVue(v: 'grille' | 'liste'): void {
    this.vue.set(v);
    try {
      localStorage.setItem(CLE_VUE, v);
    } catch {
      /* ignore */
    }
  }

  masquerBanniere(): void {
    this.banniere.set('');
    try {
      sessionStorage.setItem('portail.banniere.fermee', '1');
    } catch {
      /* ignore */
    }
  }

  private lireFavoris(): string[] {
    try {
      return JSON.parse(localStorage.getItem(CLE_FAV) ?? '[]');
    } catch {
      return [];
    }
  }
  private lireVue(): 'grille' | 'liste' {
    try {
      return localStorage.getItem(CLE_VUE) === 'liste' ? 'liste' : 'grille';
    } catch {
      return 'grille';
    }
  }
}
