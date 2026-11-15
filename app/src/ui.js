import React, { createContext } from 'react';
import { Text, View, Pressable } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { C } from './theme.js';

/** 화면 비율이 시안보다 길쭉할 때 남는 여백(시안 좌표). 지도가 이만큼만 더 그린다 */
export const BleedCtx = createContext({ bx: 0, by: 0 });

/** 시안(2000x750) 좌표 그대로 배치하기 위한 절대 위치 스타일 */
export const abs = (x, y, w, h, extra) => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra });

export function T({ style, children, ...rest }) {
  return (
    <Text allowFontScaling={false} {...rest} style={[{ color: C.text, includeFontPadding: false }, style]}>
      {children}
    </Text>
  );
}

export function Btn({ x, y, w, h, label, primary, color, textColor, onPress, size = 28, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        abs(x, y, w, h, {
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? color || C.blue : 'transparent',
          borderWidth: primary ? 0 : 2,
          borderColor: C.line,
          opacity: pressed ? 0.75 : 1,
        }),
        style,
      ]}
    >
      <T style={{ fontSize: size, fontWeight: '800', color: textColor || (primary ? '#0B1220' : C.text) }}>{label}</T>
    </Pressable>
  );
}

// ── 아이콘 (24x24 기준) ──
const sw = { strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
export const ICONS = {
  snow: (c) => (
    <G stroke={c} {...sw}>
      <Path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
    </G>
  ),
  walker: (c) => (
    <G stroke={c} {...sw}>
      <Circle cx="12" cy="5" r="2.2" fill={c} />
      <Path d="M12 8.5v6M12 10l-3.6 2.2M12 10l3.6 2.2M12 14.5l-2.6 6M12 14.5l2.6 6" />
    </G>
  ),
  fuel: (c) => (
    <G stroke={c} {...sw}>
      <Path d="M5 21V5.5A2.5 2.5 0 0 1 7.5 3h5A2.5 2.5 0 0 1 15 5.5V21M3.5 21h13M7 8h6M15 9.5h1.8a1.7 1.7 0 0 1 1.7 1.7V16a1.6 1.6 0 0 0 3.2 0V9.5L19 6.5" />
    </G>
  ),
  mic: (c) => (
    <G stroke={c} {...sw}>
      <Rect x="9" y="3" width="6" height="11" rx="3" />
      <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </G>
  ),
  speaker: (c) => (
    <G stroke={c} {...sw}>
      <Path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </G>
  ),
  pin: (c) => (
    <G stroke={c} {...sw}>
      <Path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
      <Circle cx="12" cy="10" r="2.3" />
    </G>
  ),
  alert: (c) => (
    <G stroke={c} {...sw}>
      <Path d="M12 3.5L2.8 19.5h18.4L12 3.5zM12 10v4.5" />
      <Circle cx="12" cy="17" r="0.6" fill={c} />
    </G>
  ),
  check: (c) => (
    <G stroke={c} {...sw}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </G>
  ),
};

export function Icon({ name, size = 32, color = '#fff', style }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {ICONS[name](color)}
    </Svg>
  );
}

export function IconBox({ x, y, size, name, bg, color, radius = 14, pad = 0.2 }) {
  return (
    <View style={abs(x, y, size, size, { backgroundColor: bg, borderRadius: radius, alignItems: 'center', justifyContent: 'center' })}>
      <Icon name={name} size={size * (1 - pad * 2)} color={color} />
    </View>
  );
}

export function Logo({ x, y, size = 50, radius = 12 }) {
  return (
    <View style={abs(x, y, size, size, { backgroundColor: C.blue, borderRadius: radius, alignItems: 'center', justifyContent: 'center' })}>
      <T style={{ fontSize: size * 0.56, fontWeight: '900', color: '#0B1220' }}>S</T>
    </View>
  );
}
