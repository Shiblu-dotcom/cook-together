// Synthesized sound design — no audio files needed.
// All cues are generated with the Web Audio API: soft sine/triangle tones with
// exponential decay envelopes, kept quiet and warm so they read as "premium
// app chime", never "arcade cabinet".

let ctx = null;
let masterGain = null;
let muted = false;

const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);
  }
  // Browsers suspend audio contexts created before a user gesture; by the
  // time any cue fires the player has tapped plenty, so resume is safe.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

export const setSfxMuted = (m) => {
  muted = m;
};

// One enveloped oscillator note. `when` is seconds from now. `attack` shapes
// the whole character: 15ms reads as struck, 50ms as felt, 800ms as a swell.
const tone = (freq, { when = 0, dur = 0.5, type = "sine", vol = 0.06, glideTo = null, attack = 0.015 } = {}) => {
  const c = getCtx();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
};

// Filtered noise sweep — used for the twist "whoosh".
const whoosh = ({ when = 0, dur = 0.6, from = 300, to = 1400, vol = 0.05 } = {}) => {
  const c = getCtx();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const len = Math.ceil(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
};

// ── Named cues ─────────────────────────────────────────────────────────────

/** Gentle two-note chime — phase transitions, soft confirmations. */
export const sfxChime = () => {
  tone(659.25, { dur: 0.45, vol: 0.045 });           // E5
  tone(987.77, { when: 0.09, dur: 0.6, vol: 0.035 }); // B5
};

/** Short tick for the final-ten-seconds countdown. */
export const sfxTick = () => {
  tone(880, { dur: 0.09, type: "triangle", vol: 0.05 });
};

/** Deep gong for time's up — low fundamental + octave, long decay, slight sag. */
export const sfxTimesUp = () => {
  tone(110, { dur: 2.2, vol: 0.09, glideTo: 98 });
  tone(220, { dur: 1.6, vol: 0.05, glideTo: 196 });
  tone(330, { when: 0.02, dur: 1.0, vol: 0.02 });
};

/** Rising whoosh + sting for the twist reveal. */
export const sfxTwist = () => {
  whoosh({ dur: 0.55, from: 250, to: 1600, vol: 0.05 });
  tone(523.25, { when: 0.45, dur: 0.35, type: "triangle", vol: 0.05 }); // C5 sting
  tone(783.99, { when: 0.55, dur: 0.4, type: "triangle", vol: 0.04 });  // G5
};

/** The answer reveal — a locket opening, not a notification. One soft felt
    fifth (F#4 + C#5, 50ms attacks so nothing is "struck") and, a breath
    later, a single tiny glint on top. Private, warm, unmistakable. */
export const sfxReveal = () => {
  tone(369.99, { dur: 0.9, vol: 0.04, attack: 0.05 });                 // F#4, felt
  tone(554.37, { when: 0.06, dur: 1.0, vol: 0.032, attack: 0.05 });    // C#5, felt
  tone(1318.5, { when: 0.22, dur: 0.5, vol: 0.014 });                  // E6 glint
};

/** The winner — a champagne chord, not a trumpet. One warm C-major strum
    (notes 35ms apart, like fingers across strings) over a deep root, with a
    quiet fizz rising underneath. Celebration with its collar undone. */
export const sfxFanfare = () => {
  tone(130.81, { dur: 1.8, vol: 0.05, attack: 0.03 });                 // C3 root, warm chest
  const strum = [261.63, 392.0, 523.25, 659.25, 783.99];               // C4 G4 C5 E5 G5
  strum.forEach((f, i) =>
    tone(f, { when: 0.05 + i * 0.035, dur: 1.2, type: "triangle", vol: 0.035 })
  );
  tone(1046.5, { when: 0.28, dur: 1.6, vol: 0.03, attack: 0.06 });     // C6 crown, eased in
  whoosh({ when: 0.05, dur: 0.7, from: 700, to: 2600, vol: 0.018 });   // champagne fizz
};

/** The Word — the chord doesn't strike, it blooms. A-major rising out of
    black with an 800ms attack, matched to the word's blur-to-sharp reveal,
    with a low A2 underneath you feel more than hear. */
export const sfxWord = () => {
  tone(110, { dur: 3.4, vol: 0.035, attack: 0.8 });                    // A2, felt in the chest
  tone(220, { dur: 3.2, vol: 0.045, attack: 0.8 });                    // A3
  tone(277.18, { dur: 3.2, vol: 0.028, attack: 0.9 });                 // C#4
  tone(329.63, { dur: 3.2, vol: 0.024, attack: 0.9 });                 // E4
  tone(440, { when: 0.9, dur: 2.4, vol: 0.018, attack: 0.5 });         // A4 shimmer, late
  tone(880, { when: 1.4, dur: 1.8, vol: 0.008, attack: 0.6 });         // A5 halo, barely there
};
