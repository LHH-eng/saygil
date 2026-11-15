// 한국어 TTS (expo-speech). 안내 문장을 소리 내어 읽기 좋게 다듬습니다.
import * as Speech from 'expo-speech';

export function toSpoken(text) {
  return text
    .replace(/○○교/g, '다리')
    .replace(/○○초/g, '초등학교')
    .replace(/○○/g, '')
    .replace(/영하\s?/g, '영하 ')
    .replace(/(\d+)km/g, '$1킬로미터')
    .replace(/(\d+)m(?![a-zA-Z])/g, '$1미터')
    .replace(/(\d+(?:\.\d+)?)L/g, '$1리터')
    .replace(/\s+/g, ' ')
    .trim();
}

let listeners = new Set();
let speaking = false;
let seq = 0;
const emit = () => listeners.forEach((f) => f(speaking));
export const onSpeaking = (f) => { listeners.add(f); return () => listeners.delete(f); };

/** 이전 안내를 끊고 새 안내를 읽습니다. */
export function say(text, { onDone } = {}) {
  try {
    Speech.stop();
    const id = ++seq;
    speaking = true; emit();
    const finish = () => { if (id !== seq) return; speaking = false; emit(); onDone && onDone(); };
    Speech.speak(toSpoken(text), {
      language: 'ko-KR',
      rate: 1.0,
      pitch: 1.0,
      onDone: finish,
      onStopped: () => { if (id === seq) { speaking = false; emit(); } },
      onError: finish,
    });
  } catch (e) {
    speaking = false; emit();
    onDone && onDone();
  }
}

export function stopSpeech() {
  seq++;
  try { Speech.stop(); } catch (e) { /* ignore */ }
  speaking = false; emit();
}
