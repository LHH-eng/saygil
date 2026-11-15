// 한국어 TTS (expo-speech)
// - 세이길 안내는 순서대로 재생 (앞 안내를 끊지 않음)
// - 차량 내비 음성(가상)이 나오는 동안에는 세이길이 끝날 때까지 기다렸다가 말함
import * as Speech from 'expo-speech';

export function toSpoken(text) {
  return text
    .replace(/○○교/g, '다리')
    .replace(/○○초/g, '초등학교')
    .replace(/○○/g, '')
    .replace(/(\d+)km/g, '$1킬로미터')
    .replace(/(\d+)m(?![a-zA-Z])/g, '$1미터')
    .replace(/(\d+(?:\.\d+)?)L/g, '$1리터')
    .replace(/(-)(\d+)도/g, '영하 $2도')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_PENDING = 3;   // 빨리 감기 중 안내가 너무 밀리면 오래된 것부터 버림
let queue = [];          // { kind: 'saygil' | 'nav', text, onDone }
let current = null;
let seq = 0;
let rate = 1.05;
let watchdog = null;
export const setSpeechRate = (r) => { rate = r; };

// 화면 표시용 상태
let state = { speaking: false, nav: null, waiting: false };
const listeners = new Set();
const emit = () => {
  const waiting = !!current && current.kind === 'nav' && queue.some((q) => q.kind === 'saygil');
  state = {
    speaking: !!current && current.kind === 'saygil',
    nav: current && current.kind === 'nav' ? current.text : null,
    waiting,
  };
  listeners.forEach((f) => f(state));
};
export const onSpeaking = (f) => { listeners.add(f); f(state); return () => listeners.delete(f); };

function pump() {
  if (current || queue.length === 0) return;
  current = queue.shift();
  const id = ++seq;
  emit();
  const item = current;
  const finish = () => {
    if (id !== seq) return;
    clearTimeout(watchdog);
    current = null;
    item.onDone && item.onDone();
    emit();
    pump();
  };
  // onDone이 오지 않는 기기를 위한 안전장치 (글자 수로 길이 추정)
  clearTimeout(watchdog);
  watchdog = setTimeout(finish, (item.text.length * 140) / rate + 2500);
  try {
    const nav = item.kind === 'nav';
    Speech.speak(toSpoken(item.text), {
      language: 'ko-KR',
      rate: nav ? Math.max(rate, 1.1) : rate,
      pitch: nav ? 0.8 : 1.0,
      onDone: finish,
      onStopped: finish,
      onError: finish,
    });
  } catch (e) {
    finish();
  }
}

/** 세이길 안내. 앞 안내가 끝나면 이어서 말함. tag가 같은 대기 안내는 새 것으로 바꿈 (같은 장소의 1km 안내 → 300m 안내) */
export function say(text, { onDone, tag } = {}) {
  if (tag) queue = queue.filter((q) => q.tag !== tag);
  const pending = queue.filter((q) => q.kind === 'saygil');
  if (pending.length >= MAX_PENDING) queue.splice(queue.indexOf(pending[0]), 1);
  queue.push({ kind: 'saygil', text, onDone, tag });
  emit();
  pump();
}

/** 차량 내비 음성 (가상). 내비가 우선: 세이길이 말하던 안내는 끊고, 내비가 끝날 때까지 대기 */
export function navSay(text) {
  queue.unshift({ kind: 'nav', text });
  if (current && current.kind === 'saygil') {
    seq++;
    clearTimeout(watchdog);
    current = null;
    try { Speech.stop(); } catch (e) { /* ignore */ }
  }
  emit();
  pump();
}

/** 지금 말하는 것과 대기 중인 것을 모두 멈춤 */
export function stopSpeech() {
  seq++;
  queue = [];
  current = null;
  clearTimeout(watchdog);
  try { Speech.stop(); } catch (e) { /* ignore */ }
  emit();
}
