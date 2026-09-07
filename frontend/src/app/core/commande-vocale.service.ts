import { Injectable, signal } from '@angular/core';

/** Sous-ensemble de l'API Web Speech (SpeechRecognition) utilisé ici. */
interface ReconnaissanceVocale {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type FabriqueReconnaissance = new () => ReconnaissanceVocale;

function fabrique(): FabriqueReconnaissance | null {
  const w = window as unknown as {
    SpeechRecognition?: FabriqueReconnaissance;
    webkitSpeechRecognition?: FabriqueReconnaissance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Commande vocale (français) : écoute une phrase et renvoie les transcriptions candidates.
 * S'appuie sur l'API SpeechRecognition du navigateur (Chrome / Edge). Indisponible ailleurs.
 */
@Injectable({ providedIn: 'root' })
export class CommandeVocaleService {
  /** Vrai si le navigateur sait faire de la reconnaissance vocale. */
  readonly disponible = fabrique() !== null;

  /** Écoute en cours (pour l'affichage). */
  readonly ecoute = signal(false);

  private reco?: ReconnaissanceVocale;

  /**
   * Démarre l'écoute (fr-FR) et résout avec la liste des transcriptions candidates
   * (par ordre de confiance décroissante), en minuscules. Rejette si rien n'est entendu
   * ou si la reconnaissance échoue.
   */
  ecouter(): Promise<string[]> {
    const Fabrique = fabrique();
    if (!Fabrique) {
      return Promise.reject(new Error('indisponible'));
    }
    this.annuler();

    return new Promise<string[]>((resolve, reject) => {
      const reco = new Fabrique();
      this.reco = reco;
      reco.lang = 'fr-FR';
      reco.continuous = false;
      reco.interimResults = false;
      reco.maxAlternatives = 5;

      let phrases: string[] | null = null;

      reco.onresult = (e) => {
        const alternatives = e.results[0];
        phrases = Array.from({ length: alternatives.length }, (_, i) =>
          alternatives[i].transcript.trim().toLowerCase(),
        ).filter((p) => p.length > 0);
      };
      reco.onerror = (e) => reject(new Error(e.error || 'erreur'));
      reco.onend = () => {
        this.ecoute.set(false);
        this.reco = undefined;
        if (phrases && phrases.length) {
          resolve(phrases);
        } else {
          reject(new Error('silence'));
        }
      };

      try {
        this.ecoute.set(true);
        reco.start();
      } catch (err) {
        this.ecoute.set(false);
        this.reco = undefined;
        reject(err instanceof Error ? err : new Error('demarrage'));
      }
    });
  }

  /** Interrompt une écoute en cours. */
  annuler(): void {
    if (this.reco) {
      try {
        this.reco.abort();
      } catch {
        /* ignore */
      }
      this.reco = undefined;
    }
    this.ecoute.set(false);
  }
}
