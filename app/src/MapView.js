// 차량 내비 지도(시안의 어두운 도로 지도). 진행 방향이 위쪽(heading-up)이고 차량은 anchor에 고정.
import React, { useContext } from 'react';
import Svg, { Line, Polyline, Circle, Rect, Polygon, G, Text as SText } from 'react-native-svg';
import { C } from './theme.js';
import { ROUTE_PTS } from './scenario.js';
import { BleedCtx } from './ui.js';

export function makeProjector({ vx, vy, heading, k, ax, ay }) {
  const h = (heading * Math.PI) / 180;
  const cos = Math.cos(h), sin = Math.sin(h);
  return (wx, wy) => {
    const dx = wx - vx, dy = wy - vy;
    return [ax + k * (dx * cos - dy * sin), ay - k * (dx * sin + dy * cos)];
  };
}

const GRID = 300;

/**
 * cam: { vx, vy, heading, k, ax, ay }  (월드 m → 화면 px)
 * zones: 원으로 표시할 사고다발구간들 (world 좌표 포함)
 * chips: [{ world:{x,y}, text, dx, dy }] 구간 이름표(출발 전 브리핑)
 */
export default function MapView({ width, height, cam, zones = [], chips = [], showVehicle = true, extra }) {
  const { bx, by } = useContext(BleedCtx);
  const P = makeProjector(cam);
  const { k } = cam;
  const lines = [];
  for (let g = -3000; g <= 6600; g += GRID) {
    const a = P(g, -4000), b = P(g, 8000);
    lines.push(<Line key={`v${g}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.road} strokeWidth={Math.max(6, 62 * k)} />);
    const c = P(-4000, g), d = P(8000, g);
    lines.push(<Line key={`h${g}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} stroke={C.road} strokeWidth={Math.max(6, 62 * k)} />);
  }
  const routePts = ROUTE_PTS.map(([x, y]) => P(x, y).join(',')).join(' ');
  const r = Math.max(30, 150 * k);

  return (
    <Svg width={width + 2 * bx} height={height + 2 * by} style={{ position: 'absolute', left: -bx, top: -by }}>
      <G transform={`translate(${bx},${by})`}>
      <Rect x={-bx} y={-by} width={width + 2 * bx} height={height + 2 * by} fill={C.map} />
      {lines}
      <Polyline points={routePts} fill="none" stroke={C.route} strokeWidth={Math.max(8, 40 * k)} strokeLinejoin="round" strokeLinecap="round" />
      {zones.map((z) => {
        const [x, y] = P(z.world.x, z.world.y);
        return (
          <G key={z.id}>
            <Circle cx={x} cy={y} r={r} fill="rgba(246,183,60,0.28)" stroke={C.amber} strokeWidth={4} />
            {z.type.key === 'CHILD_PEDESTRIAN' && k > 0.5 &&
              [0, 1, 2, 3].map((i) => (
                <Rect key={i} x={x + 8 + i * 17} y={y - r * 0.55} width={10} height={r * 0.9} fill="rgba(255,255,255,0.6)" />
              ))}
          </G>
        );
      })}
      {chips.map((c, i) => {
        const [x, y] = P(c.world.x, c.world.y);
        const w = 14 * c.text.length + 30;
        return (
          <G key={i}>
            <Rect x={x + c.dx} y={y + c.dy} width={w} height={46} rx={10} fill={C.amber} />
            <SText x={x + c.dx + w / 2} y={y + c.dy + 32} fontSize={24} fontWeight="bold" fill="#1A1305" textAnchor="middle">
              {c.text}
            </SText>
          </G>
        );
      })}
      {extra && extra(P)}
      {showVehicle && (
        <Polygon
          points={`${cam.ax},${cam.ay - 38} ${cam.ax + 27},${cam.ay + 30} ${cam.ax},${cam.ay + 16} ${cam.ax - 27},${cam.ay + 30}`}
          fill="#FFFFFF"
          transform={`rotate(0 ${cam.ax} ${cam.ay})`}
        />
      )}
      </G>
    </Svg>
  );
}
