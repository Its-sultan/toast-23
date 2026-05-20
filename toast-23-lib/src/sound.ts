/**
 * toast-23 — Sound notifications (opt-in, WebAudio-based).
 *
 * Generates short distinct tones per variant on the fly — no audio assets to
 * ship. Lazy-creates a single AudioContext, respects user gesture rules, and
 * fails silently on unsupported environments.
 */

import type { InternalVariant } from "./types";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Per-variant note sequences. Frequencies sit in the 500–1200 Hz band
 * where humans hear best; triangle waveforms carry better than pure sine
 * for the louder variants.
 */
type Note = {
  freq: number;
  ms: number;
  /** Peak gain (0..1). */
  gain: number;
  /** Oscillator waveform. */
  type: OscillatorType;
};

const PATCHES: Record<InternalVariant, Note[]> = {
  // Cheerful two-note rise.
  success: [
    { freq: 660, ms: 90, gain: 0.18, type: "sine" },
    { freq: 880, ms: 130, gain: 0.18, type: "sine" },
  ],
  // Descending "uh-oh" — triangle gives richer harmonics so it cuts through.
  error: [
    { freq: 622, ms: 140, gain: 0.3, type: "triangle" },
    { freq: 415, ms: 220, gain: 0.3, type: "triangle" },
  ],
  // Quick double pulse — alert feel.
  warning: [
    { freq: 880, ms: 110, gain: 0.24, type: "triangle" },
    { freq: 880, ms: 110, gain: 0.24, type: "triangle" },
  ],
  // Soft single chime.
  info: [{ freq: 784, ms: 130, gain: 0.18, type: "sine" }],
  default: [{ freq: 660, ms: 100, gain: 0.16, type: "sine" }],
  loading: [],
};

/** Schedule one note relative to `startAt` on the shared AudioContext. */
function scheduleNote(audio: AudioContext, note: Note, startAt: number): number {
  const dur = note.ms / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = note.type;
  osc.frequency.value = note.freq;

  // Short attack ramp avoids the click of an instant-on oscillator.
  const attack = 0.008;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(note.gain, startAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + dur);
  return startAt + dur;
}

function schedulePatch(audio: AudioContext, notes: Note[]): void {
  try {
    // 30ms lead-in covers the gap between resume() resolving and the audio
    // thread actually being ready. Without it, Chromium drops the first note.
    let cursor = audio.currentTime + 0.03;
    const gap = 0.02;
    for (const note of notes) {
      cursor = scheduleNote(audio, note, cursor) + gap;
    }
  } catch {
    /* audio is best-effort */
  }
}

export function playToastSound(variant: InternalVariant): void {
  const audio = getCtx();
  if (!audio) return;
  const notes = PATCHES[variant];
  if (!notes || notes.length === 0) return;

  // Browsers suspend AudioContext until a user gesture. resume() is async,
  // so wait for it to settle — scheduling against a suspended context yields
  // silence on the first call.
  if (audio.state === "suspended") {
    audio.resume().then(
      () => schedulePatch(audio, notes),
      () => {},
    );
    return;
  }
  schedulePatch(audio, notes);
}
