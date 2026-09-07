import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

async function assurerSession(session: SessionService): Promise<void> {
  if (!session.charge()) {
    await session.rafraichir();
  }
}

/** Exige une session authentifiée ; sinon renvoie vers la page de connexion. */
export const authGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  await assurerSession(session);
  return session.authentifie() ? true : router.createUrlTree(['/connexion']);
};

/** Exige le rôle ADMIN_PORTAIL. */
export const adminGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  await assurerSession(session);
  if (!session.authentifie()) {
    session.connexion();
    return false;
  }
  return session.estAdmin() ? true : router.createUrlTree(['/tableau-de-bord']);
};

/** Exige le rôle AUDITEUR_PORTAIL (ou ADMIN_PORTAIL). */
export const auditeurGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  await assurerSession(session);
  if (!session.authentifie()) {
    session.connexion();
    return false;
  }
  return session.estAuditeur() ? true : router.createUrlTree(['/tableau-de-bord']);
};
