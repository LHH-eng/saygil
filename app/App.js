import React, { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C, STAGE_W, STAGE_H } from './src/theme.js';
import { useSimulation } from './src/useSimulation.js';
import { T, abs } from './src/ui.js';
import { ZONES } from './src/scenario.js';
import Home from './src/screens/Home.js';
import Briefing from './src/screens/Briefing.js';
import Drive from './src/screens/Drive.js';
import FuelPopup from './src/screens/FuelPopup.js';
import Arrival from './src/screens/Arrival.js';

export default function App() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / STAGE_W, height / STAGE_H);
  const sim = useSimulation();
  const [note, setNote] = useState(null);
  const { phase, view, speaking } = sim;

  let screen = null;
  if (phase === 'home') {
    screen = <Home onStart={() => { setNote(null); sim.start(); }} />;
  } else if (phase === 'briefing') {
    screen = (
      <Briefing
        speaking={speaking}
        note={note}
        onStart={sim.startDrive}
        onAlt={() => setNote('데모에서는 기본 경로로 안내해요')}
      />
    );
  } else if (phase === 'drive') {
    screen = <Drive view={view} speaking={speaking} />;
  } else if (phase === 'fuel') {
    screen = (
      <>
        <Drive view={view} speaking={speaking} mode="fuel" />
        <FuelPopup
          refuel={view.refuel}
          clock={view.clock}
          onSave={() => sim.finishFuel(true)}
          onLater={() => sim.finishFuel(false)}
        />
      </>
    );
  } else {
    screen = <Arrival safeCount={view.safeCount} total={ZONES.length} onRestart={sim.stop} />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar hidden />
        {/* 시안(2000x750) 그대로 그린 뒤 화면 크기에 맞춰 축소/확대 */}
        <View
          style={abs((width - STAGE_W) / 2, (height - STAGE_H) / 2, STAGE_W, STAGE_H, {
            transform: [{ scale }],
            overflow: 'hidden',
            backgroundColor: C.bg,
          })}
        >
          {screen}
          {(phase === 'briefing' || phase === 'drive' || phase === 'fuel') && (
            <Pressable
              onPress={sim.stop}
              style={abs(1830, 8, 150, 40, { borderRadius: 20, backgroundColor: 'rgba(11,14,19,0.6)', alignItems: 'center', justifyContent: 'center' })}
            >
              <T style={{ fontSize: 19, color: C.sub }}>■ 시뮬레이션 종료</T>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}
