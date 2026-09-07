import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import {
  ApplicationAdmin,
  EffetPolitique,
  Politique,
  TypeReglePolitique,
} from '../../core/models';
import { classeValidation, libelleValidation } from '../../shared/labels';
import { WorkflowStepper } from '../../shared/workflow-stepper';
import { WorkflowIllustration } from '../../shared/workflow-illustration';

@Component({
  selector: 'app-admin-policies',
  standalone: true,
  imports: [FormsModule, WorkflowStepper, WorkflowIllustration],
  template: `
    <h2>Politiques d'accès</h2>
    <p class="muted">
      Chaque politique détermine <em>qui voit</em> et <em>qui peut accéder</em> à une application.
      Un <strong class="rose">REFUSER</strong> l'emporte toujours sur un
      <strong class="green">AUTORISER</strong>. Sur une application
      <strong class="rose">sensible</strong>, une nouvelle politique passe par la validation d'un
      second administrateur.
    </p>

    <section class="explain">
      <h3>Comprendre le contrôle d'accès</h3>
      <app-workflow-illustration />
      <div class="regles">
        <div class="r"><span class="p teal"></span> <strong>Rôle requis</strong> — l'agent doit porter ce rôle Keycloak (ex. <span class="chip mono">AGENT</span>).</div>
        <div class="r"><span class="p teal"></span> <strong>Groupe requis</strong> — l'agent doit appartenir à ce groupe.</div>
        <div class="r"><span class="p teal"></span> <strong>Origine requise</strong> — l'agent doit venir d'une application donnée (ex. profils EDUSN → Restaurant).</div>
        <div class="r"><span class="p amber"></span> <strong>Ouvert à tous</strong> — tout agent authentifié.</div>
        <div class="r"><span class="p rouge"></span> <strong>Effet REFUSER</strong> — bloque, même si une autre règle autorise.</div>
      </div>
    </section>

    <div class="pick">
      <label>Application</label>
      <select [ngModel]="codeApp()" (ngModelChange)="choisir($event)">
        <option value="">— choisir —</option>
        @for (a of apps(); track a.code) {
          <option [value]="a.code">{{ a.nom }} ({{ a.code }}){{ a.sensible ? ' — sensible' : '' }}</option>
        }
      </select>
    </div>

    @if (!codeApp()) {
      <div class="panel vide muted">
        Choisissez une application ci-dessus pour afficher ses politiques et en ajouter une.
      </div>
    }

    @if (codeApp()) {
      <!-- Frise du workflow -->
      <div class="card wf-card">
        <h3>Cycle de validation d'une politique</h3>
        <app-workflow-stepper [statut]="statutMisEnAvant()" />
        <div class="legende">
          <span><i class="d blue"></i> Active directe (application non sensible)</span>
          <span><i class="d amber"></i> En attente d'un second administrateur</span>
          <span><i class="d green"></i> Approuvée — prise en compte</span>
          <span><i class="d rose"></i> Rejetée — ignorée</span>
        </div>
      </div>

      <!-- Ajout -->
      <form class="card ajout" (ngSubmit)="ajouter()">
        <h3>Ajouter une politique</h3>
        <div class="row">
          <div class="field">
            <label>Type de règle</label>
            <select [(ngModel)]="type" name="type">
              <option value="OUVERT_A_TOUS">Ouvert à tous</option>
              <option value="ROLE_REQUIS">Rôle requis</option>
              <option value="GROUPE_REQUIS">Groupe requis</option>
              <option value="ORIGINE_REQUISE">Origine requise</option>
            </select>
          </div>
          <div class="field">
            <label>Valeur</label>
            <input
              [(ngModel)]="valeur"
              name="valeur"
              [disabled]="type === 'OUVERT_A_TOUS'"
              placeholder="ex : AGENT"
            />
          </div>
          <div class="field">
            <label>Effet</label>
            <select [(ngModel)]="effet" name="effet">
              <option value="AUTORISER">Autoriser</option>
              <option value="REFUSER">Refuser</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="ajoutEnCours()">Ajouter</button>
        </div>
      </form>

      <!-- Simulateur -->
      <form class="card simu" (ngSubmit)="simuler()">
        <h3>Simuler un accès</h3>
        <p class="muted">Testez le verdict pour un profil, sans rien enregistrer.</p>
        <div class="row3">
          <div class="field">
            <label>Rôles (séparés par des virgules)</label>
            <input [(ngModel)]="simRoles" name="simr" placeholder="ex : AGENT" />
          </div>
          <div class="field">
            <label>Groupes</label>
            <input [(ngModel)]="simGroupes" name="simg" placeholder="ex : DIRECTION" />
          </div>
          <div class="field">
            <label>Origine</label>
            <input [(ngModel)]="simOrigine" name="simo" placeholder="ex : EDUSN" />
          </div>
          <button type="submit" class="btn btn-violet">Tester</button>
        </div>
        @if (verdict(); as v) {
          <div class="verdict" [class.ok]="v.autorise && !v.applicationBloquee" [class.ko]="!v.autorise" [class.warn]="v.autorise && v.applicationBloquee">
            @if (v.autorise && !v.applicationBloquee) {
              ✓ Accès <strong>autorisé</strong>
            } @else if (v.autorise && v.applicationBloquee) {
              ⚠ Autorisé mais <strong>bloqué</strong> (statut de l'application)
            } @else {
              ✕ Accès <strong>refusé</strong> — {{ motifLisible(v.motif) }}
            }
          </div>
        }
      </form>

      <!-- Liste -->
      @if (chargement()) {
        <div class="spinner"></div>
      } @else if (politiques().length === 0) {
        <div class="panel vide muted">Aucune politique — l'application n'est visible par personne.</div>
      } @else {
        <div class="liste">
          @for (p of politiques(); track p.id) {
            <div class="pol" [class]="'bord-' + classeValidation(p.statutValidation)">
              <div class="pol-tete">
                <div class="regle">
                  <span class="effet" [class.autor]="p.effet === 'AUTORISER'" [class.refus]="p.effet === 'REFUSER'">
                    {{ p.effet === 'AUTORISER' ? 'AUTORISER' : 'REFUSER' }}
                  </span>
                  <span class="type">{{ libelleType(p.typeRegle) }}</span>
                  @if (p.valeur) {
                    <span class="chip mono">{{ p.valeur }}</span>
                  }
                </div>
                <span class="badge" [class]="classeValidation(p.statutValidation)">
                  {{ libelleValidation(p.statutValidation) }}
                </span>
              </div>

              <app-workflow-stepper [statut]="p.statutValidation" />

              <div class="pol-pied">
                <span class="meta muted">
                  Demandée par <strong>{{ p.demandeePar }}</strong>
                  @if (p.approuveePar) { · décidée par <strong>{{ p.approuveePar }}</strong> }
                  · {{ p.actif ? 'active' : 'inactive' }}
                </span>
                @if (p.statutValidation === 'EN_ATTENTE_APPROBATION') {
                  <span class="boutons">
                    <button class="btn btn-green btn-sm" (click)="approuver(p)">Approuver</button>
                    <button class="btn btn-rose btn-sm" (click)="rejeter(p)">Rejeter</button>
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      h2 {
        color: var(--ink-indigo);
      }
      .rose {
        color: var(--ink-rose);
      }
      .green {
        color: var(--ink-green);
      }
      .explain {
        margin: 1.4rem 0 2rem;
      }
      .explain h3 {
        color: var(--brand-deep);
        margin-bottom: 0.7rem;
      }
      .regles {
        display: grid;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .regles .r {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: var(--ink-soft);
      }
      .regles .p {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex: none;
        transform: translateY(1px);
      }
      .regles .p.teal {
        background: var(--brand);
      }
      .regles .p.amber {
        background: var(--accent);
      }
      .regles .p.rouge {
        background: var(--danger);
      }
      .regles strong {
        color: var(--ink);
      }
      .pick {
        max-width: 460px;
        margin: 1rem 0 1.4rem;
      }
      .wf-card,
      .ajout {
        padding: 1.4rem;
        margin-bottom: 1.4rem;
      }
      .wf-card h3,
      .ajout h3 {
        margin-top: 0;
        color: var(--ink-violet);
      }
      .legende {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 1rem;
        font-size: 0.82rem;
        color: var(--ink-soft);
      }
      .legende i {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.35rem;
      }
      .d.blue {
        background: var(--blue);
      }
      .d.amber {
        background: var(--amber);
      }
      .d.green {
        background: var(--green);
      }
      .d.rose {
        background: var(--rose);
      }
      .ajout .row {
        display: grid;
        grid-template-columns: 1fr 1fr 0.8fr auto;
        gap: 1rem;
        align-items: end;
      }
      .simu {
        padding: 1.4rem;
        margin-bottom: 1.4rem;
      }
      .simu h3 {
        margin-top: 0;
        color: var(--brand-deep);
      }
      .row3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: 1rem;
        align-items: end;
      }
      .verdict {
        margin-top: 1rem;
        padding: 0.7rem 1rem;
        border-radius: 10px;
        font-weight: 600;
      }
      .verdict.ok {
        background: var(--ok-050);
        color: var(--ink-green);
      }
      .verdict.ko {
        background: var(--danger-050);
        color: var(--ink-rose);
      }
      .verdict.warn {
        background: var(--warn-050);
        color: var(--accent-strong);
      }
      @media (max-width: 760px) {
        .row3 {
          grid-template-columns: 1fr;
        }
      }
      .liste {
        display: grid;
        gap: 1rem;
      }
      .pol {
        background: #fff;
        border: 1px solid var(--border);
        border-left-width: 5px;
        border-radius: 16px;
        padding: 1.1rem 1.3rem;
      }
      .bord-badge-blue {
        border-left-color: var(--blue);
      }
      .bord-badge-amber {
        border-left-color: var(--amber);
      }
      .bord-badge-green {
        border-left-color: var(--green);
      }
      .bord-badge-rose {
        border-left-color: var(--rose);
      }
      .pol-tete {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.9rem;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .regle {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .effet {
        font-weight: 800;
        font-size: 0.78rem;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
      }
      .effet.autor {
        color: #fff;
        background: var(--green);
      }
      .effet.refus {
        color: #fff;
        background: var(--rose);
      }
      .type {
        font-weight: 700;
        color: var(--ink);
      }
      .pol-pied {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.9rem;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .meta {
        font-size: 0.84rem;
      }
      .boutons {
        display: flex;
        gap: 0.5rem;
      }
      .vide {
        text-align: center;
        padding: 2rem;
      }
      @media (max-width: 760px) {
        .ajout .row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminPolicies {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly classeValidation = classeValidation;
  readonly libelleValidation = libelleValidation;

  readonly apps = signal<ApplicationAdmin[]>([]);
  readonly codeApp = signal('');
  readonly politiques = signal<Politique[]>([]);
  readonly chargement = signal(false);
  readonly ajoutEnCours = signal(false);

  type: TypeReglePolitique = 'ROLE_REQUIS';
  valeur = '';
  effet: EffetPolitique = 'AUTORISER';

  simRoles = 'AGENT';
  simGroupes = '';
  simOrigine = '';
  readonly verdict = signal<{ autorise: boolean; applicationBloquee: boolean; motif: string | null } | null>(
    null,
  );

  readonly statutMisEnAvant = computed(() => {
    const attente = this.politiques().find((p) => p.statutValidation === 'EN_ATTENTE_APPROBATION');
    return attente?.statutValidation ?? this.politiques()[0]?.statutValidation ?? 'ACTIVE_DIRECTE';
  });

  constructor() {
    this.api.adminApplications().subscribe((l) => {
      this.apps.set(l);
      const q = this.route.snapshot.queryParamMap.get('app');
      if (q) this.choisir(q);
    });
  }

  choisir(code: string): void {
    this.codeApp.set(code);
    this.verdict.set(null);
    this.router.navigate([], { queryParams: { app: code || null }, queryParamsHandling: 'merge' });
    if (!code) {
      this.politiques.set([]);
      return;
    }
    this.chargement.set(true);
    this.api.politiques(code).subscribe({
      next: (l) => {
        this.politiques.set(l);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  libelleType(t: TypeReglePolitique): string {
    return {
      ROLE_REQUIS: 'Rôle requis',
      GROUPE_REQUIS: 'Groupe requis',
      ORIGINE_REQUISE: 'Origine requise',
      OUVERT_A_TOUS: 'Ouvert à tous',
    }[t];
  }

  ajouter(): void {
    const code = this.codeApp();
    if (!code) return;
    if (this.type !== 'OUVERT_A_TOUS' && !this.valeur.trim()) {
      this.toast.erreur('Une valeur est requise pour ce type de règle.');
      return;
    }
    this.ajoutEnCours.set(true);
    this.api
      .ajouterPolitique(code, {
        typeRegle: this.type,
        valeur: this.type === 'OUVERT_A_TOUS' ? null : this.valeur.trim(),
        effet: this.effet,
      })
      .subscribe({
        next: (p) => {
          this.ajoutEnCours.set(false);
          this.valeur = '';
          this.toast.succes(
            p.statutValidation === 'EN_ATTENTE_APPROBATION'
              ? 'Politique créée — en attente d\'un second administrateur.'
              : 'Politique ajoutée et active.',
          );
          this.choisir(code);
        },
        error: (e) => {
          this.ajoutEnCours.set(false);
          this.toast.erreur(e?.error?.detail ?? "Échec de l'ajout.");
        },
      });
  }

  approuver(p: Politique): void {
    this.api.approuverPolitique(p.id).subscribe({
      next: () => {
        this.toast.succes('Politique approuvée.');
        this.choisir(this.codeApp());
      },
      error: (e) =>
        this.toast.erreur(
          e?.status === 409
            ? 'Un autre administrateur doit approuver cette politique.'
            : "Échec de l'approbation.",
        ),
    });
  }

  rejeter(p: Politique): void {
    // prompt() est bloqué dans certains navigateurs intégrés (aperçu IDE) : on prévoit un motif par défaut.
    const motif = (prompt('Motif du rejet ?') ?? '').trim() || 'Rejetée par l’administrateur';
    this.api.rejeterPolitique(p.id, motif).subscribe({
      next: () => {
        this.toast.info('Politique rejetée.');
        this.choisir(this.codeApp());
      },
      error: () => this.toast.erreur('Échec du rejet.'),
    });
  }

  simuler(): void {
    const code = this.codeApp();
    if (!code) {
      this.toast.erreur("Choisissez d'abord une application.");
      return;
    }
    const decouper = (s: string) =>
      s.split(',').map((x) => x.trim()).filter(Boolean);
    this.api
      .simuler(code, {
        roles: decouper(this.simRoles),
        groupes: decouper(this.simGroupes),
        origine: this.simOrigine.trim() || null,
      })
      .subscribe({
        next: (v) => this.verdict.set(v),
        error: () => this.toast.erreur('Échec de la simulation.'),
      });
  }

  motifLisible(motif: string | null): string {
    return (
      {
        NON_AUTHENTIFIE: 'non authentifié',
        APPLICATION_MASQUEE: 'application masquée',
        APPLICATION_ARCHIVEE: 'application archivée',
        APPLICATION_INDISPONIBLE: 'application indisponible',
        POLITIQUE_REFUS: 'une règle REFUSER correspond',
        AUCUNE_POLITIQUE_AUTORISANTE: 'aucune règle autorisante',
        URL_NON_CONFORME: 'URL non conforme',
      }[motif ?? ''] ?? motif ?? 'raison inconnue'
    );
  }
}
