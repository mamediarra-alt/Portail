import { Component } from '@angular/core';

/**
 * Infographie explicative du contrôle d'accès du portail.
 * SVG intégré, sans image externe : net à toutes les tailles, thème clair.
 */
@Component({
  selector: 'app-workflow-illustration',
  standalone: true,
  template: `
    <figure class="illu">
      <svg viewBox="0 0 900 470" role="img" aria-labelledby="illu-titre">
        <title id="illu-titre">
          Comment le portail décide d'autoriser ou non l'accès à une application
        </title>

        <!-- Colonne 1 : l'utilisateur et son jeton -->
        <g transform="translate(20,150)">
          <rect width="180" height="170" rx="16" fill="#e3faf8" stroke="#0ea5a4" />
          <circle cx="90" cy="46" r="24" fill="#0ea5a4" />
          <text x="90" y="53" text-anchor="middle" font-size="22" fill="#fff">👤</text>
          <text x="90" y="92" text-anchor="middle" font-size="15" font-weight="700" fill="#0f2033">
            Agent connecté
          </text>
          <rect x="18" y="104" width="144" height="52" rx="9" fill="#fff" stroke="#0b7c7c" />
          <text x="90" y="124" text-anchor="middle" font-size="11" font-weight="700" fill="#0b7c7c">
            JETON (Keycloak)
          </text>
          <text x="90" y="142" text-anchor="middle" font-size="10.5" fill="#55697c">
            nom · rôles · groupes
          </text>
        </g>

        <!-- Flèche 1 -->
        <g stroke="#90a2b1" stroke-width="2" fill="none">
          <path d="M205 235 H255" marker-end="url(#fleche)" />
        </g>

        <!-- Colonne 2 : le portail évalue -->
        <g transform="translate(260,60)">
          <rect width="230" height="350" rx="18" fill="#fff" stroke="#cdd9e1" />
          <text x="115" y="30" text-anchor="middle" font-size="13" font-weight="800" fill="#0b7c7c">
            PORTAIL — contrôle d'accès
          </text>

          <!-- étape a -->
          <rect x="18" y="46" width="194" height="46" rx="9" fill="#f1f5f8" />
          <text x="30" y="66" font-size="11.5" font-weight="700" fill="#0f2033">
            1. Application visible ?
          </text>
          <text x="30" y="82" font-size="10.5" fill="#55697c">
            ni archivée, ni masquée
          </text>

          <!-- étape b -->
          <rect x="18" y="104" width="194" height="46" rx="9" fill="#fde3e3" />
          <text x="30" y="124" font-size="11.5" font-weight="700" fill="#b91c1c">
            2. Une règle REFUSER ?
          </text>
          <text x="30" y="140" font-size="10.5" fill="#b91c1c">
            le refus l'emporte toujours
          </text>

          <!-- étape c -->
          <rect x="18" y="162" width="194" height="46" rx="9" fill="#d7f6ea" />
          <text x="30" y="182" font-size="11.5" font-weight="700" fill="#047857">
            3. Une règle AUTORISER ?
          </text>
          <text x="30" y="198" font-size="10.5" fill="#047857">
            rôle / groupe / ouvert à tous
          </text>

          <!-- étape d -->
          <rect x="18" y="220" width="194" height="46" rx="9" fill="#fdf1dd" />
          <text x="30" y="240" font-size="11.5" font-weight="700" fill="#b45309">
            4. Application disponible ?
          </text>
          <text x="30" y="256" font-size="10.5" fill="#b45309">
            sinon : accès bloqué (maintenance)
          </text>

          <!-- étape e -->
          <rect x="18" y="278" width="194" height="52" rx="9" fill="#e3faf8" stroke="#0ea5a4" />
          <text x="115" y="299" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0b7c7c">
            5. URL vérifiée
          </text>
          <text x="115" y="315" text-anchor="middle" font-size="10.5" fill="#55697c">
            https + domaine en liste blanche
          </text>
        </g>

        <!-- Flèches de sortie -->
        <g stroke-width="2" fill="none">
          <path d="M495 150 H560" stroke="#ef4444" marker-end="url(#fleche-r)" />
          <path d="M495 340 H560" stroke="#10b981" marker-end="url(#fleche-v)" />
        </g>

        <!-- Colonne 3 : issues -->
        <g transform="translate(565,110)">
          <rect width="200" height="86" rx="14" fill="#fde3e3" stroke="#ef4444" />
          <text x="100" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="#b91c1c">
            ✕ Accès refusé
          </text>
          <text x="100" y="56" text-anchor="middle" font-size="10.5" fill="#b91c1c">
            message neutre à l'écran
          </text>
          <text x="100" y="72" text-anchor="middle" font-size="10.5" fill="#b91c1c">
            motif réel → journal d'audit
          </text>
        </g>

        <g transform="translate(565,300)">
          <rect width="200" height="86" rx="14" fill="#d7f6ea" stroke="#10b981" />
          <text x="100" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="#047857">
            ✓ Redirection
          </text>
          <text x="100" y="56" text-anchor="middle" font-size="10.5" fill="#047857">
            vers l'application (pleine page)
          </text>
          <text x="100" y="72" text-anchor="middle" font-size="10.5" fill="#047857">
            accès enregistré dans l'audit
          </text>
        </g>

        <!-- Journal d'audit -->
        <g transform="translate(788,150)">
          <rect width="92" height="170" rx="12" fill="#0f2033" />
          <text x="46" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">
            JOURNAL
          </text>
          <text x="46" y="98" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">
            D'AUDIT
          </text>
          <text x="46" y="122" text-anchor="middle" font-size="9.5" fill="#90a2b1">
            inviolable
          </text>
        </g>
        <g stroke="#90a2b1" stroke-width="1.6" stroke-dasharray="4 4" fill="none">
          <path d="M765 153 H788" />
          <path d="M765 343 L788 250" />
        </g>

        <defs>
          <marker id="fleche" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 z" fill="#90a2b1" />
          </marker>
          <marker id="fleche-r" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 z" fill="#ef4444" />
          </marker>
          <marker id="fleche-v" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 z" fill="#10b981" />
          </marker>
        </defs>
      </svg>
      <figcaption>
        À chaque clic sur « Accéder », le <strong>portail refait le contrôle côté serveur</strong> :
        un <strong style="color:#b91c1c">REFUSER</strong> l'emporte toujours ; sans règle
        autorisante, l'accès est refusé ; l'URL cible est vérifiée avant toute redirection ;
        tout est <strong>journalisé</strong>.
      </figcaption>
    </figure>
  `,
  styles: [
    `
      .illu {
        margin: 0;
        background: var(--illu-bg);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.2rem 1.3rem 1rem;
      }
      svg {
        width: 100%;
        height: auto;
        display: block;
      }
      figcaption {
        margin-top: 0.9rem;
        font-size: 0.86rem;
        color: var(--ink-soft);
        line-height: 1.5;
      }
    `,
  ],
})
export class WorkflowIllustration {}
