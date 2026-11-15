// ②③ 주행 화면: 전체 화면 내비 + 1km 알림 배너 / 300m 화면 분할 (④ 주유 팝업의 뒤 배경도 이 화면)
// + 장면 알림(기온, 나만의 위험 지점, 실시간 위험, 처음 가는 지역)과 차량 내비 음성 표시
import React, { useRef } from 'react';
import { View } from 'react-native';
import { Circle, G, Text as SText } from 'react-native-svg';
import { C } from '../theme.js';
import { abs, T, Logo, Icon, IconBox } from '../ui.js';
import MapView from '../MapView.js';
import { ZONES, GAS_S, MY_SPOT, HAZARD, positionAt, maneuverAt, fmtDist, fmtClock, ROUTE_LEN, TOTAL_KM } from '../scenario.js';
import { Stage } from '../engine/model.js';
import { ICING_SAFE_SPEED } from '../engine/guidanceEngine.js';

const FULL = { k: 0.4, ax: 790, ay: 590 };
const SPLIT = { k: 0.7, ax: 662, ay: 590 };
const PURPLE = '#9B7BFF';

const TONES = {
  blue: { bg: '#13233D', border: C.blue, iconBg: C.blue, icon: '#0B1220' },
  red: { bg: '#3A1A1D', border: C.red, iconBg: C.red, icon: '#FFFFFF' },
  purple: { bg: '#221A33', border: PURPLE, iconBg: PURPLE, icon: '#120B22' },
};

function SpeedBadge({ x, speed }) {
  return (
    <View style={abs(x, 608, 112, 112, { borderRadius: 56, borderWidth: 4, borderColor: C.red, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' })}>
      <T style={{ fontSize: 46, fontWeight: '900' }}>{speed}</T>
    </View>
  );
}

function NavCard({ m, w, x, y }) {
  return (
    <View style={abs(x, y, w, 155, { backgroundColor: C.green, borderRadius: 18 })}>
      <T style={abs(26, 22, w - 40, 70, { fontSize: 56, fontWeight: '900' })}>{fmtDist(m.dist)}</T>
      <T numberOfLines={1} style={abs(26, 100, w - 40, 34, { fontSize: 24, color: '#CFE5D8' })}>{m.text}</T>
    </View>
  );
}

function TempChip({ x, y, temp }) {
  const cold = temp <= 0;
  return (
    <View style={abs(x, y, 210, 56, { backgroundColor: 'rgba(17,21,29,0.92)', borderRadius: 14, borderWidth: 2, borderColor: cold ? C.blue : 'transparent', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 })}>
      <Icon name="snow" size={26} color={cold ? C.blue : C.dim} />
      <T style={{ fontSize: 23, color: cold ? C.blue : C.sub, fontWeight: '800', marginLeft: 10 }}>{`바깥 ${temp}°C`}</T>
    </View>
  );
}

// 차량 내비(가상) 음성이 나오는 중. 세이길은 끝날 때까지 기다림
function NavVoice({ x, y, voice }) {
  return (
    <View style={abs(x, y, 540, voice.waiting ? 98 : 60, { backgroundColor: 'rgba(12,38,26,0.96)', borderRadius: 14, borderWidth: 2, borderColor: '#2E8B5A', paddingHorizontal: 18, justifyContent: 'center' })}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="speaker" size={26} color="#7FD9A6" />
        <T numberOfLines={1} style={{ fontSize: 23, color: '#CFE5D8', fontWeight: '800', marginLeft: 10 }}>{`차량 내비 음성 · "${voice.nav}"`}</T>
      </View>
      {voice.waiting && (
        <T style={{ fontSize: 20, color: C.amber, marginTop: 6, marginLeft: 36 }}>세이길은 내비 안내가 끝나면 말해요</T>
      )}
    </View>
  );
}

function Notice({ n, x, y, w, h }) {
  const tone = TONES[n.tone] || TONES.blue;
  return (
    <View style={abs(x, y, w, h, { backgroundColor: tone.bg, borderRadius: 24, borderWidth: 3, borderColor: tone.border })}>
      <IconBox x={24} y={(h - 62) / 2} size={62} name={n.icon} bg={tone.iconBg} color={tone.icon} />
      <T numberOfLines={1} style={abs(108, h / 2 - 44, w - 130, 40, { fontSize: 29, fontWeight: '900' })}>{n.title}</T>
      <T numberOfLines={1} style={abs(108, h / 2 + 4, w - 130, 34, { fontSize: 23, color: '#D7DCE4' })}>{n.body}</T>
    </View>
  );
}

export default function Drive({ view, voice, mode = 'drive' }) {
  const g = view.guide;
  const split = mode === 'drive' && !!g && g.stage === Stage.SPLIT;
  const banner = mode === 'drive' && !!g && g.stage === Stage.BANNER;
  const notice = mode === 'drive' ? view.notice : null;
  const speaking = voice.speaking;

  // 화면이 분할되면 지도를 부드럽게 확대
  const cam = useRef({ ...FULL });
  const tgt = split ? SPLIT : FULL;
  cam.current.k += (tgt.k - cam.current.k) * 0.18;
  cam.current.ax += (tgt.ax - cam.current.ax) * 0.18;
  cam.current.ay += (tgt.ay - cam.current.ay) * 0.18;

  const pos = positionAt(view.s);
  const m = maneuverAt(view.s);
  const speed = Math.round(view.v);
  const remainKm = (TOTAL_KM * (ROUTE_LEN - view.s)) / ROUTE_LEN;
  const etaMin = view.clock + (remainKm / TOTAL_KM) * 30;

  // 지도 위 표시: 주유소, 나만의 위험 지점, 실시간 위험 위치
  const markers = (P) => {
    const gas = positionAt(GAS_S);
    const [gx, gy] = P(gas.x, gas.y);
    const [sx, sy] = P(MY_SPOT.world.x, MY_SPOT.world.y);
    const [hx, hy] = P(HAZARD.world.x, HAZARD.world.y);
    return (
      <G>
        <Circle cx={gx} cy={gy} r={20} fill="#1E3A66" stroke={C.blue} strokeWidth={3} />
        {view.s < MY_SPOT.s + 40 && (
          <Circle cx={sx} cy={sy} r={34} fill="rgba(155,123,255,0.25)" stroke={PURPLE} strokeWidth={4} strokeDasharray="8,6" />
        )}
        {view.s >= GAS_S && view.s < HAZARD.s + 80 && (
          <G>
            <Circle cx={hx} cy={hy} r={30} fill="rgba(229,72,77,0.35)" stroke={C.red} strokeWidth={4} />
            <SText x={hx} y={hy + 11} fontSize={32} fontWeight="bold" fill="#FFFFFF" textAnchor="middle">!</SText>
          </G>
        )}
      </G>
    );
  };

  // 위쪽 알림 자리: 구간 배너 > 장면 알림 > 통과 토스트 순서로 아래로 쌓음
  let top = 25;
  const bannerY = banner ? top : null;
  if (banner) top += 135;
  const noticeY = notice ? top : null;
  if (notice) top += 135;
  const toastY = top + 5;
  const nx = split ? 460 : 438;
  const nw = split ? 850 : 1124;

  return (
    <View style={abs(0, 0, 2000, 750)}>
      <MapView
        width={2000}
        height={750}
        cam={{ vx: pos.x, vy: pos.y, heading: view.heading, ...cam.current }}
        zones={ZONES.filter((z) => z.s > view.s - 40)}
        extra={markers}
      />
      {mode === 'fuel' && (
        <T style={abs(30, 695, 600, 30, { fontSize: 22, color: C.dim })}>차량 기본 내비 (뒤) · 정차 P단</T>
      )}

      {mode === 'drive' && (
        <>
          <NavCard m={m} x={split ? 30 : 35} y={split ? 30 : 150} w={split ? 400 : 425} />
          <TempChip x={split ? 30 : 35} y={split ? 200 : 70} temp={view.temp} />
          {voice.nav && <NavVoice x={split ? 30 : 35} y={split ? 270 : 320} voice={voice} />}
          <View style={abs(split ? 30 : 35, 665, split ? 420 : 520, 55, { backgroundColor: 'rgba(17,21,29,0.92)', borderRadius: 14, justifyContent: 'center', paddingHorizontal: 20 })}>
            <T numberOfLines={1} style={{ fontSize: 22, color: C.sub }}>
              {split
                ? '차량 기본 내비 · 화면 2/3로 줄어듦'
                : `차량 기본 내비 · 도착 ${fmtClock(etaMin)} · 남은 거리 ${remainKm.toFixed(1)}km`}
            </T>
          </View>
          <SpeedBadge x={split ? 1183 : 1853} speed={speed} />
        </>
      )}

      {banner && (
        <View style={abs(438, bannerY, 1124, 120, { backgroundColor: C.amberBg, borderRadius: 26, borderWidth: 3, borderColor: C.amber })}>
          <IconBox x={27} y={24} size={64} name={g.zone.type.key === 'ICING' ? 'snow' : 'walker'} bg={C.amber} color="#1A1305" />
          <T numberOfLines={1} style={abs(118, 18, 780, 40, { fontSize: 30, fontWeight: '900' })}>
            {`${g.bannerDist >= 950 ? '1km' : `${Math.round(g.bannerDist / 100) * 100}m`} 앞 ${g.zone.name} · ${g.zone.bannerTitle || g.zone.type.label}`}
          </T>
          <T numberOfLines={1} style={abs(118, 66, 780, 34, { fontSize: 24, color: '#E0D7C0' })}>
            {`${g.zone.bannerBody || ''} ${
              g.zone.type.key === 'ICING'
                ? g.strong ? `속도를 ${ICING_SAFE_SPEED}km로 줄여주세요.` : '지금 속도를 유지하세요.'
                : `${g.zone.type.action}.`
            }`}
          </T>
          <View style={abs(890, 36, 220, 50, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' })}>
            <Icon name="speaker" size={24} color={speaking ? C.amber : C.dim} />
            <T style={{ fontSize: 20, color: speaking ? C.amber : C.dim, marginLeft: 6 }}>{speaking ? '세이길 음성 안내 중' : '세이길 안내'}</T>
          </View>
        </View>
      )}

      {notice && <Notice n={notice} x={nx} y={noticeY} w={nw} h={120} />}

      {view.toast && mode === 'drive' && (
        <View style={abs(split ? 300 : 640, toastY, 720, 64, { backgroundColor: 'rgba(27,42,34,0.96)', borderRadius: 32, borderWidth: 2, borderColor: C.teal, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' })}>
          <Icon name="check" size={30} color={C.teal} />
          <T style={{ fontSize: 26, fontWeight: '800', color: C.teal, marginLeft: 10 }}>{view.toast}</T>
        </View>
      )}

      {split && <SplitPanel g={g} speed={speed} hold={view.hold} temp={view.temp} waiting={voice.waiting} />}
      {mode === 'drive' && view.hold != null && (
        <View style={abs(split ? 600 : 700, 250, 360, 140, { backgroundColor: 'rgba(229,72,77,0.93)', borderRadius: 28, alignItems: 'center', justifyContent: 'center' })}>
          <T style={{ fontSize: 34, fontWeight: '900' }}>정지</T>
          <T style={{ fontSize: 64, fontWeight: '900', lineHeight: 70 }}>{view.hold}</T>
        </View>
      )}
    </View>
  );
}

function SplitPanel({ g, speed, hold, temp, waiting }) {
  const z = g.zone;
  const icing = z.type.key === 'ICING';
  const title = icing ? '이 다리는\n결빙이 잘 생겨요' : z.splitTitle;
  const facts = icing
    ? ['새벽·밤 시간대 미끄럼 사고가 집중', `지금 기온 ${temp}°C · 노면이 얼 수 있어요`]
    : z.splitFacts;
  const action = icing
    ? (speed > ICING_SAFE_SPEED ? `${ICING_SAFE_SPEED}km로 속도를 줄이세요` : '급제동은 피하세요')
    : z.type.action;
  return (
    <View style={abs(1330, -400, 1070, 1550, { backgroundColor: C.amberPanel, borderLeftWidth: 4, borderLeftColor: C.amber })}>
      <View style={abs(0, 400, 670, 750)}>
        <Logo x={39} y={38} size={36} radius={9} />
        <T style={abs(90, 46, 560, 28, { fontSize: 21, color: waiting ? C.amber : C.sub })}>
          {waiting ? '세이길 · 내비 음성이 끝나면 안내할게요' : '세이길 · 300m 앞'}
        </T>
        <IconBox x={39} y={100} size={80} name={icing ? 'snow' : 'walker'} bg={C.amber} color="#1A1305" radius={18} pad={0.22} />
        <T style={abs(136, 98, 520, 90, { fontSize: 36, fontWeight: '900', lineHeight: 44 })}>{title}</T>
        <View style={abs(39, 205, 584, 133, { backgroundColor: C.amberCard, borderRadius: 16 })}>
          <T style={abs(26, 18, 500, 26, { fontSize: 20, color: C.sub })}>{hold != null ? '정지 확인' : '지금 할 일'}</T>
          <T numberOfLines={1} style={abs(26, 56, 540, 52, { fontSize: 38, fontWeight: '900', color: hold != null ? C.teal : C.amber })}>{hold != null ? `멈춤 유지 ${hold}초` : action}</T>
        </View>
        {g.strong && (
          <T style={abs(39, 350, 584, 28, { fontSize: 20, fontWeight: '800', color: C.red })}>{`현재 ${speed}km · 속도가 빨라요`}</T>
        )}
        {facts.map((f, i) => (
          <T key={i} style={abs(39, 392 + i * 40, 590, 32, { fontSize: 22, color: C.sub })}>{`· ${f}`}</T>
        ))}
        <T style={abs(39, 682, 600, 28, { fontSize: 20, color: C.dim })}>통과하면 자동으로 닫히고 내비가 전체 화면으로 돌아와요</T>
      </View>
    </View>
  );
}
