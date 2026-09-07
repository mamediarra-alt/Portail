import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="host">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.ton" (click)="toast.fermer(t.id)">
          <span class="ic">{{ t.ton === 'succes' ? '✓' : t.ton === 'erreur' ? '!' : 'i' }}</span>
          <span>{{ t.texte }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .host {
        position: fixed;
        right: 1.2rem;
        bottom: 1.2rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        z-index: 999;
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.8rem 1.1rem;
        border-radius: 14px;
        background: #fff;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-md);
        font-weight: 600;
        cursor: pointer;
        max-width: 360px;
        animation: slide 0.2s ease;
      }
      @keyframes slide {
        from {
          transform: translateY(8px);
          opacity: 0;
        }
      }
      .ic {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 800;
        flex: none;
      }
      .succes {
        border-left: 4px solid var(--green);
      }
      .succes .ic {
        background: var(--green);
      }
      .erreur {
        border-left: 4px solid var(--rose);
      }
      .erreur .ic {
        background: var(--rose);
      }
      .info {
        border-left: 4px solid var(--blue);
      }
      .info .ic {
        background: var(--blue);
      }
    `,
  ],
})
export class ToastHost {
  readonly toast = inject(ToastService);
}
