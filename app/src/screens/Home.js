import React from 'react';
import { View, Pressable } from 'react-native';
import { C } from '../theme.js';
import { abs, T, Btn, Logo } from '../ui.js';
import MapView from '../MapView.js';
import { ZONES } from '../scenario.js';
import { SCENES } from '../useSimulation.js';

export default function Home({ onStart, onPick }) {
  return (
    <View style={abs(0, 0, 2000, 750)}>
      <MapView
        width={2000}
        height={750}
        cam={{ vx: 1100, vy: 2000, heading: 0, k: 0.16, ax: 1450, ay: 385 }}
        zones={ZONES}
        showVehicle={false}
      />
      <View style={abs(-400, -400, 2800, 1550, { backgroundColor: 'rgba(17,21,29,0.86)' })} />
      <View style={abs(-400, -400, 1300, 1550, { backgroundColor: C.bg })} />
      <Logo x={80} y={90} size={84} radius={20} />
      <T style={abs(190, 98, 500, 70, { fontSize: 58, fontWeight: '900' })}>세이길</T>
      <T style={abs(80, 220, 760, 70, { fontSize: 44, fontWeight: '800', lineHeight: 60 })}>
        Safe하게, Say해주는 길
      </T>
      <T style={abs(80, 300, 780, 170, { fontSize: 26, color: C.sub, lineHeight: 40 })}>
        {'내비는 그대로, 세이길은 필요한 순간에만.\n위험한 곳에 들어가기 전에 어떤 사고가 많았던 곳인지,\n지금 무엇을 해야 하는지 음성으로 알려드려요.\n오른쪽 장면을 누르면 그 장면부터 볼 수 있어요.'}
      </T>
      <Btn x={80} y={500} w={520} h={110} primary label="시뮬레이션 시작" size={38} onPress={onStart} />
      <T style={abs(80, 640, 780, 60, { fontSize: 20, color: C.dim, lineHeight: 30 })}>
        {'겨울 평일 출근길 예시 · 약 2분 · 소리를 켜 주세요 (한국어 음성 안내)\n장소, 시간, 금액은 이해를 돕기 위한 예시예요'}
      </T>
      {SCENES.map((sc, i) => (
        <Pressable
          key={sc.key}
          onPress={() => onPick(sc.key)}
          style={({ pressed }) => abs(1000, 28 + i * 77, 940, 68, { backgroundColor: pressed ? C.line : C.card, borderRadius: 16 })}
        >
          <View style={abs(16, 11, 46, 46, { backgroundColor: '#3A2E14', borderRadius: 11, alignItems: 'center', justifyContent: 'center' })}>
            <T style={{ fontSize: 24, fontWeight: '900', color: C.amber }}>{i + 1}</T>
          </View>
          <T numberOfLines={1} style={abs(80, 9, 520, 32, { fontSize: 25, fontWeight: '800' })}>{sc.title}</T>
          <T numberOfLines={1} style={abs(80, 40, 840, 24, { fontSize: 19, color: C.sub })}>{sc.sub}</T>
          <T style={abs(830, 18, 90, 32, { fontSize: 22, color: C.dim, textAlign: 'right' })}>▶</T>
        </Pressable>
      ))}
    </View>
  );
}
