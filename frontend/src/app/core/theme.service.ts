import { Injectable, signal } from '@angular/core';

type Theme = 'clair' | 'sombre';
const CLE = 'portail.theme';

/** Thème clair / sombre, mémorisé par navigateur. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.lire());

  constructor() {
    this.appliquer(this.theme());
  }

  basculer(): void {
    const suivant: Theme = this.theme() === 'clair' ? 'sombre' : 'clair';
    this.theme.set(suivant);
    this.appliquer(suivant);
    try {
      localStorage.setItem(CLE, suivant);
    } catch {
      /* stockage indisponible */
    }
  }

  private appliquer(t: Theme): void {
    const root = document.documentElement;
    if (t === 'sombre') {
      root.dataset['theme'] = 'dark';
    } else {
      delete root.dataset['theme'];
    }
  }

  private lire(): Theme {
    try {
      return localStorage.getItem(CLE) === 'sombre' ? 'sombre' : 'clair';
    } catch {
      return 'clair';
    }
  }
}
