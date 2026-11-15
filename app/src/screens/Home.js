import React from 'react';
import { View } from 'react-native';
import { C } from '../theme.js';
import { abs, T, Btn, Logo } from '../ui.js';
import MapView from '../MapView.js';
import { ZONES } from '../scenario.js';

const STEPS = [
  ['출발 전 브리핑', '오늘 경로의 조심할 구간 2곳을 알려줘요'],
  ['1km 전 알림 배너', '결빙 구간: 어떤 사고, 지금 할 행동 1개'],
  ['300m 전 화면 분할', '어린이 보호구역: 통과하면 자동 복귀'],
  ['주유 자동 감지', '주유량을 채운 기록 팝업'],
  ['도착 리포트', '안전 통과 결과와 내 영토'],
];

export default function Home({ onStart }) {
  return (
    <View style={abs(0, 0, 2000, 750)}>
      <MapView
        width={2000}
        height={750}
        cam={{ vx: 500, vy: 1250, heading: 0, k: 0.26, ax: 1375, ay: 390 }}
        zones={ZONES}
        showVehicle={false}
      />
      <View style={abs(0, 0, 2000, 750, { backgroundColor: 'rgba(17,21,29,0.82)' })} />
      <View style={abs(0, 0, 900, 750, { backgroundColor: C.bg })} />
      <Logo x={80} y={90} size={84} radius={20} />
      <T style={abs(190, 98, 500, 70, { fontSize: 58, fontWeight: '900' })}>세이길</T>
      <T style={abs(80, 220, 760, 70, { fontSize: 44, fontWeight: '800', lineHeight: 60 })}>
        Safe하게, Say해주는 길
      </T>
      <T style={abs(80, 300, 760, 130, { fontSize: 26, color: C.sub, lineHeight: 40 })}>
        {'사고다발구간에 들어가기 전에\n어떤 사고가 났는지, 지금 무엇을 해야 하는지\n음성으로 알려드려요.'}
      </T>
      <Btn x={80} y={500} w={520} h={110} primary label="시뮬레이션 시작" size={38} onPress={onStart} />
      <T style={abs(80, 640, 780, 60, { fontSize: 20, color: C.dim, lineHeight: 30 })}>
        {'겨울 평일 출근길 예시 · 소리를 켜 주세요 (한국어 음성 안내)\n장소, 시간, 금액은 이해를 돕기 위한 예시예요'}
      </T>
      {STEPS.map(([title, sub], i) => (
        <View key={title} style={abs(1100, 95 + i * 112, 760, 96, { backgroundColor: C.card, borderRadius: 20 })}>
          <View style={abs(22, 22, 52, 52, { backgroundColor: '#3A2E14', borderRadius: 12, alignItems: 'center', justifyContent: 'center' })}>
            <T style={{ fontSize: 28, fontWeight: '900', color: C.amber }}>{i + 1}</T>
          </View>
          <T style={abs(96, 14, 640, 40, { fontSize: 28, fontWeight: '800' })}>{title}</T>
          <T style={abs(96, 54, 640, 32, { fontSize: 21, color: C.sub })}>{sub}</T>
        </View>
      ))}
    </View>
  );
}
