import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../core/session.service';
import { AccueilSonoreService } from '../core/accueil-sonore.service';
import { DrapeauSenegal } from '../shared/drapeau-senegal';
import { PortailIllustration } from '../shared/portail-illustration';
import { HeroAccueil } from '../shared/hero-accueil';

const MINISTERE = "Ministère de l'Emploi et de la Formation professionnelle et technique";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, DrapeauSenegal, PortailIllustration, HeroAccueil],
  template: `
    <div class="page">
      <span class="ruban" aria-hidden="true"></span>

      <!-- Volet institutionnel -->
      <section class="brand">
        <header class="etat">
          <app-drapeau-senegal class="drapeau" />
          <span class="etat-txt">
            <strong>République du Sénégal</strong>
            <em>Un Peuple — Un But — Une Foi</em>
          </span>
        </header>

        <app-hero-accueil class="hero" />

        <div class="brand-corps">
          @if (emblemeOk()) {
            <img
              class="embleme"
              src="img/armoiries-senegal.png"
              alt="Armoiries de la République du Sénégal"
              (error)="emblemeOk.set(false)"
            />
          }
          <p class="sur-titre">{{ ministere }}</p>
          <h1>Portail <span class="grad">applicatif</span></h1>
          <p class="lead">
            Un accès unique et sécurisé aux applications métier du Ministère —
            sciences, éducation, restauration, données.
          </p>
        </div>

        <footer class="brand-pied">© {{ annee }} République du Sénégal — {{ ministere }}</footer>
      </section>

      <!-- Volet authentification -->
      <section class="auth">
        <app-portail-illustration class="filigrane" aria-hidden="true" />
        <div class="auth-card">
          <div class="auth-tete">
            <app-drapeau-senegal class="mini-drapeau" />
            <div>
              <h2>Connexion</h2>
              <p class="muted sous">Espace réservé aux agents habilités</p>
            </div>
          </div>

          @if (mode() === 'sso') {
            <p class="muted">
              Vous allez être redirigé vers le service d'authentification de l'État.
            </p>
            <button class="btn btn-primary big" (click)="session.connexion()">Se connecter →</button>
          } @else if (mode() === 'demo') {
            <p class="muted">Mode démonstration — saisissez le code d'accès.</p>
            <form (ngSubmit)="connexionDemo()">
              <div class="field">
                <label for="code">Code d'accès</label>
                <input
                  id="code"
                  type="password"
                  [(ngModel)]="code"
                  name="code"
                  autocomplete="off"
                  autofocus
                />
              </div>
              @if (erreur()) {
                <p class="err">{{ erreur() }}</p>
              }
              <button class="btn btn-primary big" type="submit" [disabled]="occupe()">
                {{ occupe() ? 'Vérification…' : 'Entrer →' }}
              </button>
            </form>
            @if (indice()) {
              <p class="fine muted">Code de démonstration : <span class="mono">demo</span></p>
            }
          } @else {
            <div class="spinner"></div>
          }
        </div>
        <p class="pied">République du Sénégal · {{ ministere }}</p>
      </section>
    </div>
  `,
  styles: [
    `
      .page {
        position: relative;
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        background: var(--surface);
      }
      /* bande drapeau en haut de page */
      .ruban {
        position: absolute;
        inset: 0 0 auto 0;
        height: 5px;
        z-index: 3;
        background: linear-gradient(
          90deg,
          #00853f 0 33.33%,
          #fdef42 33.33% 66.66%,
          #e31b23 66.66% 100%
        );
      }

      /* ---- Volet institutionnel ---- */
      .brand {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1.5rem;
        padding: clamp(2.2rem, 4.5vw, 3.6rem);
        color: #fff;
        overflow: hidden;
        isolation: isolate;
        background:
          radial-gradient(1100px 520px at 10% -10%, rgba(0, 133, 63, 0.6), transparent 60%),
          radial-gradient(900px 520px at 110% 120%, rgba(227, 27, 35, 0.55), transparent 58%),
          linear-gradient(155deg, #063a2e 0%, #0b5138 45%, #07302a 100%);
      }
      .hero {
        width: min(100%, 520px);
        align-self: center;
      }

      .etat {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }
      .drapeau {
        width: 48px;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
        flex: none;
      }
      .etat-txt {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }
      .etat-txt strong {
        font-size: 1rem;
        letter-spacing: 0.02em;
      }
      .etat-txt em {
        font-style: normal;
        font-size: 0.76rem;
        opacity: 0.82;
        letter-spacing: 0.04em;
      }

      .brand-corps {
        max-width: 42ch;
      }
      .embleme {
        height: 92px;
        width: auto;
        margin-bottom: 1.4rem;
        filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.45));
      }
      .sur-titre {
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.76rem;
        font-weight: 700;
        opacity: 0.92;
        margin: 0 0 0.6rem;
        line-height: 1.5;
      }
      h1 {
        font-size: clamp(2.2rem, 4vw, 3.4rem);
        line-height: 1.05;
        margin: 0 0 0.9rem;
        color: #fff;
        letter-spacing: -0.03em;
        font-weight: 800;
      }
      .grad {
        color: #fcd34d;
      }
      .lead {
        font-size: 1.06rem;
        line-height: 1.6;
        opacity: 0.92;
        margin: 0 0 1.7rem;
      }
      .pts {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.7rem;
      }
      .pts li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        font-size: 0.95rem;
      }
      .d {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex: none;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.14);
      }
      .d.v {
        background: #12b76a;
      }
      .d.j {
        background: #fcd34d;
      }
      .d.r {
        background: #f97066;
      }
      .brand-pied {
        font-size: 0.72rem;
        opacity: 0.68;
        line-height: 1.5;
      }

      /* ---- Volet authentification ---- */
      .auth {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.4rem;
        padding: clamp(2rem, 5vw, 4rem);
        background: var(--surface);
        overflow: hidden;
      }
      /* Illustration du portail en filigrane, derrière le formulaire */
      .filigrane {
        position: absolute;
        left: 50%;
        top: 50%;
        width: min(165%, 720px);
        transform: translate(-50%, -50%);
        opacity: 0.14;
        pointer-events: none;
        z-index: 0;
      }
      .auth-card {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 388px;
        padding: 2.4rem;
        border-radius: var(--r-lg);
        background: color-mix(in srgb, var(--surface) 90%, transparent);
        backdrop-filter: blur(2px);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .auth .pied {
        position: relative;
        z-index: 1;
      }
      .auth-tete {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        margin-bottom: 0.9rem;
      }
      .mini-drapeau {
        width: 44px;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        flex: none;
      }
      h2 {
        font-size: 1.4rem;
        margin: 0;
        color: var(--ink);
      }
      .sous {
        margin: 0.1rem 0 0;
        font-size: 0.82rem;
      }
      .muted {
        color: var(--ink-soft);
        margin: 0 0 0.4rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin: 0.7rem 0;
      }
      .field label {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--ink-soft);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .field input {
        padding: 0.8rem 0.9rem;
        font-size: 1rem;
      }
      .big {
        font-size: 1.02rem;
        padding: 0.95rem 1.4rem;
        margin-top: 0.7rem;
        justify-content: center;
        width: 100%;
      }
      .err {
        color: var(--ink-rose);
        font-weight: 600;
        margin: 0.2rem 0;
      }
      .fine {
        font-size: 0.82rem;
        margin-top: 0.9rem;
      }
      .pied {
        font-size: 0.74rem;
        color: var(--ink-faint);
        text-align: center;
        max-width: 320px;
        line-height: 1.5;
      }
      .mono {
        font-family: 'Cascadia Code', 'Consolas', ui-monospace, monospace;
        font-size: 0.9em;
      }

      @media (max-width: 920px) {
        .page {
          grid-template-columns: 1fr;
        }
        .brand {
          min-height: 54vh;
        }
      }
    `,
  ],
})
export class Login {
  readonly session = inject(SessionService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly accueil = inject(AccueilSonoreService);

  readonly mode = signal<'inconnu' | 'sso' | 'demo'>('inconnu');
  readonly indice = signal(false);
  readonly erreur = signal('');
  readonly occupe = signal(false);
  /** Armoiries officielles : fichier `public/img/armoiries-senegal.png` (sinon masqué). */
  readonly emblemeOk = signal(true);
  readonly annee = new Date().getFullYear();
  readonly ministere = MINISTERE;
  code = '';

  constructor() {
    firstValueFrom(this.http.get<{ demo: boolean; indiceCode: boolean }>('/bff/mode'))
      .then((m) => {
        this.mode.set(m?.demo ? 'demo' : 'sso');
        this.indice.set(!!m?.indiceCode);
      })
      .catch(() => this.mode.set('sso'));
  }

  async connexionDemo(): Promise<void> {
    if (!this.code.trim()) {
      return;
    }
    this.occupe.set(true);
    this.erreur.set('');
    try {
      await firstValueFrom(this.http.post('/bff/dev-login', { code: this.code.trim() }));
      await this.session.rafraichir();
      this.accueil.reinitialiser(); // rejoue la bienvenue après cette connexion
      this.router.navigate(['/tableau-de-bord']);
    } catch {
      this.erreur.set("Code d'accès incorrect.");
      this.occupe.set(false);
    }
  }
}
