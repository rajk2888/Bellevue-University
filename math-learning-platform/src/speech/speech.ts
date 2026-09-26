/**
 * Thin wrappers over the Web Speech API. Every function degrades gracefully
 * when the browser has no speech support (the UI then falls back to timed
 * captions).
 */

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Turn math symbols into words so the narrator reads them naturally. */
export function speakable(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_, n, d) => `${n} over ${d}`)
    .replace(/−/g, ' minus ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/=/g, ' equals ')
    .replace(/≈/g, ' is about ')
    .replace(/√/g, ' square root of ')
    .replace(/²/g, ' squared ')
    .replace(/\^(\d+)/g, ' to the power $1 ')
    .replace(/→/g, ', so ')
    .replace(/\s+/g, ' ');
}

export interface SpeakOptions {
  rate?: number;
  onEnd?: () => void;
  /** Called with the fraction (0–1) of the text spoken so far. */
  onBoundary?: (fraction: number) => void;
}

export function speak(text: string, opts: SpeakOptions = {}): () => void {
  if (!ttsSupported()) {
    opts.onEnd?.();
    return () => {};
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const spoken = speakable(text);
  const u = new SpeechSynthesisUtterance(spoken);
  u.rate = opts.rate ?? 1;
  u.lang = 'en-US';
  let done = false;
  u.onend = () => {
    if (!done) {
      done = true;
      opts.onEnd?.();
    }
  };
  u.onerror = u.onend;
  if (opts.onBoundary) u.onboundary = (e) => opts.onBoundary!(e.charIndex / spoken.length);
  synth.speak(u);
  return () => {
    done = true;
    synth.cancel();
  };
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/* ---------------- Speech-to-text (for the tutor microphone) ---------------- */

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

export function sttSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function listen(onText: (text: string) => void, onEnd: () => void): () => void {
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    onEnd();
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.onresult = (e) => onText(e.results[0][0].transcript);
  rec.onend = onEnd;
  rec.onerror = onEnd;
  rec.start();
  return () => rec.stop();
}

/** Rough reading time used when narration audio is unavailable. */
export function readingMs(text: string, rate = 1): number {
  const words = text.split(/\s+/).length;
  return Math.max(2500, ((words / 150) * 60_000) / rate);
}
