import { StatutApplication, StatutValidationPolitique } from '../core/models';

export function classeStatut(s: StatutApplication): string {
  switch (s) {
    case 'ACTIVE':
      return 'badge-green';
    case 'MAINTENANCE':
      return 'badge-amber';
    case 'INDISPONIBLE':
      return 'badge-rose';
    case 'MASQUEE':
      return 'badge-slate';
  }
}

export function libelleStatut(s: StatutApplication): string {
  return (
    {
      ACTIVE: 'Active',
      MAINTENANCE: 'Maintenance',
      INDISPONIBLE: 'Indisponible',
      MASQUEE: 'Masquée',
    } as const
  )[s];
}

export function classeValidation(s: StatutValidationPolitique): string {
  switch (s) {
    case 'ACTIVE_DIRECTE':
      return 'badge-blue';
    case 'EN_ATTENTE_APPROBATION':
      return 'badge-amber';
    case 'APPROUVEE':
      return 'badge-green';
    case 'REJETEE':
      return 'badge-rose';
  }
}

export function libelleValidation(s: StatutValidationPolitique): string {
  return (
    {
      ACTIVE_DIRECTE: 'Active',
      EN_ATTENTE_APPROBATION: 'En attente',
      APPROUVEE: 'Approuvée',
      REJETEE: 'Rejetée',
    } as const
  )[s];
}

export function classeAction(action: string): string {
  if (action.startsWith('ACCES_APPLICATION_AUTORISE') || action === 'CONNEXION') return 'badge-green';
  if (action.startsWith('ACCES_APPLICATION_REFUSE') || action === 'ERREUR') return 'badge-rose';
  if (action.startsWith('ADMIN_')) return 'badge-violet';
  if (action.startsWith('CONSULTATION')) return 'badge-cyan';
  return 'badge-slate';
}
