// engine/ZoneFinder.kt 포팅
export const LOOKAHEAD_M = 2000.0;
export const HEADING_TOLERANCE_DEG = 45.0;

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

export function zonesAhead(lat, lon, headingDeg, zones) {
  return zones
    .map((zone) => {
      const d = distanceM(lat, lon, zone.lat, zone.lon);
      if (d > LOOKAHEAD_M) return null;
      const diff = angleDiff(headingDeg, bearingDeg(lat, lon, zone.lat, zone.lon));
      return diff > HEADING_TOLERANCE_DEG ? null : { zone, distanceM: Math.round(d) };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceM - b.distanceM);
}

/** 하버사인 거리(m) */
export function distanceM(lat1, lon1, lat2, lon2) {
  const r = 6371000.0;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** 1번 지점에서 2번 지점을 바라보는 방향 (0=북, 90=동) */
export function bearingDeg(lat1, lon1, lat2, lon2) {
  const p1 = rad(lat1), p2 = rad(lat2), dl = rad(lon2 - lon1);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
