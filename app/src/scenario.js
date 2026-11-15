// 겨울 출근길 시나리오: 경로, 사고다발구간, 시간 흐름. (장소, 시간, 금액은 시안과 같은 예시)
import { AccidentType, RoadShape, accidentZone } from './engine/model.js';

// 세계 좌표(m): x 동쪽, y 북쪽
export const ROUTE_PTS = [
  [0, 0],
  [0, 1500],      // R1 ○○교 (우회전)
  [1000, 1500],   // R2 (좌회전)
  [1000, 2500],   // R3 ○○초 사거리 (우회전)
  [2200, 2500],   // R4 (좌회전)
  [2200, 3200],   // 회사
];

const segLen = [];
export let ROUTE_LEN = 0;
for (let i = 1; i < ROUTE_PTS.length; i++) {
  const [x0, y0] = ROUTE_PTS[i - 1];
  const [x1, y1] = ROUTE_PTS[i];
  const l = Math.hypot(x1 - x0, y1 - y0);
  segLen.push(l);
  ROUTE_LEN += l;
}
export const CORNER_S = []; // 각 꼭짓점의 경로상 거리
{
  let acc = 0;
  CORNER_S.push(0);
  for (const l of segLen) { acc += l; CORNER_S.push(acc); }
}

/** 경로 거리 s(m) → 위치와 진행 방향(0=북, 90=동) */
export function positionAt(s) {
  const t = Math.max(0, Math.min(ROUTE_LEN, s));
  for (let i = 0; i < segLen.length; i++) {
    if (t <= CORNER_S[i + 1] || i === segLen.length - 1) {
      const [x0, y0] = ROUTE_PTS[i];
      const [x1, y1] = ROUTE_PTS[i + 1];
      const f = (t - CORNER_S[i]) / segLen[i];
      const heading = (Math.atan2(x1 - x0, y1 - y0) * 180 / Math.PI + 360) % 360;
      return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, heading, seg: i };
    }
  }
}

// 세계 좌표 → 위도/경도 (엔진의 ZoneFinder는 위경도를 씁니다)
const ORIGIN_LAT = 37.4900;
const ORIGIN_LON = 127.0000;
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = 111320 * Math.cos((ORIGIN_LAT * Math.PI) / 180);
export const toLatLon = (x, y) => ({ lat: ORIGIN_LAT + y / M_PER_DEG_LAT, lon: ORIGIN_LON + x / M_PER_DEG_LON });

function zoneAt(id, name, [x, y], type, shape, count, peak, extra) {
  const { lat, lon } = toLatLon(x, y);
  return { ...accidentZone(id, name, lat, lon, type, shape, count, peak), world: { x, y }, s: 0, ...extra };
}

export const BRIDGE = zoneAt('Z1', '○○교', ROUTE_PTS[1], AccidentType.ICING, RoadShape.BRIDGE, 9, null, {
  s: CORNER_S[1],
  chip: '결빙',
  briefTitle: '○○교 · 결빙 사고 다발',
  briefLine: (temp) => `지금 기온 ${temp}°C · 다리 위에서 미끄러진 사고가 대부분`,
  bannerTitle: '결빙이 잘 생기는 구간이에요',
  bannerBody: '새벽 다리 위 미끄럼 사고가 대부분이에요.',
  familiar: false,
});
export const SCHOOL = zoneAt('Z2', '○○초 사거리', ROUTE_PTS[3], AccidentType.CHILD_PEDESTRIAN, RoadShape.INTERSECTION, 12, [[7, 9], [13, 17]], {
  s: CORNER_S[3],
  chip: '어린이',
  briefTitle: '○○초 사거리 · 어린이 보행 사고',
  briefLine: () => '등교 시간에 지나가요 · 우회전 중 사고가 많았어요',
  splitTitle: '어린이 횡단보도\n사고가 많았어요',
  splitDo: null, // 엔진의 행동 문구를 그대로 사용
  splitFacts: ['최근 3년 사고 대부분이 우회전 중 발생', '하교 시간(오후 3~5시)에 집중'],
  familiar: true, // 매일 지나는 출근길 초등학교
});
export const ZONES = [BRIDGE, SCHOOL];

export const TEMP_C = -3;
export const TANK_LITERS = 66;
export const GAS_S = CORNER_S[3] + 500;
export const ODOMETER = 32418;
export const TOTAL_KM = 18.4;
export const MONTH_STR = '11월 13일';

// 경로 거리 → 시계(분). 시안의 시각과 맞춤: 07:50 출발, 07:52 다리 1km 전, 08:05 학교, 08:20 주유, 08:41 도착
const CLOCK = [[0, 470], [500, 472], [2200, 485], [GAS_S, 500], [ROUTE_LEN, 521]];
export function clockAt(s) {
  for (let i = 1; i < CLOCK.length; i++) {
    if (s <= CLOCK[i][0]) {
      const [s0, m0] = CLOCK[i - 1];
      const [s1, m1] = CLOCK[i];
      return m0 + ((s - s0) / (s1 - s0)) * (m1 - m0);
    }
  }
  return CLOCK[CLOCK.length - 1][1];
}
export const fmtClock = (min) => {
  const m = Math.floor(min);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

// 내비 안내 문구(왼쪽 위 초록 카드)
export function maneuverAt(s) {
  if (s < CORNER_S[1]) return { dist: CORNER_S[1] - s, text: '○○교 방면 직진' };
  if (s < CORNER_S[2]) return { dist: CORNER_S[2] - s, text: '○○삼거리에서 좌회전' };
  if (s < CORNER_S[3]) {
    const d = CORNER_S[3] - s;
    return { dist: d, text: d <= 300 ? '○○초 사거리에서 우회전' : '○○초 사거리 방면 직진' };
  }
  if (s < GAS_S) return { dist: GAS_S - s, text: '○○주유소 방면 직진' };
  if (s < CORNER_S[4]) return { dist: CORNER_S[4] - s, text: '○○IC 방면 직진' };
  return { dist: ROUTE_LEN - s, text: '회사 방면 직진' };
}
export function fmtDist(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.max(10, Math.round(m / 10) * 10)} m`;
}
