import { Injectable, signal } from '@angular/core';

const CLE_MUET = 'portail.accueil.muet';
const CLE_JOUE = 'portail.accueil.joue'; // sessionStorage : une seule fois par connexion

/** Message de bienvenue : fichier enregistré + texte de repli (synthèse vocale). */
const BIENVENUE = [
  { fichier: '/audio/accueil-fr.wav', texte: 'Bienvenue dans le portail applicatif du Ministère', langue: 'fr-FR' },
  { fichier: '/audio/accueil-en.wav', texte: "Welcome to the Ministry's Application Portal", langue: 'en-US' },
];

/** Question posée juste après la bienvenue (synthèse vocale, FR puis EN). */
const QUESTION = [
  { texte: 'Dans quelle application souhaitez-vous accéder ?', langue: 'fr-FR' },
  { texte: 'Which application would you like to access?', langue: 'en-US' },
];

/**
 * Accueil sonore joué à la connexion : un léger carillon, le message de bienvenue
 * (français puis anglais), puis la question « dans quelle application… » (FR puis EN).
 *
 * Rejoué au premier clic / à la première touche si le navigateur bloque la lecture
 * automatique. Repli sur la synthèse vocale si un fichier audio échoue.
 */
@Injectable({ providedIn: 'root' })
export class AccueilSonoreService {
  readonly muet = signal(this.lireMuet());
  private gestureArme = false;
  private audio?: HTMLAudioElement;

  /** À appeler quand l'utilisateur entre sur le portail (montage du tableau de bord). */
  accueillir(): void {
    if (this.muet() || sessionStorage.getItem(CLE_JOUE) === '1') {
      return;
    }
    this.jouerBienvenue(true);
    this.armerGeste();
  }

  /**
   * Autorise un nouvel accueil (à appeler à la connexion). Le prochain `accueillir()`
   * rejouera le message même si un accueil a déjà eu lieu dans l'onglet.
   */
  reinitialiser(): void {
    try {
      sessionStorage.removeItem(CLE_JOUE);
    } catch {
      /* ignore */
    }
  }

  /** Rejoue l'accueil (bouton « réécouter »). */
  rejouer(): void {
    this.reinitialiser();
    this.carillon();
    this.jouerBienvenue(false);
  }

  basculerMuet(): void {
    const nouveau = !this.muet();
    this.muet.set(nouveau);
    try {
      localStorage.setItem(CLE_MUET, nouveau ? '1' : '0');
    } catch {
      /* stockage indisponible */
    }
    if (nouveau) {
      this.audio?.pause();
      window.speechSynthesis?.cancel();
    }
  }

  // --- interne -------------------------------------------------------

  private marquerJoue(): void {
    try {
      sessionStorage.setItem(CLE_JOUE, '1');
    } catch {
      /* ignore */
    }
  }

  /** Joue les fichiers de bienvenue à la suite, puis enchaîne sur la question. */
  private jouerBienvenue(premiereTentative: boolean, index = 0): void {
    if (this.muet()) {
      return;
    }
    if (index >= BIENVENUE.length) {
      this.poserQuestion(0);
      return;
    }
    try {
      this.audio ??= new Audio();
      const el = this.audio;
      el.src = BIENVENUE[index].fichier;
      el.currentTime = 0;
      el.volume = 0.9;
      el.onended = () => this.jouerBienvenue(false, index + 1);

      Promise.resolve(el.play())
        .then(() => {
          if (index === 0) {
            this.marquerJoue();
          }
        })
        .catch(() => {
          // lecture bloquée : au 1er passage on retentera au premier geste ;
          // sinon on bascule sur la synthèse pour la suite.
          if (!premiereTentative) {
            this.parler(index, BIENVENUE, () => this.jouerBienvenue(false, index + 1), () => this.poserQuestion(0));
          }
        });
    } catch {
      this.parler(index, BIENVENUE, () => this.jouerBienvenue(false, index + 1), () => this.poserQuestion(0));
    }
  }

  /** Pose la question « dans quelle application… » (synthèse vocale, FR puis EN). */
  private poserQuestion(index: number): void {
    if (this.muet() || index >= QUESTION.length) {
      return;
    }
    this.parler(index, QUESTION, () => this.poserQuestion(index + 1), () => {});
  }

  /**
   * Lit `source[index].texte` en synthèse vocale, puis appelle `suite` (élément suivant)
   * ou `fin` (dernier élément atteint).
   */
  private parler(
    index: number,
    source: { texte: string; langue: string }[],
    suite: () => void,
    fin: () => void,
  ): void {
    const synth = window.speechSynthesis;
    if (!synth || index >= source.length) {
      fin();
      return;
    }
    try {
      if (index === 0) {
        synth.cancel();
      }
      const u = new SpeechSynthesisUtterance(source[index].texte);
      u.lang = source[index].langue;
      u.rate = 0.98;
      const voix = synth
        .getVoices()
        .find((v) => v.lang?.toLowerCase().startsWith(source[index].langue.slice(0, 2)));
      if (voix) {
        u.voice = voix;
      }
      if (source === BIENVENUE && index === 0) {
        u.onstart = () => this.marquerJoue();
      }
      u.onend = () => (index + 1 < source.length ? suite() : fin());
      synth.speak(u);
    } catch {
      fin();
    }
  }

  private armerGeste(): void {
    if (this.gestureArme) {
      return;
    }
    this.gestureArme = true;
    const handler = () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
      this.gestureArme = false;
      if (this.muet() || sessionStorage.getItem(CLE_JOUE) === '1') {
        return;
      }
      this.carillon();
      this.jouerBienvenue(false);
    };
    window.addEventListener('pointerdown', handler);
    window.addEventListener('keydown', handler);
  }

  private carillon(): void {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const t = ctx.currentTime + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
      setTimeout(() => ctx.close().catch(() => {}), 1300);
    } catch {
      /* Web Audio indisponible */
    }
  }

  private lireMuet(): boolean {
    try {
      return localStorage.getItem(CLE_MUET) === '1';
    } catch {
      return false;
    }
  }
}
