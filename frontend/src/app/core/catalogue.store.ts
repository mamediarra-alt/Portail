import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { ItemCatalogue } from './models';

/** Cache partagé du catalogue (tableau de bord + palette de commandes). */
@Injectable({ providedIn: 'root' })
export class CatalogueStore {
  private readonly api = inject(ApiService);
  readonly apps = signal<ItemCatalogue[]>([]);
  readonly charge = signal(false);
  private enCours?: Promise<ItemCatalogue[]>;

  async charger(force = false): Promise<ItemCatalogue[]> {
    if (!force && this.charge()) {
      return this.apps();
    }
    this.enCours ??= firstValueFrom(this.api.catalogue())
      .then((l) => {
        this.apps.set(l);
        this.charge.set(true);
        return l;
      })
      .finally(() => (this.enCours = undefined));
    return this.enCours;
  }
}
