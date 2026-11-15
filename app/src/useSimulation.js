// 겨울 출근길 시뮬레이션 (약 2분)
// 브리핑 → 기온 영하로 결빙 다시 알림 → 1km 배너 → 나만의 위험 지점 → 내비 음성 + 300m 화면 분할(정지 3초)
// → 주유 팝업 → 실시간 위험 감지 → 처음 가는 지역 자세한 안내 → 도착 리포트
import { useCallback, useEffect, useRef, useState } from 'react';
import { decide } from './engine/guidanceEngine.js';
import { zonesAhead } from './engine/zoneFinder.js';
import { drivingContext } from './engine/model.js';
import { detect, snapshot } from './engine/fuelDetector.js';
import {
  ZONES, BRIDGE, SCHOOL, MARKET, ROUTE_LEN, CORNER_S, GAS_S, TANK_LITERS, ODOMETER,
  MY_SPOT, NAV_CALL, HAZARD, NEW_AREA, TEMP_START, TEMP_COLD, TEMP_DROP_S, tempAt,
  positionAt, toLatLon, clockAt,
} from './scenario.js';
import { say, navSay, stopSpeech, onSpeaking, setSpeechRate } from './speech.js';

// 단계 이동 메뉴와 첫 화면 목록
export const SCENES = [
  { key: 'briefing', title: '출발 전 브리핑', sub: '오늘 경로의 조심할 곳 3곳' },
  { key: 'temp', title: '기온이 영하로 바뀜', sub: '결빙 구간 다시 알림' },
  { key: 'banner', title: '1km 전 알림 배너', sub: '장소 + 사고 이유 + 행동' },
  { key: 'myspot', title: '나만의 위험 지점', sub: '지난주 급정거 2번 한 곳' },
  { key: 'split', title: '내비 음성 + 300m 화면 분할', sub: '내비가 끝나면 말하고, 정지 3초' },
  { key: 'fuel', title: '주유 자동 감지', sub: '주유량을 채운 기록 팝업' },
  { key: 'hazard', title: '실시간 위험 감지', sub: '500m 앞 차들이 갑자기 멈춤' },
  { key: 'newarea', title: '처음 가는 지역', sub: '1km 전부터 자세히 안내' },
  { key: 'arrival', title: '도착 리포트', sub: '안전 통과 결과와 영토' },
];

const SIM_SCALE = 9;     // 실제 1초 = 주행 9초 분량 (전체 약 2분)
const TICK_MS = 60;
const STOP_HOLD_SEC = 3; // 어린이 보호구역 정지선에서 완전히 멈추는 시간
const SCHOOL_STOP_S = SCHOOL.s - 6;
const BRIEF_SPEECH =
  `오늘 조심할 곳은 3곳이에요. ○○교는 결빙이 잘 생기는 다리인데, 지금 영상 ${TEMP_START}도라 영하가 되면 다시 알려드릴게요. ` +
  '○○초 사거리는 우회전 사고, ○○시장 앞은 처음 가는 동네예요.';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function targetSpeed(s, r) {
  let t = s < 500 ? 70 : s < BRIDGE.s ? 40 : 50;               // 다리 배너 뒤 감속
  if (s > MY_SPOT.s - 300 && s < MY_SPOT.s) t = Math.min(t, 35); // 나만의 위험 지점
  if (s > SCHOOL.s - 500 && s < SCHOOL.s + 20) {                 // 어린이 구간
    t = Math.min(t, 30);
    if (!r.stopDone && s > SCHOOL.s - 300) t = clamp((SCHOOL_STOP_S - s) * 0.25, 6, 30);
  }
  if (s > HAZARD.s - 150 && s < HAZARD.s + 80) t = Math.min(t, 15); // 앞차 급정거 구간
  if (s > MARKET.s - 400 && s < MARKET.s + 20) t = Math.min(t, 30); // 시장 앞
  for (let i = 1; i < CORNER_S.length - 1; i++) {
    if (Math.abs(s - CORNER_S[i]) < 150) t = Math.min(t, 25);     // 코너 감속
  }
  // 주유소, 목적지 앞에서 멈추기 (너무 오래 기어가지 않게 최저 12km)
  if (!r.fueled && s > GAS_S - 250) t = Math.min(t, Math.max(12, (GAS_S - s) / 4));
  if (s > ROUTE_LEN - 250) t = Math.min(t, Math.max(12, (ROUTE_LEN - s) / 4));
  return t;
}

const angDiff = (a, b) => ((b - a + 540) % 360) - 180;

const initial = () => ({
  s: 0, v: 45, heading: 0, guide: null, passed: {}, safe: {}, spoken: {},
  toast: null, toastUntil: 0, notice: null, noticeUntil: 0, refuel: null, hold: null,
  // 장면이 이미 나왔는지
  tempDone: false, spotDone: false, navDone: false, stopDone: false, fueled: false, hazardDone: false, areaDone: false,
  t0: Date.now(),
});

// 단계 이동: 그 장면 바로 앞에서 시작
const PRESETS = {
  temp: { s: 120, v: 60 },
  banner: { s: 380, v: 70, done: ['tempDone'] },
  myspot: { s: 2080, v: 45, pass: [BRIDGE], done: ['tempDone'] },
  split: { s: NAV_CALL.s - 150, v: 30, pass: [BRIDGE], done: ['tempDone', 'spotDone'] },
  fuel: { s: GAS_S - 40, v: 20, pass: [BRIDGE, SCHOOL], done: ['tempDone', 'spotDone', 'navDone', 'stopDone'] },
  hazard: { s: GAS_S + 5, v: 10, pass: [BRIDGE, SCHOOL], done: ['tempDone', 'spotDone', 'navDone', 'stopDone', 'fueled'] },
  newarea: { s: NEW_AREA.s - 120, v: 30, pass: [BRIDGE, SCHOOL], done: ['tempDone', 'spotDone', 'navDone', 'stopDone', 'fueled', 'hazardDone'] },
};

const speechRateFor = (m) => (m >= 4 ? 1.5 : m >= 2 ? 1.25 : 1.05);

export function useSimulation() {
  const [phase, setPhase] = useState('home');
  const [run, setRun] = useState(0);
  const [mul, setMulState] = useState(1);
  const mulRef = useRef(1);
  const [view, setView] = useState({
    s: 0, v: 0, heading: 0, clock: 470, temp: TEMP_START, guide: null, toast: null, notice: null,
    safeCount: 0, refuel: null, hold: null,
  });
  const [voice, setVoice] = useState({ speaking: false, nav: null, waiting: false });
  const R = useRef(initial());
  const timers = useRef([]);

  useEffect(() => onSpeaking(setVoice), []);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const snap = (r, extra) => ({
    s: r.s, v: r.v, heading: r.heading, clock: clockAt(r.s), temp: tempAt(r.s), guide: r.guide,
    toast: Date.now() < r.toastUntil ? r.toast : null,
    notice: Date.now() < r.noticeUntil ? r.notice : null,
    safeCount: Object.values(r.safe).filter(Boolean).length,
    refuel: r.refuel, hold: r.hold != null ? Math.max(1, Math.ceil(r.hold)) : null,
    ...extra,
  });

  const stop = useCallback(() => {
    clearTimers(); stopSpeech(); setPhase('home');
  }, []);

  const startDrive = useCallback(() => {
    clearTimers();
    stopSpeech();
    setPhase('drive');
  }, []);

  const setSpeed = useCallback((m) => {
    mulRef.current = m;
    setMulState(m);
    setSpeechRate(speechRateFor(m));
  }, []);

  const arrive = (r) => {
    const safeCount = Object.values(r.safe).filter(Boolean).length;
    setView(snap(r, { v: 0, guide: null, toast: null, notice: null, hold: null }));
    setPhase('arrival');
    const gained = safeCount >= ZONES.length ? 3 : safeCount;
    console.log(`SAYGIL arrival after ${((Date.now() - r.t0) / 1000).toFixed(1)}s (x${mulRef.current})`);
    say(`도착했어요. 조심할 곳 ${ZONES.length}곳 중 ${safeCount}곳을 안전하게 지났고, 오늘 영토 ${gained}곳을 얻었어요.`);
  };

  const startBriefing = useCallback(() => {
    clearTimers(); stopSpeech();
    R.current = initial();
    R.current.heading = positionAt(0).heading;
    setView(snap(R.current, { v: 0 }));
    setPhase('briefing');
    setRun((n) => n + 1);
    say(BRIEF_SPEECH, { onDone: () => later(startDrive, 500 / mulRef.current) });
    later(startDrive, 30000 / mulRef.current); // TTS를 쓸 수 없는 기기를 위한 안전장치
  }, [startDrive]);

  // 원하는 장면으로 바로 이동 (SCENES 참고)
  const jump = useCallback((key) => {
    if (key === 'briefing') { startBriefing(); return; }
    clearTimers(); stopSpeech();
    const r = initial();
    const pass = (z) => { r.passed[z.id] = true; r.safe[z.id] = true; };
    if (key === 'arrival') {
      ZONES.forEach(pass);
      Object.assign(r, { s: ROUTE_LEN, v: 0, heading: positionAt(ROUTE_LEN).heading });
      R.current = r;
      arrive(r);
      return;
    }
    const p = PRESETS[key];
    (p.pass || []).forEach(pass);
    (p.done || []).forEach((f) => { r[f] = true; });
    Object.assign(r, { s: p.s, v: p.v, heading: positionAt(p.s).heading });
    R.current = r;
    setView(snap(r));
    setPhase('drive');
    setRun((n) => n + 1);
  }, [startBriefing]);

  const start = useCallback(() => jump('briefing'), [jump]);

  // 주유 팝업을 닫고 주행 재개 (saved=true면 기록 완료)
  const finishFuel = useCallback((saved) => {
    clearTimers();
    say(saved ? '주유 기록을 저장했어요.' : '나중에 기록할 수 있게 남겨둘게요.');
    R.current.fueled = true;
    R.current.v = 0;
    setPhase('drive');
  }, []);

  // 주행 루프
  useEffect(() => {
    if (phase !== 'drive') return undefined;
    const r = R.current;
    let last = Date.now();
    const notice = (n) => {
      r.notice = n;
      r.noticeUntil = Date.now() + Math.max(2500, 6000 / mulRef.current);
    };
    const id = setInterval(() => {
      const now = Date.now();
      // 실제 경과 시간 x 재생 배속 (프레임이 느려도 속도 일정)
      const dt = Math.min(0.25, (now - last) / 1000) * mulRef.current;
      last = now;

      // 속도와 위치
      if (r.hold != null) {
        r.v = 0; // 정지선에서 완전히 멈춰 있는 중
      } else {
        const tgt = targetSpeed(r.s, r);
        const rate = (tgt > r.v ? 10 : 18) * dt;
        r.v += clamp(tgt - r.v, -rate, rate);
        const limit = Math.min(r.stopDone ? Infinity : SCHOOL_STOP_S, r.fueled ? Infinity : GAS_S, ROUTE_LEN);
        r.s = Math.min(limit, r.s + (r.v / 3.6) * dt * SIM_SCALE);
      }

      // 어린이 보호구역: 정지선에서 완전히 멈추고 3초 유지 후 출발
      if (!r.stopDone && r.hold == null && r.s >= SCHOOL_STOP_S - 0.5) {
        r.s = SCHOOL_STOP_S; r.v = 0; r.hold = STOP_HOLD_SEC;
        say('잠시 정지. 횡단보도에 아이들이 없는지 확인하세요.');
      } else if (r.hold != null) {
        r.hold -= dt;
        if (r.hold <= 0) {
          r.hold = null; r.stopDone = true; r.safe[SCHOOL.id] = true;
          say('좋아요. 좌우를 살피고 천천히 출발하세요.');
        }
      }

      // ② 주행 중 기온이 영하로 바뀌면 결빙 구간 다시 알림
      if (!r.tempDone && r.s >= TEMP_DROP_S) {
        r.tempDone = true;
        notice({ tone: 'blue', icon: 'snow', title: `바깥 기온이 영하로 내려갔어요 (${TEMP_START}°C → ${TEMP_COLD}°C)`, body: '앞쪽 ○○교 결빙 안내를 다시 켤게요.' });
        say(`바깥 기온이 영하 ${Math.abs(TEMP_COLD)}도로 내려갔어요. 앞쪽 ○○교 결빙 안내를 다시 켤게요.`);
      }
      // ③ 나만의 위험 지점: 내 주행 기록에서 급정거가 반복된 곳
      if (!r.spotDone && r.s >= MY_SPOT.s - MY_SPOT.triggerM && r.s < MY_SPOT.s) {
        r.spotDone = true;
        notice({ tone: 'purple', icon: 'pin', title: `나만의 위험 지점 · ${MY_SPOT.name}`, body: `여기서 지난주에 ${MY_SPOT.times === 2 ? '두' : MY_SPOT.times} 번 급정거하셨어요. 미리 속도를 줄여주세요.` });
        say(`곧 ${MY_SPOT.name}예요. 여기서 지난주에 두 번 급정거하셨어요. 미리 속도를 줄여주세요.`);
      }
      // ① 가상 차량 내비 음성: 세이길은 이 음성이 끝날 때까지 기다렸다가 말함
      if (!r.navDone && r.s >= NAV_CALL.s) {
        r.navDone = true;
        navSay(NAV_CALL.text);
      }
      // ④ 실시간 위험 감지: 앞쪽 차들이 갑자기 멈추는 곳
      if (r.fueled && !r.hazardDone && r.s >= HAZARD.s - HAZARD.triggerM && r.s < HAZARD.s) {
        r.hazardDone = true;
        notice({ tone: 'red', icon: 'alert', title: '실시간 위험 감지 · 500m 앞', body: '앞쪽 차들이 갑자기 멈추고 있어요. 미리 속도를 줄이세요.' });
        say('500m 앞에서 차들이 갑자기 멈추고 있어요. 미리 속도를 줄이세요.');
      }
      // ⑤ 처음 가는 지역: 들어서면 알리고, 이후 구간은 1km 전부터 자세히 (엔진의 familiarRoute=false)
      if (!r.areaDone && r.s >= NEW_AREA.s) {
        r.areaDone = true;
        notice({ tone: 'blue', icon: 'pin', title: `처음 가는 지역 · ${NEW_AREA.name}`, body: '처음 가는 동네라 조심할 곳을 미리, 자세히 알려드릴게요.' });
        say('여기부터는 처음 가는 동네예요. 조심할 곳을 미리, 자세히 알려드릴게요.');
      }

      const pos = positionAt(r.s);
      r.heading += angDiff(r.heading, pos.heading) * Math.min(1, dt * 7);
      const clock = clockAt(r.s);
      const speed = Math.round(r.v);

      // 안내: 내비 경로 없이 진행 방향 앞쪽 구간을 찾아(ZoneFinder) 엔진(GuidanceEngine)에 묻는다
      const { lat, lon } = toLatLon(pos.x, pos.y);
      const remaining = ZONES.filter((z) => !r.passed[z.id]);
      const ahead = zonesAhead(lat, lon, pos.heading, remaining);
      for (const a of ahead) {
        const ctx = drivingContext(Math.floor(clock / 60), tempAt(r.s), speed, a.distanceM, a.zone.familiar);
        const g = decide(a.zone, ctx);
        if (!g) continue;
        const key = `${a.zone.id}:${g.stage}`;
        if (!r.spoken[key]) {
          r.spoken[key] = true;
          say(g.message);
          r.guide = { zone: a.zone, ...g, bannerDist: a.distanceM, key };
        }
        break;
      }
      // 안전 통과 판단: 결빙/시장 앞은 진입 속도, 어린이 구간은 정지 완료 여부
      for (const z of remaining) {
        const d = z.s - r.s;
        if (z !== SCHOOL && d <= 60 && r.safe[z.id] === undefined) r.safe[z.id] = speed <= (z.type.key === 'ICING' ? 40 : 30);
        if (d < -20) {
          r.passed[z.id] = true;
          if (r.guide && r.guide.zone === z) r.guide = null;
          const ok = r.safe[z.id] === true;
          r.toast = ok ? `${z.name} 안전하게 지났어요` : `${z.name} 지남: 속도를 더 줄였으면 좋았어요`;
          r.toastUntil = Date.now() + 3500;
          if (!ok) say('다음엔 속도를 조금 더 줄여볼까요?');
        }
      }

      // 주유: 시동을 껐다 켠 뒤 연료량 변화로 감지 (FuelDetector)
      if (!r.fueled && r.s >= GAS_S - 2) {
        r.s = GAS_S; r.v = 0;
        r.refuel = detect(snapshot(18, ODOMETER, null, true), snapshot(76, ODOMETER, true, true), TANK_LITERS);
        r.guide = null;
        setView(snap(r, { guide: null, toast: null, notice: null }));
        setPhase('fuel');
        say(`주유하셨네요. ${r.refuel.liters}L로 추정했어요. 금액만 말씀해 주세요.`);
        return;
      }
      if (r.s >= ROUTE_LEN - 2) {
        r.s = ROUTE_LEN; r.v = 0;
        arrive(r);
        return;
      }
      setView(snap(r, { clock, v: r.v }));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [phase, run]);

  useEffect(() => () => { clearTimers(); stopSpeech(); }, []);

  return { phase, view, voice, mul, setSpeed, start, jump, stop, startDrive, finishFuel };
}
