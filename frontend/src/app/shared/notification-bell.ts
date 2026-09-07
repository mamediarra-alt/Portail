import { Component, HostListener, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../core/notification.service';
import { NotificationItem } from '../core/models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="wrap">
      <button class="rond" type="button" title="Notifications" (click)="basculer($event)">
        🔔
        @if (notif.nonLues() > 0) {
          <span class="pastille">{{ notif.nonLues() > 9 ? '9+' : notif.nonLues() }}</span>
        }
      </button>

      @if (ouvert()) {
        <div class="panneau" (click)="$event.stopPropagation()">
          <header>
            <strong>Notifications</strong>
            @if (notif.nonLues() > 0) {
              <button class="lien" (click)="notif.toutLu()">Tout marquer lu</button>
            }
          </header>
          <ul>
            @for (n of notif.items(); track n.id) {
              <li [class.nonlue]="!n.lue" [class]="'t-' + n.type" (click)="ouvrir(n)">
                <span class="pt"></span>
                <div class="txt">
                  <strong>{{ n.titre }}</strong>
                  <span class="corps">{{ n.corps }}</span>
                  <span class="quand">{{ n.dateCreation | date: 'dd/MM HH:mm' }}</span>
                </div>
              </li>
            } @empty {
              <li class="vide">Aucune notification.</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wrap {
        position: relative;
      }
      .rond {
        position: relative;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--ink);
        border-radius: 999px;
        width: 34px;
        height: 34px;
        cursor: pointer;
        font-size: 0.95rem;
      }
      .rond:hover {
        background: var(--brand-050);
      }
      .pastille {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 17px;
        height: 17px;
        padding: 0 4px;
        border-radius: 999px;
        background: var(--danger);
        color: #fff;
        font-size: 0.65rem;
        font-weight: 800;
        display: grid;
        place-items: center;
      }
      .panneau {
        position: absolute;
        right: 0;
        top: 44px;
        width: 340px;
        max-height: 60vh;
        overflow: auto;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        box-shadow: var(--shadow-lg);
        z-index: 60;
        animation: fade-up 0.16s var(--ease);
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.8rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .lien {
        border: none;
        background: none;
        color: var(--brand-strong);
        font-weight: 700;
        cursor: pointer;
        font-size: 0.8rem;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0.3rem;
      }
      li {
        display: flex;
        gap: 0.6rem;
        padding: 0.6rem 0.7rem;
        border-radius: 10px;
        cursor: pointer;
      }
      li:hover {
        background: var(--surface-2);
      }
      .pt {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 0.35rem;
        flex: none;
        background: transparent;
      }
      li.nonlue .pt {
        background: var(--brand);
      }
      li.t-SUCCES.nonlue .pt {
        background: var(--ok);
      }
      li.t-ALERTE .pt {
        background: var(--danger);
      }
      .txt {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      .txt strong {
        font-size: 0.9rem;
      }
      .corps {
        font-size: 0.82rem;
        color: var(--ink-soft);
      }
      .quand {
        font-size: 0.72rem;
        color: var(--ink-faint);
        margin-top: 0.15rem;
      }
      .vide {
        color: var(--ink-faint);
        justify-content: center;
      }
    `,
  ],
})
export class NotificationBell {
  readonly notif = inject(NotificationService);
  private readonly router = inject(Router);
  readonly ouvert = signal(false);

  @HostListener('document:click')
  fermerDehors(): void {
    this.ouvert.set(false);
  }

  basculer(event?: Event): void {
    event?.stopPropagation();
    const o = !this.ouvert();
    this.ouvert.set(o);
    if (o) this.notif.rafraichir();
  }

  ouvrir(n: NotificationItem): void {
    if (!n.lue) this.notif.marquerLue(n.id);
    this.ouvert.set(false);
    if (n.lien) this.router.navigateByUrl(n.lien);
  }
}
