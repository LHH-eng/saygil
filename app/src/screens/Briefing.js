// ① 출발 전 브리핑 (P단)
import React from 'react';
import { View } from 'react-native';
import { C } from '../theme.js';
import { abs, T, Btn, Logo, Icon } from '../ui.js';
import MapView from '../MapView.js';
import { ZONES, BRIDGE, SCHOOL, MARKET, TEMP_START, TOTAL_KM } from '../scenario.js';

// 경로 전체(0~2200m x 0~4000m)가 오른쪽 지도에 들어오도록
const CAM = { vx: 1100, vy: 2000, heading: 0, k: 0.16, ax: 1375, ay: 385 };

export default function Briefing({ voice, note, onStart, onAlt }) {
  const chips = [
    { world: BRIDGE.world, text: `1 · ${BRIDGE.chip}`, dx: -150, dy: -70 },
    { world: SCHOOL.world, text: `2 · ${SCHOOL.chip}`, dx: -175, dy: -70 },
    { world: MARKET.world, text: `3 · ${MARKET.chip}`, dx: 40, dy: -24 },
  ];
  const cards = [BRIDGE, SCHOOL, MARKET];
  return (
    <View style={abs(0, 0, 2000, 750)}>
      <MapView width={2000} height={750} cam={CAM} zones={ZONES} chips={chips} showVehicle={false} />
      <View style={abs(-400, -400, 1150, 1550, { backgroundColor: C.bg })} />
      <Logo x={55} y={50} />
      <T style={abs(120, 58, 300, 40, { fontSize: 34, fontWeight: '800' })}>세이길</T>
      <T style={abs(445, 66, 250, 30, { fontSize: 22, color: C.sub, textAlign: 'right' })}>출발 전 · P단</T>
      <T style={abs(55, 128, 680, 120, { fontSize: 46, fontWeight: '900', lineHeight: 58 })}>
        {`오늘 경로에 조심할 곳이\n${ZONES.length}곳 있어요`}
      </T>
      {cards.map((z, i) => (
        <View key={z.id} style={abs(55, 258 + i * 108, 640, 98, { backgroundColor: C.card, borderRadius: 18 })}>
          <View style={abs(22, 21, 56, 56, { backgroundColor: '#3A2E14', borderRadius: 12, alignItems: 'center', justifyContent: 'center' })}>
            <T style={{ fontSize: 30, fontWeight: '900', color: C.amber }}>{i + 1}</T>
          </View>
          <T numberOfLines={1} style={abs(98, 14, 530, 36, { fontSize: 26, fontWeight: '800' })}>{z.briefTitle}</T>
          <T numberOfLines={1} style={abs(98, 56, 530, 30, { fontSize: 20, color: C.sub })}>{z.briefLine(TEMP_START)}</T>
        </View>
      ))}
      <View style={abs(55, 584, 640, 34, { flexDirection: 'row', alignItems: 'center' })}>
        {note ? (
          <T style={{ fontSize: 21, color: C.amber }}>{note}</T>
        ) : voice.speaking ? (
          <>
            <Icon name="speaker" size={26} color={C.blue} />
            <T style={{ fontSize: 21, color: C.blue, marginLeft: 8 }}>세이길이 음성으로 안내 중</T>
          </>
        ) : null}
      </View>
      <Btn x={55} y={630} w={313} h={75} label="결빙 피하는 경로 보기" size={26} onPress={onAlt} />
      <Btn x={384} y={630} w={311} h={75} primary label="이대로 출발" size={28} onPress={onStart} />
      <View style={abs(1517, 665, 448, 55, { backgroundColor: 'rgba(28,34,44,0.92)', borderRadius: 14, justifyContent: 'center', paddingHorizontal: 20 })}>
        <T style={{ fontSize: 22, color: C.sub }}>{`차량 내비 목적지 연동 · 회사까지 32분 · ${TOTAL_KM}km`}</T>
      </View>
      <View style={abs(1517, 600, 448, 52, { backgroundColor: 'rgba(28,34,44,0.92)', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 })}>
        <Icon name="snow" size={24} color={C.dim} />
        <T style={{ fontSize: 22, color: C.sub, marginLeft: 8 }}>{`지금 바깥 ${TEMP_START}°C · 영하가 되면 다시 알려드려요`}</T>
      </View>
    </View>
  );
}
