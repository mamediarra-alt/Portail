import { Component } from '@angular/core';

/**
 * Illustration d'accueil composée : un agent à son poste (ordinateur), entouré des
 * univers desservis par le portail — sciences & formules, restauration, éducation,
 * données — reliés à un nœud central « portail ». SVG intégré, aucune image externe.
 */
@Component({
  selector: 'app-hero-accueil',
  standalone: true,
  template: `
    <svg viewBox="0 0 560 440" role="img"
         aria-label="Le portail relie l'agent aux applications : sciences, restauration, éducation, données">
      <defs>
        <linearGradient id="ha-toit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#0ea5a4" />
          <stop offset="1" stop-color="#22c55e" />
        </linearGradient>
        <linearGradient id="ha-ecran" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b7c7c" />
          <stop offset="1" stop-color="#075e5e" />
        </linearGradient>
        <filter id="ha-ombre" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#022019" flood-opacity="0.35" />
        </filter>
      </defs>

      <!-- liens pointillés vers le nœud central -->
      <g stroke="rgba(255,255,255,0.5)" stroke-width="1.6" stroke-dasharray="3 5" fill="none">
        <path d="M120 128 C 180 150, 220 175, 258 190" />
        <path d="M456 112 C 396 132, 330 165, 302 184" />
        <path d="M408 210 C 360 206, 330 200, 304 196" />
        <path d="M168 262 C 214 240, 244 214, 270 202" />
      </g>

      <!-- nœud central : portail -->
      <g transform="translate(258,176)" filter="url(#ha-ombre)">
        <rect width="46" height="46" rx="13" fill="#ffffff" />
        <path d="M23 9 L39 15 V28 C39 39 31 45 23 48 C15 45 7 39 7 28 V15 Z" fill="url(#ha-toit)" />
        <circle cx="23" cy="26" r="4.8" fill="#fff" />
        <rect x="21" y="26" width="4" height="9.5" rx="2" fill="#fff" />
      </g>

      <!-- carte : sciences & formules -->
      <g transform="translate(24,54)" filter="url(#ha-ombre)">
        <rect width="196" height="78" rx="15" fill="#ffffff" />
        <text x="18" y="34" font-family="Georgia,'Times New Roman',serif" font-size="18" fill="#0f2033">E = mc²</text>
        <text x="18" y="59" font-family="Georgia,serif" font-size="13" fill="#55697c">∑ &#183; √π &#183; H₂O &#183; ∂x</text>
        <text x="168" y="30" font-size="20">🔬</text>
      </g>

      <!-- carte : restauration -->
      <g transform="translate(390,46)" filter="url(#ha-ombre)">
        <rect width="150" height="68" rx="15" fill="#ffffff" />
        <circle cx="32" cy="34" r="18" fill="#fdf1dd" />
        <text x="32" y="41" text-anchor="middle" font-size="19">🍽️</text>
        <text x="58" y="30" font-size="13" font-weight="700" fill="#0f2033">Restaurant</text>
        <text x="58" y="48" font-size="11" fill="#55697c">scolaire</text>
      </g>

      <!-- carte : éducation -->
      <g transform="translate(406,180)" filter="url(#ha-ombre)">
        <rect width="140" height="64" rx="15" fill="#ffffff" />
        <circle cx="30" cy="32" r="17" fill="#e3faf8" />
        <text x="30" y="39" text-anchor="middle" font-size="18">🎓</text>
        <text x="56" y="29" font-size="12.5" font-weight="700" fill="#0f2033">Éducation</text>
        <text x="56" y="46" font-size="10.5" fill="#55697c">&amp; formation</text>
      </g>

      <!-- carte : données -->
      <g transform="translate(28,236)" filter="url(#ha-ombre)">
        <rect width="140" height="64" rx="15" fill="#ffffff" />
        <g transform="translate(18,18)">
          <rect x="0" y="18" width="9" height="14" rx="2" fill="#0ea5a4" />
          <rect x="15" y="8" width="9" height="24" rx="2" fill="#22c55e" />
          <rect x="30" y="14" width="9" height="18" rx="2" fill="#f59e0b" />
        </g>
        <text x="66" y="29" font-size="12.5" font-weight="700" fill="#0f2033">Données</text>
        <text x="66" y="46" font-size="10.5" fill="#55697c">&amp; pilotage</text>
      </g>

      <!-- bureau + agent + ordinateur -->
      <g transform="translate(180,244)" filter="url(#ha-ombre)">
        <rect x="-10" y="150" width="260" height="12" rx="6" fill="#ffffff" opacity="0.92" />
        <g>
          <circle cx="60" cy="60" r="22" fill="#f2c8a8" />
          <path d="M26 150 C 26 102, 43 90, 60 90 C 77 90, 94 102, 94 150 Z" fill="#0ea5a4" />
          <path d="M92 112 C 118 116, 134 130, 142 144" stroke="#f2c8a8" stroke-width="12" stroke-linecap="round" fill="none" />
        </g>
        <g transform="translate(122,92)">
          <rect x="0" y="0" width="98" height="62" rx="6" fill="#0f2033" />
          <rect x="6" y="6" width="86" height="50" rx="3" fill="url(#ha-ecran)" />
          <path d="M14 42 L28 27 L41 35 L60 16" stroke="#7fe3df" stroke-width="2.6" fill="none" />
          <rect x="14" y="46" width="20" height="3" rx="1.5" fill="#a7f3d0" />
          <rect x="40" y="46" width="32" height="3" rx="1.5" fill="#a7f3d0" />
          <path d="M-10 62 H108 L102 72 H-4 Z" fill="#0f2033" />
        </g>
      </g>

      <!-- accent drapeau -->
      <g transform="translate(258,406)">
        <rect width="15" height="10" fill="#00853F" />
        <rect x="15" width="15" height="10" fill="#FDEF42" />
        <rect x="30" width="15" height="10" fill="#E31B23" />
      </g>
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      svg {
        width: 100%;
        height: auto;
        display: block;
      }
    `,
  ],
})
export class HeroAccueil {}
