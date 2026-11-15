// 겨울 출근길 시뮬레이션: 출발 브리핑 → 1km 배너 → 300m 화면 분할 → 주유 팝업 → 도착 리포트
import { useCallback, useEffect, useRef, useState } from 'react';
import { decide } from './engine/guidanceEngine.js';
import { zonesAhead } from './engine/zoneFinder.js';
import { drivingContext, Stage } from './engine/model.js';
import { detect, snapshot } from './engine/fuelDetector.js';
import {
  ZONES, BRIDGE, SCHOOL, ROUTE_LEN, CORNER_S, GAS_S, TEMP_C, TANK_LITERS, ODOMETER,
  positionAt, toLatLon, clockAt,
} from './scenario.js';
import { say, stopSpeech, onSpeaking } from './speech.js';

const SIM_SCALE = 7;     // 실제 1초 = 주행 7초 분량
const TICK_MS = 60;
const BRIEF_SPEECH =
  '오늘 경로에 조심할 구간이 2곳 있어요. 첫 번째, ○○교. 지금 기온 영하 3도라, 다리 위 결빙 사고가 많은 구간이에요. ' +
  '두 번째, ○○초 사거리. 등교 시간에 지나가요. 우회전 중 사고가 많았어요. 이대로 출발할까요?';

function targetSpeed(s, fueled) {
  let t = 70;
  if (s >= 500 && s < BRIDGE.s) t = 40;                 // 배너 안내 후 속도를 줄임
  else if (s >= BRIDGE.s) t = 50;
  if (s > SCHOOL.s - 500 && s < SCHOOL.s + 20) t = 30;   // 어린이 구간
  else if (s >= SCHOOL.s) t = 50;
  for (let i = 1; i < CORNER_S.length - 1; i++) {
    if (Math.abs(s - CORNER_S[i]) < 150) t = Math.min(t, 25); // 코너 감속
  }
  if (!fueled && s > GAS_S - 300) t = Math.min(t, Math.max(6, (GAS_S - s) / 6));
  if (s > ROUTE_LEN - 300) t = Math.min(t, Math.max(6, (ROUTE_LEN - s) / 6));
  return t;
}

const angDiff = (a, b) => ((b - a + 540) % 360) - 180;

export function useSimulation() {
  const [phase, setPhase] = useState('home');
  const [view, setView] = useState({
    s: 0, v: 0, heading: 0, clock: 470, guide: null, toast: null, safeCount: 0, refuel: null,
  });
  const [speaking, setSpeaking] = useState(false);
  const R = useRef(null);
  const timers = useRef([]);

  useEffect(() => onSpeaking(setSpeaking), []);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const reset = () => {
    R.current = {
      s: 0, v: 45, heading: 0, guide: null, passed: {}, safe: {}, spoken: {}, fueled: false,
      toast: null, toastUntil: 0, refuel: null,
    };
  };

  const stop = useCallback(() => {
    clearTimers(); stopSpeech(); setPhase('home');
  }, []);

  const startDrive = useCallback(() => {
    clearTimers();
    stopSpeech();
    setPhase('drive');
  }, []);

  const start = useCallback(() => {
    clearTimers(); stopSpeech(); reset();
    const p = positionAt(0);
    R.current.heading = p.heading;
    setView({ s: 0, v: 0, heading: p.heading, clock: clockAt(0), guide: null, toast: null, safeCount: 0, refuel: null });
    setPhase('briefing');
    say(BRIEF_SPEECH, { onDone: () => later(startDrive, 1500) });
    later(startDrive, 26000); // TTS를 쓸 수 없는 기기를 위한 안전장치
  }, [startDrive]);

  // 주유 팝업을 닫고 주행 재개 (saved=true면 기록 완료)
  const finishFuel = useCallback((saved) => {
    clearTimers();
    say(saved ? '주유 기록을 저장했어요. 다시 출발합니다.' : '나중에 기록할 수 있게 남겨둘게요. 다시 출발합니다.');
    R.current.fueled = true;
    R.current.v = 0;
    setPhase('drive');
  }, []);

  // 주행 루프
  useEffect(() => {
    if (phase !== 'drive') return undefined;
    const r = R.current;
    const dt = TICK_MS / 1000;
    const id = setInterval(() => {
      // 속도
      const tgt = targetSpeed(r.s, r.fueled);
      const rate = (tgt > r.v ? 10 : 18) * dt;
      r.v += Math.max(-rate, Math.min(rate, tgt - r.v));
      r.s = Math.min(ROUTE_LEN, r.s + (r.v / 3.6) * dt * SIM_SCALE);

      const pos = positionAt(r.s);
      r.heading += angDiff(r.heading, pos.heading) * Math.min(1, dt * 7);
      const clock = clockAt(r.s);
      const speed = Math.round(r.v);

      // 안내: 내비 경로 없이 진행 방향 앞쪽 구간을 찾아(ZoneFinder) 엔진(GuidanceEngine)에 묻는다
      const { lat, lon } = toLatLon(pos.x, pos.y);
      const remaining = ZONES.filter((z) => !r.passed[z.id]);
      const ahead = zonesAhead(lat, lon, pos.heading, remaining);
      for (const a of ahead) {
        const ctx = drivingContext(Math.floor(clock / 60), TEMP_C, speed, a.distanceM, a.zone.familiar);
        const g = decide(a.zone, ctx);
        if (!g) continue;
        const key = `${a.zone.id}:${g.stage}`;
        if (!r.spoken[key]) {
          r.spoken[key] = true;
          say(g.message);
          r.guide = { zone: a.zone, ...g, bannerDist: a.distanceM, key };
        } else if (r.guide && r.guide.zone === a.zone && r.guide.stage === g.stage) {
          r.guide = { ...r.guide, strong: g.strong };
        }
        break;
      }
      // 구간 진입 속도 확인, 통과 후 피드백
      for (const z of remaining) {
        const d = z.s - r.s;
        if (d <= 60 && r.safe[z.id] === undefined) {
          const limit = z.type.key === 'ICING' ? 40 : 30;
          r.safe[z.id] = speed <= limit;
        }
        if (d < -20) {
          r.passed[z.id] = true;
          if (r.guide && r.guide.zone === z) r.guide = null;
          const ok = r.safe[z.id];
          r.toast = ok ? `${z.name} 안전하게 통과했어요` : `${z.name} 통과: 속도를 더 줄였으면 좋았어요`;
          r.toastUntil = Date.now() + 3500;
          say(ok ? `${z.type.key === 'ICING' ? '다리를' : '초등학교 앞을'} 안전하게 통과했어요.` : '구간을 통과했어요. 다음엔 속도를 조금 더 줄여볼까요?');
        }
      }
      const toast = Date.now() < r.toastUntil ? r.toast : null;
      const safeCount = Object.values(r.safe).filter(Boolean).length;

      // 주유: 시동을 껐다 켠 뒤 연료량 변화로 감지 (FuelDetector)
      if (!r.fueled && r.s >= GAS_S - 2) {
        r.s = GAS_S; r.v = 0;
        const found = detect(
          snapshot(18, ODOMETER, null, true),
          snapshot(76, ODOMETER, true, true),
          TANK_LITERS,
        );
        r.refuel = found;
        setView({ s: r.s, v: 0, heading: r.heading, clock: clockAt(GAS_S), guide: null, toast: null, safeCount, refuel: found });
        setPhase('fuel');
        say(`주유하셨네요. ${found.liters}L로 추정했어요. 금액만 입력하거나 말씀해 주세요.`);
        return;
      }
      if (r.s >= ROUTE_LEN - 2) {
        r.s = ROUTE_LEN; r.v = 0;
        setView({ s: r.s, v: 0, heading: r.heading, clock: clockAt(ROUTE_LEN), guide: null, toast: null, safeCount, refuel: r.refuel });
        setPhase('arrival');
        const gained = safeCount >= 2 ? 3 : safeCount;
        say(`도착했어요. 위험 구간 ${ZONES.length}곳 중 ${safeCount}곳을 안전하게 통과했고, 오늘 영토 ${gained}곳을 얻었어요.`);
        return;
      }
      setView({ s: r.s, v: r.v, heading: r.heading, clock, guide: r.guide, toast, safeCount, refuel: r.refuel });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => () => { clearTimers(); stopSpeech(); }, []);

  return { phase, view, speaking, start, stop, startDrive, finishFuel, later, clearTimers };
}
