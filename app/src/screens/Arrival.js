// ⑤ 도착, 주차: 안전 통과 결과와 영토
import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Path, Polyline, Rect, Text as SText, Ellipse } from 'react-native-svg';
import { C } from '../theme.js';
import { abs, T, Btn, Logo } from '../ui.js';
import { fmtClock, ROUTE_LEN, clockAt } from '../scenario.js';
import { Pressable as RNPressable } from 'react-native';
import { say } from '../speech.js';

const TODAY = '#5B9BFF';
const MINE = '#3A6FD0';
// kind: today(오늘 얻은 영토) / mine(내 영토) / other(다른 운전자)
const HEX = [
  ['other', '#8E63D0', '478,198 535,177 586,208 580,258 530,273 485,240'],
  ['other', '#C94048', '702,152 750,133 786,165 775,200 735,205'],
  ['other', '#2E9DB8', '252,250 298,234 336,262 322,300 272,310'],
  ['other', '#C94048', '415,320 470,295 528,320 525,362 468,386 425,360'],
  ['today', TODAY, '650,258 700,250 738,277 730,328 680,335 625,320', true],
  ['mine', MINE, '738,277 800,245 862,262 872,312 815,355 735,330'],
  ['today', TODAY, '570,335 622,320 675,340 683,378 650,416 590,418'],
  ['today', TODAY, '665,408 710,370 765,357 798,375 790,410 738,438'],
  ['mine', MINE, '515,440 548,402 585,398 610,430 590,475 540,488'],
  ['other', '#D9A52E', '895,345 935,302 965,300 998,345 965,392 920,390'],
  ['other', '#C8702F', '308,500 318,470 375,458 410,490 400,525 350,542'],
  ['other', '#35B38A', '790,455 830,415 870,415 897,450 870,495 820,505'],
  ['other', '#8E63D0', '1027,470 1070,432 1105,462 1090,500 1050,512'],
];

function Stat({ x, label, value, color }) {
  return (
    <View style={abs(x, 98, 330, 120, { backgroundColor: C.card, borderRadius: 20 })}>
      <T style={abs(22, 18, 290, 26, { fontSize: 19, color: C.sub })}>{label}</T>
      <T style={abs(22, 50, 290, 60, { fontSize: 50, fontWeight: '900', color })}>{value}</T>
    </View>
  );
}

export default function Arrival({ safeCount, total, onRestart }) {
  const [mine, setMine] = useState(true);
  const [sent, setSent] = useState(false);
  const gained = safeCount >= total ? 3 : safeCount;

  return (
    <View style={abs(0, 0, 2000, 750, { backgroundColor: C.bg })}>
      <Svg width={1250} height={750} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Rect x={0} y={0} width={1250} height={750} fill={C.map} />
        <Path d="M0 565 C 300 545, 700 575, 1250 545" stroke="#1E2A3E" strokeWidth={30} fill="none" />
        <Path d="M0 200 L1250 170 M0 380 L1250 375 M0 650 L1250 630 M200 0 L260 750 M620 0 L600 750 M1080 0 L1070 750" stroke={C.road} strokeWidth={5} fill="none" />
        <Path d="M160 0 C 380 260, 560 380, 820 750 M1000 0 C 900 300, 700 420, 480 750" stroke={C.road} strokeWidth={4} fill="none" />
        <Ellipse cx={600} cy={380} rx={565} ry={300} stroke="#434C5B" strokeWidth={2} strokeDasharray="10,8" fill="none" />
        {HEX.map(([kind, color, pts, outline], i) => (
          <Polygon
            key={i}
            points={pts}
            fill={color}
            opacity={mine && kind === 'other' ? 0.18 : 1}
            stroke={outline ? '#FFFFFF' : 'none'}
            strokeWidth={outline ? 4 : 0}
          />
        ))}
        <Polyline points="598,750 596,520 590,440 660,340 740,270 872,150" fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth={4} strokeDasharray="10,9" />
        <SText x={190} y={124} fill="#7C8694" fontSize={21}>○○동</SText>
        <SText x={1000} y={248} fill="#7C8694" fontSize={21}>○○동</SText>
        <SText x={200} y={586} fill="#7C8694" fontSize={21}>○○천</SText>
        <SText x={900} y={599} fill="#7C8694" fontSize={21}>○○IC</SText>
        <SText x={588} y={362} fill="#FFFFFF" fontSize={26} fontWeight="bold">○○구</SText>
      </Svg>

      {/* 전체 / 내 영토 전환 */}
      <View style={abs(30, 28, 272, 66, { backgroundColor: '#0B0E13', borderRadius: 33 })} />
      <RNPressable onPress={() => setMine(false)} style={abs(38, 36, 128, 50, { borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: !mine ? TODAY : 'transparent' })}>
        <T style={{ fontSize: 24, fontWeight: '800', color: !mine ? '#0B1220' : C.sub }}>전체 영토</T>
      </RNPressable>
      <RNPressable onPress={() => setMine(true)} style={abs(168, 36, 126, 50, { borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: mine ? TODAY : 'transparent' })}>
        <T style={{ fontSize: 24, fontWeight: '800', color: mine ? '#0B1220' : C.sub }}>내 영토</T>
      </RNPressable>

      {/* 범례 */}
      <View style={abs(30, 675, 610, 50, { backgroundColor: 'rgba(11,14,19,0.9)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 })}>
        {[[TODAY, '오늘 얻은 영토'], [MINE, '내 영토'], ['#E5484D', '다른 운전자']].map(([c, t]) => (
          <View key={t} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 22 }}>
            <View style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: c, marginRight: 8 }} />
            <T style={{ fontSize: 20, color: C.sub }}>{t}</T>
          </View>
        ))}
        <T style={{ fontSize: 20, color: C.sub }}>- - 오늘 경로</T>
      </View>

      {/* 오른쪽 리포트 */}
      <View style={abs(1250, 0, 750, 750, { backgroundColor: '#151A22' })}>
        <Logo x={38} y={36} size={46} radius={11} />
        <T style={abs(100, 38, 400, 50, { fontSize: 38, fontWeight: '900' })}>도착했어요</T>
        <T style={abs(480, 48, 235, 30, { fontSize: 20, color: C.sub, textAlign: 'right' })}>{`주차 중 · ${fmtClock(clockAt(ROUTE_LEN))}`}</T>

        <Stat x={37} label="위험 구간 안전 통과" value={`${safeCount} / ${total}`} color={C.teal} />
        <Stat x={383} label="오늘 얻은 영토" value={`+${gained}곳`} color={C.blue} />

        <View style={abs(37, 236, 676, 58, { backgroundColor: C.redBg, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 22 })}>
          <T style={{ fontSize: 21, color: '#F0C9C9' }}>라이벌 '출근왕'이 회사 앞 영토를 노리고 있어요</T>
        </View>

        <View style={abs(37, 313, 676, 66, { backgroundColor: C.card, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 })}>
          <T style={{ fontSize: 22, color: C.sub }}>이번 달 유지비</T>
          <T style={{ fontSize: 27, fontWeight: '900' }}>14만 원 · km당 98원</T>
        </View>

        <View style={abs(37, 397, 676, 318, { backgroundColor: C.tealBg, borderRadius: 22 })}>
          <T style={abs(22, 22, 620, 26, { fontSize: 19, color: '#8FD9BD' })}>땅 주인 혜택 · 회사 앞 영토</T>
          <T style={abs(22, 58, 640, 40, { fontSize: 29, fontWeight: '900' })}>○○카페 아메리카노 1,000원 할인</T>
          <Btn
            x={22}
            y={236}
            w={632}
            h={62}
            primary
            color={C.teal}
            size={25}
            label={sent ? '휴대폰으로 전송했어요' : '쿠폰 받기 (휴대폰으로 전송)'}
            onPress={() => { setSent(true); say('쿠폰을 휴대폰으로 보냈어요.'); }}
          />
        </View>

      </View>
      <Btn x={1790} y={717} w={190} h={30} label="처음으로" size={19} onPress={onRestart} style={{ borderWidth: 0 }} textColor={C.sub} />
    </View>
  );
}
