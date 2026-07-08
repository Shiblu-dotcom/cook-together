// Generative ambient music — no audio files, no loops to license.
// Each mood is a palette: a set of chords, a waveform, a filter brightness,
// and a chord-change rate. Voices fade in over ~2.5s and out over ~3.5s so
// consecutive chords overlap into a continuous, evolving pad. Volumes are
// deliberately low — this is candlelight, not a concert.

let ctx = null;
let ambientGain = null;
let muted = false;
let playing = false;
let currentMood = null;
let chordTimer = null;
let chordIdx = 0;
let liveVoices = [];

// Note frequencies (Hz), low-mid register where pads sound warm not muddy.
const N = {
  E2: 82.41, F2: 87.31, FS2: 92.5, G2: 98, A2: 110, B2: 123.47,
  C3: 130.81, CS3: 138.59, D3: 146.83, E3: 164.81, F3: 174.61,
  FS3: 185, G3: 196, GS3: 207.65, A3: 220, B3: 246.94,
  C4: 261.63, CS4: 277.18, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392,
};

const PALETTES = {
  romantic: {
    wave: "sine", cutoff: 900, rate: 8,
    chords: [
      [N.A2, N.E3, N.GS3, N.CS4],   // Amaj7
      [N.D3, N.A3, N.CS4, N.E4],    // D
      [N.FS2, N.CS3, N.FS3, N.A3],  // F#m
      [N.E2, N.E3, N.GS3, N.B3],    // E
    ],
  },
  chill: {
    wave: "sine", cutoff: 700, rate: 9,
    chords: [
      [N.C3, N.G3, N.B3, N.E4],     // Cmaj7
      [N.F2, N.F3, N.A3, N.C4],     // Fmaj
      [N.A2, N.G3, N.C4, N.E4],     // Am7
      [N.G2, N.G3, N.B3, N.D4],     // G
    ],
  },
  hype: {
    wave: "triangle", cutoff: 2200, rate: 4.5,
    chords: [
      [N.C3, N.G3, N.C4, N.E4],
      [N.G2, N.D3, N.B3, N.D4],
      [N.A2, N.E3, N.C4, N.E4],
      [N.F2, N.C3, N.A3, N.C4],
    ],
  },
  intense: {
    wave: "triangle", cutoff: 600, rate: 6,
    chords: [
      [N.A2, N.E3, N.A3, N.C4],     // Am
      [N.D3, N.A3, N.D4, N.F4],     // Dm
      [N.E2, N.B2, N.E3, N.G3],     // Em
      [N.G2, N.D3, N.G3, N.B3],     // G
    ],
  },
  playful: {
    wave: "triangle", cutoff: 1600, rate: 5.5,
    chords: [
      [N.C3, N.E3, N.G3, N.D4],     // Cadd9
      [N.A2, N.E3, N.G3, N.C4],     // Am7
      [N.F2, N.C3, N.E3, N.A3],     // Fmaj7
      [N.G2, N.D3, N.G3, N.B3],     // G
    ],
  },
};

const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    ambientGain = ctx.createGain();
    ambientGain.gain.value = muted ? 0 : 1;
    ambientGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

// One pad voice: two slightly-detuned oscillators through a lowpass, with a
// slow swell in and out. The detune beat is what makes it feel alive.
const spawnVoice = (freq, palette, durSec) => {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = palette.cutoff;
  filter.Q.value = 0.4;

  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.028, t0 + 2.5);
  g.gain.setValueAtTime(0.028, t0 + durSec);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec + 3.5);

  const oscs = [0, 2.4].map((detune) => {
    const osc = c.createOscillator();
    osc.type = palette.wave;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(t0);
    osc.stop(t0 + durSec + 4);
    return osc;
  });

  filter.connect(g);
  g.connect(ambientGain);
  liveVoices.push({ gain: g, oscs });
  // Prune finished voices so the array doesn't grow forever.
  if (liveVoices.length > 24) liveVoices = liveVoices.slice(-16);
};

const playNextChord = () => {
  const palette = PALETTES[currentMood] || PALETTES.chill;
  const chord = palette.chords[chordIdx % palette.chords.length];
  chordIdx += 1;
  chord.forEach((f) => spawnVoice(f, palette, palette.rate));
};

const scheduleChords = () => {
  if (chordTimer) clearInterval(chordTimer);
  const palette = PALETTES[currentMood] || PALETTES.chill;
  playNextChord();
  chordTimer = setInterval(playNextChord, palette.rate * 1000);
};

// ── Public API ─────────────────────────────────────────────────────────────

export const startAmbient = (mood = "chill") => {
  if (!getCtx()) return;
  currentMood = mood;
  chordIdx = 0;
  playing = true;
  scheduleChords();
};

export const setAmbientMood = (mood) => {
  if (!playing || mood === currentMood) return;
  currentMood = mood;
  chordIdx = 0;
  scheduleChords(); // restarts the cycle in the new palette immediately
};

export const stopAmbient = () => {
  playing = false;
  if (chordTimer) {
    clearInterval(chordTimer);
    chordTimer = null;
  }
  // Let current voices release naturally over ~2s rather than cutting hard.
  if (ctx) {
    const t = ctx.currentTime;
    liveVoices.forEach(({ gain }) => {
      try {
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value || 0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 2);
      } catch {
        /* voice may already be gone */
      }
    });
  }
  liveVoices = [];
};

export const setAmbientMuted = (m) => {
  muted = m;
  if (ambientGain && ctx) {
    const t = ctx.currentTime;
    ambientGain.gain.cancelScheduledValues(t);
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, t);
    ambientGain.gain.linearRampToValueAtTime(m ? 0 : 1, t + 0.4);
  }
};
