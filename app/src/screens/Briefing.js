// ① 출발 전 브리핑 (P단)
import React from 'react';
import { View } from 'react-native';
import { C } from '../theme.js';
import { abs, T, Btn, Logo, Icon } from '../ui.js';
import MapView from '../MapView.js';
import { ZONES, BRIDGE, SCHOOL, TEMP_C, TOTAL_KM } from '../scenario.js';

const CAM = { vx: 500, vy: 1250, heading: 0, k: 0.26, ax: 1375, ay: 390 };

export default function Briefing({ speaking, note, onStart, onAlt }) {
  const chips = [
    { world: BRIDGE.world, text: `1 · ${BRIDGE.chip}`, dx: -150, dy: -105 },
    { world: SCHOOL.world, text: `2 · ${SCHOOL.chip}`, dx: -70, dy: -100 },
  ];
  const cards = [BRIDGE, SCHOOL];
  return (
    <View style={abs(0, 0, 2000, 750)}>
      <MapView width={2000} height={750} cam={CAM} zones={ZONES} chips={chips} showVehicle={false} />
      <View style={abs(0, 0, 750, 750, { backgroundColor: C.bg })} />
      <Logo x={55} y={50} />
      <T style={abs(120, 58, 300, 40, { fontSize: 34, fontWeight: '800' })}>세이길</T>
      <T style={abs(445, 66, 250, 30, { fontSize: 22, color: C.sub, textAlign: 'right' })}>출발 전 · P단</T>
      <T style={abs(55, 128, 680, 120, { fontSize: 46, fontWeight: '900', lineHeight: 58 })}>
        {`오늘 경로에 조심할 구간이\n${ZONES.length}곳 있어요`}
      </T>
      {cards.map((z, i) => (
        <View key={z.id} style={abs(55, 265 + i * 131, 640, 116, { backgroundColor: C.card, borderRadius: 18 })}>
          <View style={abs(25, 28, 60, 60, { backgroundColor: '#3A2E14', borderRadius: 12, alignItems: 'center', justifyContent: 'center' })}>
            <T style={{ fontSize: 32, fontWeight: '900', color: C.amber }}>{i + 1}</T>
          </View>
          <T numberOfLines={1} style={abs(105, 20, 520, 36, { fontSize: 27, fontWeight: '800' })}>{z.briefTitle}</T>
          <T numberOfLines={1} style={abs(105, 64, 520, 30, { fontSize: 21, color: C.sub })}>{z.briefLine(TEMP_C)}</T>
        </View>
      ))}
      <View style={abs(55, 556, 640, 40, { flexDirection: 'row', alignItems: 'center' })}>
        {note ? (
          <T style={{ fontSize: 21, color: C.amber }}>{note}</T>
        ) : speaking ? (
          <>
            <Icon name="speaker" size={26} color={C.blue} />
            <T style={{ fontSize: 21, color: C.blue, marginLeft: 8 }}>세이길이 음성으로 안내 중</T>
          </>
        ) : null}
      </View>
      <Btn x={55} y={625} w={313} h={75} label="결빙 피하는 경로 보기" size={26} onPress={onAlt} />
      <Btn x={384} y={625} w={311} h={75} primary label="이대로 출발" size={28} onPress={onStart} />
      <View style={abs(1517, 665, 448, 55, { backgroundColor: 'rgba(28,34,44,0.92)', borderRadius: 14, justifyContent: 'center', paddingHorizontal: 20 })}>
        <T style={{ fontSize: 22, color: C.sub }}>{`차량 내비 목적지 연동 · 회사까지 32분 · ${TOTAL_KM}km`}</T>
      </View>
    </View>
  );
}
