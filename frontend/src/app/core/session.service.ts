import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Session } from './models';
import { AccueilSonoreService } from './accueil-sonore.service';

const ANONYME: Session = { authentifie: false, nom: null, email: null, roles: [] };

/** État de session, alimenté par GET /bff/session. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly accueil = inject(AccueilSonoreService);

  private readonly _session = signal<Session>(ANONYME);
  private readonly _charge = signal(false);

  readonly session = this._session.asReadonly();
  readonly charge = this._charge.asReadonly();
  readonly authentifie = computed(() => this._session().authentifie);
  readonly nom = computed(() => this._session().nom ?? '');
  readonly roles = computed(() => this._session().roles);
  readonly estAdmin = computed(() => this._session().roles.includes('ADMIN_PORTAIL'));
  readonly estAuditeur = computed(
    () => this.estAdmin() || this._session().roles.includes('AUDITEUR_PORTAIL'),
  );

  async rafraichir(): Promise<Session> {
    try {
      const s = await firstValueFrom(this.http.get<Session>('/bff/session'));
      this._session.set(s ?? ANONYME);
    } catch {
      this._session.set(ANONYME);
    } finally {
      this._charge.set(true);
    }
    return this._session();
  }

  connexion(): void {
    this.accueil.reinitialiser(); // rejoue la bienvenue au retour de l'authentification
    window.location.href = '/oauth2/authorization/keycloak';
  }

  deconnexion(): void {
    const form = document.createElement('form');
    form.method = 'post';
    form.action = '/bff/logout';
    const jeton = lireCookie('XSRF-TOKEN');
    if (jeton) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_csrf';
      input.value = jeton;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }
}

export function lireCookie(nom: string): string | null {
  const m = document.cookie.match('(^|;)\\s*' + nom + '\\s*=\\s*([^;]+)');
  return m ? decodeURIComponent(m.pop() as string) : null;
}
