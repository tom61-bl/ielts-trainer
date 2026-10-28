export interface VoiceLike {
  lang: string;
  name?: string;
}

let ticket = 0;

export function pickEnglishVoice<T extends VoiceLike>(voices: T[]): T | null {
  return (
    voices.find((voice) => /^en-GB/i.test(voice.lang)) ??
    voices.find((voice) => /british/i.test(voice.name ?? "") && /^en/i.test(voice.lang)) ??
    voices.find((voice) => /^en/i.test(voice.lang)) ??
    null
  );
}

export function speakableWord(text: string) {
  return text.replace(/[^\p{L}\p{N}'’ -]+/gu, " ").replace(/\s+/g, " ").trim();
}

export function speakEnglish(
  text: string,
  hooks?: { onStart?: () => void; onEnd?: () => void },
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const phrase = speakableWord(text);
  if (!phrase) return false;
  const mine = ++ticket;
  const synth = window.speechSynthesis;

  const say = () => {
    if (mine !== ticket) return;
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.lang = "en-GB";
    utter.rate = 0.9;
    const voice = pickEnglishVoice(synth.getVoices());
    if (voice) utter.voice = voice;
    utter.onstart = () => hooks?.onStart?.();
    utter.onend = () => hooks?.onEnd?.();
    utter.onerror = () => hooks?.onEnd?.();
    window.setTimeout(() => {
      if (mine !== ticket) return;
      synth.cancel();
      synth.speak(utter);
    }, 40);
  };

  synth.getVoices();
  if (synth.getVoices().length) {
    say();
    return true;
  }
  const onVoices = () => {
    synth.removeEventListener("voiceschanged", onVoices);
    say();
  };
  synth.addEventListener("voiceschanged", onVoices);
  window.setTimeout(() => {
    synth.removeEventListener("voiceschanged", onVoices);
    say();
  }, 250);
  return true;
}

export function stopSpeaking() {
  ticket += 1;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
