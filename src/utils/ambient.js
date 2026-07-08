// Generative ambient music — no audio files, no loops to license.
//
// v3 (polish pass): same three-layer design as v2 — pad (chord bed),
// pulse (heartbeat), arp (melodic plucks) — but the signal chain grew up:
//   • everything runs through a gentle master compressor (glue)
//   • plucks and pulses feed an echo send (filtered feedback delay) that
//     gives the dry synths space and depth
//   • no raw sawtooths — triangles through lowpass keep pads soft
//   • arp timing and volume are humanized so nothing sounds like a grid
// Volumes stay low — this is candlelight, not a concert.

let ctx = null;
let ambientGain = null;   // mute control
let master = null;        // compressor — everything routes through it
let echoIn = null;        // send bus: delay -> filter -> feedback
let muted = false;
let playing = false;
let currentMood = null;
let timers = [];
let chordIdx = 0;
let currentChord = null;
let liveVoices = [];

// Note frequencies (Hz).
const N = {
  E2: 82.41, F2: 87.31, FS2: 92.5, G2: 98, A2: 110, B2: 123.47,
  C3: 130.81, CS3: 138.59, D3: 146.83, E3: 164.81, F3: 174.61,
  FS3: 185, G3: 196, GS3: 207.65, A3: 220, B3: 246.94,
  C4: 261.63, CS4: 277.18, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
};

const PALETTES = {
  romantic: {
    pad: { wave: "sine", cutoff: 950, vol: 0.03, every: 8 },
    arp: { every: 3.2, wave: "sine", vol: 0.045, decay: 1.6, octave: 2, echo: 0.6 },
    pulse: null,
    chords: [
      [N.A2, N.E3, N.GS3, N.CS4],   // Amaj7
      [N.D3, N.A3, N.CS4, N.E4],    // D
      [N.FS2, N.CS3, N.FS3, N.A3],  // F#m
      [N.E2, N.E3, N.GS3, N.B3],    // E
    ],
  },
  chill: {
    pad: { wave: "sine", cutoff: 650, vol: 0.028, every: 9 },
    arp: { every: 4.8, wave: "triangle", vol: 0.032, decay: 1.2, octave: 1, echo: 0.5 },
    pulse: null,
    chords: [
      [N.C3, N.G3, N.B3, N.E4],     // Cmaj7
      [N.F2, N.F3, N.A3, N.C4],     // Fmaj
      [N.A2, N.G3, N.C4, N.E4],     // Am7
      [N.G2, N.G3, N.B3, N.D4],     // G
    ],
  },
  hype: {
    pad: { wave: "triangle", cutoff: 1500, vol: 0.024, every: 4 },
    arp: { every: 0.58, wave: "triangle", vol: 0.036, decay: 0.22, octave: 2, echo: 0.35, skip: 0.15 },
    pulse: { every: 0.58, freq: 130, drop: 45, decay: 0.16, vol: 0.06, echo: 0.1 },
    chords: [
      [N.C3, N.G3, N.C4, N.E4],
      [N.G2, N.D3, N.B3, N.D4],
      [N.A2, N.E3, N.C4, N.E4],
      [N.F2, N.C3, N.A3, N.C4],
    ],
  },
  intense: {
    pad: { wave: "triangle", cutoff: 520, vol: 0.028, every: 6 },
    arp: { every: 3.3, wave: "sine", vol: 0.028, decay: 1.0, octave: 0.5, echo: 0.5 },
    pulse: { every: 0.83, freq: 100, drop: 36, decay: 0.24, vol: 0.07, echo: 0.15 },
    chords: [
      [N.A2, N.E3, N.A3, N.C4],     // Am
      [N.D3, N.A3, N.D4, N.F4],     // Dm
      [N.E2, N.B2, N.E3, N.G3],     // Em
      [N.G2, N.D3, N.G3, N.B3],     // G
    ],
  },
  playful: {
    pad: { wave: "triangle", cutoff: 1300, vol: 0.015, every: 5.5 },
    arp: { every: 0.45, wave: "triangle", vol: 0.04, decay: 0.18, octave: 2, echo: 0.4, skip: 0.25 },
    pulse: { every: 0.5, freq: 800, drop: 600, decay: 0.05, vol: 0.02, echo: 0.3 },
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

    // Mute gain → compressor → speakers. The compressor is set gentle:
    // it never pumps, it just rounds off overlapping peaks.
    ambientGain = ctx.createGain();
    ambientGain.gain.value = muted ? 0 : 1;

    master = ctx.createDynamicsCompressor();
    master.threshold.value = -28;
    master.knee.value = 24;
    master.ratio.value = 4;
    master.attack.value = 0.02;
    master.release.value = 0.3;

    ambientGain.connect(master);
    master.connect(ctx.destination);

    // Echo send: 0.31s filtered feedback delay. Anything routed here gets
    // soft repeating tails — the cheapest way to make dry synths sound
    // like they're in a room instead of a spreadsheet.
    echoIn = ctx.createGain();
    echoIn.gain.value = 1;
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.31;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 1400;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;

    echoIn.connect(delay);
    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);   // feedback loop
    damp.connect(wet);
    wet.connect(ambientGain);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

// ── Layer voices ───────────────────────────────────────────────────────────

// Pad voice: two detuned oscillators through a lowpass with a slow swell.
const spawnPadVoice = (freq, pad, durSec) => {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = pad.cutoff;
  filter.Q.value = 0.3;

  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(pad.vol, t0 + 2.6);
  g.gain.setValueAtTime(pad.vol, t0 + durSec);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec + 3.4);

  const oscs = [-2.2, 2.2].map((detune) => {
    const osc = c.createOscillator();
    osc.type = pad.wave;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(t0);
    osc.stop(t0 + durSec + 3.8);
    return osc;
  });

  filter.connect(g);
  g.connect(ambientGain);
  liveVoices.push({ gain: g, oscs });
  if (liveVoices.length > 30) liveVoices = liveVoices.slice(-20);
};

// Pluck: one short enveloped note, humanized, with an echo send.
const spawnPluck = (freq, arp) => {
  const c = getCtx();
  if (!c || !freq) return;
  // Humanize: up to ±25ms early/late, ±20% quieter/louder.
  const t0 = c.currentTime + Math.random() * 0.05;
  const vol = arp.vol * (0.8 + Math.random() * 0.4);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = arp.wave;
  osc.frequency.value = freq * arp.octave;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + arp.decay);
  osc.connect(g);
  g.connect(ambientGain);
  if (arp.echo && echoIn) {
    const send = c.createGain();
    send.gain.value = arp.echo;
    g.connect(send);
    send.connect(echoIn);
  }
  osc.start(t0);
  osc.stop(t0 + arp.decay + 0.05);
};

// Pulse: pitch-dropping thump — soft kick at low freqs, woodblock up high.
const spawnPulse = (pulse) => {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pulse.freq, t0);
  osc.frequency.exponentialRampToValueAtTime(pulse.drop, t0 + pulse.decay);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(pulse.vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + pulse.decay);
  osc.connect(g);
  g.connect(ambientGain);
  if (pulse.echo && echoIn) {
    const send = c.createGain();
    send.gain.value = pulse.echo;
    g.connect(send);
    send.connect(echoIn);
  }
  osc.start(t0);
  osc.stop(t0 + pulse.decay + 0.05);
};

// ── Scheduling ─────────────────────────────────────────────────────────────

const clearTimers = () => {
  timers.forEach(clearInterval);
  timers = [];
};

const scheduleMood = () => {
  clearTimers();
  const palette = PALETTES[currentMood] || PALETTES.chill;

  // Pad layer — new chord every `pad.every` seconds, overlapping releases.
  const playChord = () => {
    currentChord = palette.chords[chordIdx % palette.chords.length];
    chordIdx += 1;
    currentChord.forEach((f) => spawnPadVoice(f, palette.pad, palette.pad.every));
  };
  playChord();
  timers.push(setInterval(playChord, palette.pad.every * 1000));

  // Melody layer — plucks a random chord tone; `skip` adds rests for groove.
  if (palette.arp) {
    timers.push(
      setInterval(() => {
        if (!currentChord) return;
        if (palette.arp.skip && Math.random() < palette.arp.skip) return;
        const note = currentChord[Math.floor(Math.random() * currentChord.length)];
        spawnPluck(note, palette.arp);
      }, palette.arp.every * 1000)
    );
  }

  // Rhythm layer — the mood's heartbeat.
  if (palette.pulse) {
    timers.push(setInterval(() => spawnPulse(palette.pulse), palette.pulse.every * 1000));
  }
};

// ── Public API ─────────────────────────────────────────────────────────────

export const startAmbient = (mood = "chill") => {
  if (!getCtx()) return;
  currentMood = mood;
  chordIdx = 0;
  playing = true;
  scheduleMood();
};

export const setAmbientMood = (mood) => {
  if (!playing || mood === currentMood) return;
  currentMood = mood;
  chordIdx = 0;
  scheduleMood(); // new layers start immediately; old pads release naturally
};

export const stopAmbient = () => {
  playing = false;
  clearTimers();
  // Let sounding voices release over ~2s rather than cutting hard.
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
  currentChord = null;
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
