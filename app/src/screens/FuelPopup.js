// ④ 주유 직후: 자동 감지 기록 팝업
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { C } from '../theme.js';
import { abs, T, Btn, IconBox, Icon } from '../ui.js';
import { unitPrice } from '../engine/fuelDetector.js';
import { fmtClock, MONTH_STR, ODOMETER } from '../scenario.js';
import { say } from '../speech.js';

const fmt = (n) => (n ? Number(n).toLocaleString('ko-KR') : '');
const DEMO_AMOUNT = 62000;

const inputBase = (x, w, border) =>
  abs(x, 361, w, 72, {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: border,
    backgroundColor: '#11151D',
    paddingHorizontal: 22,
    color: C.text,
    fontSize: 34,
    fontWeight: '800',
    includeFontPadding: false,
    paddingVertical: 0,
  });

export default function FuelPopup({ refuel, clock, speed = 1, onSave, onLater }) {
  const [liters, setLiters] = useState(String(refuel.liters));
  const [amount, setAmount] = useState('');
  const touched = useRef(false);
  const timers = useRef([]);
  const touch = () => {
    touched.current = true;
    timers.current.forEach(clearTimeout);
  };

  // 시뮬레이션: 사용자가 만지지 않으면 금액을 말로 입력한 것처럼 채우고 자동 저장
  useEffect(() => {
    const t1 = setTimeout(() => {
      if (touched.current) return;
      setAmount(String(DEMO_AMOUNT));
      say('삼십팔 리터, 6만 2천 원.');
    }, 3000 / speed);
    const t2 = setTimeout(() => {
      if (!touched.current) onSave();
    }, 5000 / speed);
    timers.current = [t1, t2];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const l = parseFloat(liters) || 0;
  const a = parseInt(amount, 10) || 0;
  const unit = l > 0 && a > 0 ? `${fmt(unitPrice(a, l))}원/L` : '-';

  const info = [
    ['주유소 (자동)', '○○주유소 ○○점', 503, 320],
    ['날짜 (자동)', `${MONTH_STR} ${fmtClock(clock)}`, 839, 322],
    ['주행거리 (자동)', `${fmt(ODOMETER)} km`, 1177, 320],
  ];

  return (
    <View style={abs(0, 0, 2000, 750)}>
      <View style={abs(-400, -400, 2800, 1550, { backgroundColor: 'rgba(11,14,19,0.72)' })} />
      <View style={abs(463, 107, 1074, 536, { backgroundColor: '#1F2631', borderRadius: 34 })}>
        <IconBox x={40} y={33} size={54} name="fuel" bg="#1B2E4D" color={C.blue} radius={12} pad={0.2} />
        <T style={abs(110, 36, 700, 50, { fontSize: 36, fontWeight: '900' })}>주유하셨네요! 기록해 둘까요?</T>
        <T style={abs(834, 44, 200, 34, { fontSize: 22, color: C.sub, textAlign: 'right' })}>세이길</T>

        {info.map(([label, value, x, w]) => (
          <View key={label} style={abs(x - 463, 107, w, 92, { backgroundColor: '#161B23', borderRadius: 14 })}>
            <T style={abs(20, 14, w - 30, 26, { fontSize: 20, color: C.sub })}>{label}</T>
            <T numberOfLines={1} style={abs(20, 44, w - 30, 36, { fontSize: 27, fontWeight: '800' })}>{value}</T>
          </View>
        ))}

        <T style={abs(40, 221, 400, 28, { fontSize: 21, color: C.sub })}>주유량 (L) · 연료 게이지로 추정</T>
        <T style={abs(376, 221, 300, 28, { fontSize: 21, color: C.sub })}>금액 (원)</T>

        <TextInput
          value={liters}
          onChangeText={(t) => { touch(); setLiters(t.replace(/[^0-9.]/g, '')); }}
          onFocus={touch}
          keyboardType="decimal-pad"
          style={{ ...inputBase(40, 320, '#3A4352'), top: 254 }}
        />
        <TextInput
          value={amount ? fmt(amount) : ''}
          onChangeText={(t) => { touch(); setAmount(t.replace(/[^0-9]/g, '')); }}
          onFocus={touch}
          keyboardType="number-pad"
          placeholder="예: 62,000"
          placeholderTextColor="#5B6573"
          style={{ ...inputBase(376, 322, C.blue), top: 254 }}
        />
        <View style={abs(714, 254, 320, 72, { backgroundColor: '#161B23', borderRadius: 16 })}>
          <T style={abs(20, 10, 290, 24, { fontSize: 19, color: C.sub })}>리터당 단가 (자동 계산)</T>
          <T style={abs(20, 36, 290, 32, { fontSize: 27, fontWeight: '800' })}>{unit}</T>
        </View>

        <Pressable
          onPress={() => {
            touch();
            setAmount(String(DEMO_AMOUNT));
            say('삼십팔 리터, 6만 2천 원. 맞으면 저장을 눌러 주세요.');
          }}
          style={abs(40, 346, 64, 64, { backgroundColor: '#1B2E4D', borderRadius: 14, alignItems: 'center', justifyContent: 'center' })}
        >
          <Icon name="mic" size={34} color={C.blue} />
        </Pressable>
        <T style={abs(120, 364, 920, 30, { fontSize: 22, color: C.sub })}>
          "38리터, 6만 2천 원"이라고 말해도 저장돼요. 주유량은 영수증 보고 고칠 수 있어요.
        </T>

        <Btn x={40} y={431} w={333} h={72} label="나중에" size={26} onPress={() => { touch(); onLater(); }} />
        <Btn x={388} y={431} w={646} h={72} primary label="저장" size={28} onPress={() => { touch(); onSave(); }} />
      </View>
    </View>
  );
}
