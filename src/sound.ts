import { useStore } from './store';

// Ses dosyası yok: hepsi WebAudio ile üretilen küçük 8-bit bip'ler.
let ctx: AudioContext | null = null;

function tone(freq: number, at: number, dur: number, type: OscillatorType = 'square', vol = 0.05) {
  if (!ctx) ctx = new AudioContext();
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const SOUNDS = {
  pop: () => {
    tone(520, 0, 0.08);
    tone(780, 0.05, 0.1);
  },
  click: () => tone(640, 0, 0.05, 'triangle', 0.08),
  grow: () => {
    tone(392, 0, 0.08);
    tone(523, 0.07, 0.12);
  },
  harvest: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.14));
  },
  remove: () => {
    tone(330, 0, 0.08);
    tone(220, 0.07, 0.14);
  },
};

export type SoundName = keyof typeof SOUNDS;

export function play(name: SoundName) {
  if (!useStore.getState().data.settings.sound) return;
  try {
    SOUNDS[name]();
  } catch {
    /* ses kartı yoksa sessizce geç */
  }
}
