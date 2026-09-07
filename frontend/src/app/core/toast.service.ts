import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  texte: string;
  ton: 'succes' | 'erreur' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private compteur = 0;
  readonly toasts = signal<Toast[]>([]);

  succes(texte: string) {
    this.pousser(texte, 'succes');
  }
  erreur(texte: string) {
    this.pousser(texte, 'erreur');
  }
  info(texte: string) {
    this.pousser(texte, 'info');
  }

  private pousser(texte: string, ton: Toast['ton']) {
    const id = ++this.compteur;
    this.toasts.update((l) => [...l, { id, texte, ton }]);
    setTimeout(() => this.fermer(id), 4200);
  }

  fermer(id: number) {
    this.toasts.update((l) => l.filter((t) => t.id !== id));
  }
}
