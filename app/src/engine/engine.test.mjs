// Kotlin 단위 테스트 12개 포팅. 실행: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { AccidentType, RoadShape, Stage, accidentZone, drivingContext } from './model.js';
import { decide } from './guidanceEngine.js';
import { zonesAhead } from './zoneFinder.js';
import { detect, snapshot, unitPrice } from './fuelDetector.js';

const bridge = accidentZone('Z1', '○○교', 37.5, 127.0, AccidentType.ICING, RoadShape.BRIDGE, 9);
const school = accidentZone('Z2', '○○초 사거리', 37.51, 127.0, AccidentType.CHILD_PEDESTRIAN, RoadShape.INTERSECTION, 12, [[7, 9], [13, 17]]);
const ctx = ({ hour = 8, temp = -3.0, speed = 70, dist = 1000, familiar = false } = {}) =>
  drivingContext(hour, temp, speed, dist, familiar);

test('1km보다 멀면 안내하지 않는다', () => assert.equal(decide(bridge, ctx({ dist: 1500 })), null));

test('추운 날 결빙 구간은 내 속도를 넣어 구체적으로 안내한다', () => {
  const g = decide(bridge, ctx({ speed: 70, dist: 1000 }));
  assert.equal(g.stage, Stage.BANNER);
  assert.ok(g.strong);
  assert.ok(g.message.includes('결빙이 잘 생기는'));
  assert.ok(g.message.includes('70km에서 40km로'));
});

test('따뜻한 날에는 결빙 안내를 하지 않는다', () => assert.equal(decide(bridge, ctx({ temp: 25.0 })), null));

test('어린이 사고 구간은 사고가 주로 난 시간에만 안내한다', () => {
  assert.ok(decide(school, ctx({ hour: 15, dist: 300 })));
  assert.equal(decide(school, ctx({ hour: 22, dist: 300 })), null);
});

test('300m 안에서는 화면 분할 단계가 되고 행동을 알려준다', () => {
  const g = decide(school, ctx({ hour: 15, speed: 40, dist: 300 }));
  assert.equal(g.stage, Stage.SPLIT);
  assert.equal(g.message, '곧 ○○초 사거리예요. 어린이 횡단보도 사고가 많았던 곳이에요. 우회전 전에 꼭 멈추세요.');
});

test('안내 문장에 사고다발구간이라는 말을 쓰지 않는다', () => {
  const banner = decide(bridge, ctx({ speed: 70, dist: 1000 }));
  assert.equal(banner.message, '1km 앞 ○○교예요. 결빙이 잘 생기는 다리예요. 지금 70km에서 40km로 속도를 줄여주세요.');
  const split = decide(school, ctx({ hour: 15, speed: 40, dist: 300 }));
  assert.ok(!banner.message.includes('사고다발구간') && !split.message.includes('사고다발구간'));
});

test('매일 다니는 길은 1km 전 생략, 300m 전 짧게 한 번', () => {
  assert.equal(decide(school, ctx({ hour: 8, dist: 900, familiar: true })), null);
  assert.equal(decide(school, ctx({ hour: 8, dist: 300, familiar: true })).message, '어린이 주의, 우회전 전에 꼭 멈추세요');
});

test('이미 천천히 가면 강하게 안내하지 않는다', () => assert.equal(decide(bridge, ctx({ speed: 35 })).strong, false));

const mk = (id, lat) => accidentZone(id, id, lat, 127.0, AccidentType.REAR_END, RoadShape.TUNNEL, 5);
test('진행 방향 앞쪽 2km 안의 구간만 고른다', () => {
  const r = zonesAhead(37.5, 127.0, 0.0, [mk('N', 37.51), mk('S', 37.49), mk('F', 37.6)]);
  assert.deepEqual(r.map((a) => a.zone.id), ['N']);
  assert.ok(r[0].distanceM >= 1000 && r[0].distanceM <= 1200);
});

test('주유구가 열리고 연료가 늘면 주유량을 추정한다', () => {
  const r = detect(snapshot(18, 32418, null, true), snapshot(76, 32418, true, true), 66);
  assert.ok(Math.abs(r.liters - 38.3) < 0.001);
});

test('주유구 정보가 없는 차종은 주유소 위치로 판단한다', () => {
  const before = snapshot(20, 100, null, false);
  assert.ok(detect(before, snapshot(80, 100, null, true), 50));
  assert.equal(detect(before, snapshot(80, 100, null, false), 50), null);
});

test('연료가 조금만 늘면 주유가 아니다', () => {
  assert.equal(detect(snapshot(50, 100, null, true), snapshot(52, 100, true, true), 50), null);
});

test('리터당 단가를 계산한다', () => assert.equal(unitPrice(62000, 38.3), 1619));
