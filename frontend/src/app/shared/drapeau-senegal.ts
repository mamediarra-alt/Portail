import { Component } from '@angular/core';

/** Drapeau de la République du Sénégal — SVG inline (bandes vert / or / rouge, étoile verte). */
@Component({
  selector: 'app-drapeau-senegal',
  standalone: true,
  template: `
    <svg viewBox="0 0 90 60" role="img" aria-label="Drapeau du Sénégal">
      <rect width="30" height="60" fill="#00853F" />
      <rect x="30" width="30" height="60" fill="#FDEF42" />
      <rect x="60" width="30" height="60" fill="#E31B23" />
      <path
        fill="#00853F"
        d="M45 19 L47.47 26.6 L55.46 26.6 L48.99 31.3 L51.47 38.9 L45 34.2 L38.53 38.9 L41.01 31.3 L34.54 26.6 L42.53 26.6 Z"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        line-height: 0;
      }
      svg {
        display: block;
        width: 100%;
        height: auto;
      }
    `,
  ],
})
export class DrapeauSenegal {}
