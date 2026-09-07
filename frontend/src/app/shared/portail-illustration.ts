import { Component } from '@angular/core';

/**
 * Illustration d'accueil (SVG intégré, sans image externe) : un bâtiment institutionnel,
 * un accès sécurisé (bouclier + serrure) et des applications reliées au portail.
 */
@Component({
  selector: 'app-portail-illustration',
  standalone: true,
  template: `
    <div class="cadre">
      <svg viewBox="0 0 440 300" role="img" aria-label="Le portail relie de manière sécurisée les applications du Ministère">
        <defs>
          <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e6faf8" />
            <stop offset="1" stop-color="#fef6e7" />
          </linearGradient>
          <linearGradient id="toit" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#0ea5a4" />
            <stop offset="1" stop-color="#10b981" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="440" height="300" rx="18" fill="url(#ciel)" />
        <circle cx="360" cy="60" r="34" fill="#fcd34d" opacity="0.55" />

        <!-- applications reliées -->
        <g stroke="#0b7c7c" stroke-width="1.5" stroke-dasharray="3 4" opacity="0.55">
          <path d="M120 120 L60 78" fill="none" />
          <path d="M120 150 L58 165" fill="none" />
          <path d="M320 120 L392 92" fill="none" />
          <path d="M320 150 L394 175" fill="none" />
        </g>
        <g font-size="16" text-anchor="middle">
          <g transform="translate(34,60)">
            <rect width="44" height="40" rx="10" fill="#fff" stroke="#cdd9e1" />
            <text x="22" y="26">🎓</text>
          </g>
          <g transform="translate(34,150)">
            <rect width="44" height="40" rx="10" fill="#fff" stroke="#cdd9e1" />
            <text x="22" y="26">🍽️</text>
          </g>
          <g transform="translate(366,72)">
            <rect width="44" height="40" rx="10" fill="#fff" stroke="#cdd9e1" />
            <text x="22" y="26">💼</text>
          </g>
          <g transform="translate(366,160)">
            <rect width="44" height="40" rx="10" fill="#fff" stroke="#cdd9e1" />
            <text x="22" y="26">📊</text>
          </g>
        </g>

        <!-- bâtiment -->
        <g>
          <rect x="150" y="118" width="140" height="118" fill="#ffffff" stroke="#cdd9e1" />
          <polygon points="140,118 300,118 220,78" fill="url(#toit)" />
          <rect x="216" y="52" width="3" height="20" fill="#0b7c7c" />
          <polygon points="219,52 236,58 219,64" fill="#f59e0b" />
          @for (x of colonnes; track x) {
            <rect [attr.x]="x" y="128" width="12" height="92" rx="3" fill="#eef4f6" stroke="#dbe4e8" />
          }
          <rect x="150" y="220" width="140" height="16" fill="#e3eaef" />
          <rect x="204" y="196" width="32" height="40" rx="4" fill="#0ea5a4" opacity="0.18" />
        </g>

        <!-- bouclier + serrure -->
        <g transform="translate(198,150)">
          <path d="M22 0 L44 8 V26 C44 42 34 52 22 58 C10 52 0 42 0 26 V8 Z"
                fill="#0ea5a4" />
          <circle cx="22" cy="24" r="6" fill="#fff" />
          <rect x="20" y="24" width="4" height="12" rx="2" fill="#fff" />
        </g>

        <text x="220" y="262" text-anchor="middle" font-size="12" font-weight="700" fill="#0b7c7c">
          Un accès unique &amp; sécurisé
        </text>
        <text x="220" y="280" text-anchor="middle" font-size="10.5" fill="#55697c">
          vers toutes les applications du Ministère
        </text>
      </svg>
    </div>
  `,
  styles: [
    `
      .cadre {
        border-radius: 20px;
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border);
        background: #fff;
      }
      svg {
        width: 100%;
        height: auto;
        display: block;
      }
    `,
  ],
})
export class PortailIllustration {
  readonly colonnes = [162, 182, 202, 222, 242, 262];
}
