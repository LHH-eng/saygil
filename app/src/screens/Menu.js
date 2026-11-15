// 시뮬레이션 메뉴: 재생 속도(x1, x2, x4)와 장면 이동
import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { C } from '../theme.js';
import { abs, T } from '../ui.js';
import { SCENES } from '../useSimulation.js';

const ROW = 50;

export default function Menu({ mul, onSpeed, onJump, onStop }) {
  const [open, setOpen] = useState(false);
  const h = 150 + SCENES.length * ROW + 52;
  return (
    <>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={abs(1830, 8, 150, 40, { borderRadius: 20, backgroundColor: 'rgba(11,14,19,0.75)', alignItems: 'center', justifyContent: 'center' })}
      >
        <T style={{ fontSize: 20, color: C.text }}>{open ? '✕ 닫기' : `☰ 메뉴 ×${mul}`}</T>
      </Pressable>
      {open && (
        <View style={abs(1500, 54, 480, h, { backgroundColor: 'rgba(17,21,29,0.97)', borderRadius: 22, borderWidth: 2, borderColor: C.line })}>
          <T style={abs(24, 14, 300, 26, { fontSize: 20, color: C.sub })}>재생 속도</T>
          {[1, 2, 4].map((m, i) => (
            <Pressable
              key={m}
              onPress={() => onSpeed(m)}
              style={abs(24 + i * 148, 46, 136, 52, { borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: mul === m ? C.blue : C.card })}
            >
              <T style={{ fontSize: 26, fontWeight: '900', color: mul === m ? '#0B1220' : C.text }}>{`×${m}`}</T>
            </Pressable>
          ))}
          <T style={abs(24, 112, 300, 26, { fontSize: 20, color: C.sub })}>장면으로 바로 이동</T>
          {SCENES.map((sc, i) => (
            <Pressable
              key={sc.key}
              onPress={() => { setOpen(false); onJump(sc.key); }}
              style={({ pressed }) => abs(24, 144 + i * ROW, 432, ROW - 6, { borderRadius: 12, backgroundColor: pressed ? C.line : C.card, justifyContent: 'center', paddingHorizontal: 16 })}
            >
              <T numberOfLines={1} style={{ fontSize: 21, fontWeight: '700' }}>{`${i + 1}. ${sc.title}`}</T>
            </Pressable>
          ))}
          <Pressable
            onPress={() => { setOpen(false); onStop(); }}
            style={abs(24, h - 48, 432, 38, { alignItems: 'center', justifyContent: 'center' })}
          >
            <T style={{ fontSize: 21, color: C.red, fontWeight: '800' }}>■ 시뮬레이션 종료</T>
          </Pressable>
        </View>
      )}
    </>
  );
}
