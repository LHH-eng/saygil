import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C, STAGE_W, STAGE_H } from './src/theme.js';
import { useSimulation } from './src/useSimulation.js';
import { abs, BleedCtx } from './src/ui.js';
import { ZONES } from './src/scenario.js';
import Home from './src/screens/Home.js';
import Briefing from './src/screens/Briefing.js';
import Drive from './src/screens/Drive.js';
import FuelPopup from './src/screens/FuelPopup.js';
import Arrival from './src/screens/Arrival.js';
import Menu from './src/screens/Menu.js';

export default function App() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / STAGE_W, height / STAGE_H);
  const bleed = { bx: Math.ceil(Math.max(0, (width / scale - STAGE_W) / 2)) + 2, by: Math.ceil(Math.max(0, (height / scale - STAGE_H) / 2)) + 2 };
  const sim = useSimulation();
  const [note, setNote] = useState(null);
  const { phase, view, voice } = sim;

  let screen = null;
  if (phase === 'home') {
    screen = <Home onStart={() => { setNote(null); sim.start(); }} onPick={(stage) => { setNote(null); sim.jump(stage); }} />;
  } else if (phase === 'briefing') {
    screen = (
      <Briefing
        voice={voice}
        note={note}
        onStart={sim.startDrive}
        onAlt={() => setNote('데모에서는 기본 경로로 안내해요')}
      />
    );
  } else if (phase === 'drive') {
    screen = <Drive view={view} voice={voice} />;
  } else if (phase === 'fuel') {
    screen = (
      <>
        <Drive view={view} voice={voice} mode="fuel" />
        <FuelPopup
          refuel={view.refuel}
          clock={view.clock}
          speed={sim.mul}
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
      <BleedCtx.Provider value={bleed}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar hidden />
        {/* 시안(2000x750) 그대로 그린 뒤 화면 크기에 맞춰 축소/확대 */}
        <View
          style={abs((width - STAGE_W) / 2, (height - STAGE_H) / 2, STAGE_W, STAGE_H, {
            transform: [{ scale }],
            backgroundColor: C.bg,
          })}
        >
          {screen}
          {phase !== 'home' && <Menu mul={sim.mul} onSpeed={sim.setSpeed} onJump={sim.jump} onStop={sim.stop} />}
        </View>
      </View>
      </BleedCtx.Provider>
    </SafeAreaProvider>
  );
}
