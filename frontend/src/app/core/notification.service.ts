import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { NotificationItem } from './models';

/** Notifications de l'utilisateur : liste + compteur, rafraîchi périodiquement. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  readonly items = signal<NotificationItem[]>([]);
  readonly nonLues = signal(0);
  private minuteur?: ReturnType<typeof setInterval>;

  demarrer(): void {
    this.rafraichir();
    this.minuteur ??= setInterval(() => this.rafraichirCompteur(), 30_000);
  }

  arreter(): void {
    if (this.minuteur) {
      clearInterval(this.minuteur);
      this.minuteur = undefined;
    }
  }

  rafraichir(): void {
    this.api.notifications().subscribe({ next: (l) => this.items.set(l), error: () => {} });
    this.rafraichirCompteur();
  }

  private rafraichirCompteur(): void {
    this.api.compteurNotifications().subscribe({
      next: (c) => this.nonLues.set(c.nonLues),
      error: () => {},
    });
  }

  marquerLue(id: number): void {
    this.api.marquerNotifLue(id).subscribe({ next: () => this.rafraichir(), error: () => {} });
  }

  toutLu(): void {
    this.api.marquerNotifsToutLu().subscribe({ next: () => this.rafraichir(), error: () => {} });
  }
}
