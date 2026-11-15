// engine/Model.kt 포팅: 사고유형, 도로모양, 사고다발구간
export const AccidentType = {
  CHILD_PEDESTRIAN: { key: 'CHILD_PEDESTRIAN', label: '어린이 횡단보도 사고', action: '우회전 전에 꼭 멈추세요' },
  ELDERLY_PEDESTRIAN: { key: 'ELDERLY_PEDESTRIAN', label: '어르신 무단횡단 사고', action: '주차된 차 사이를 살피세요' },
  ICING: { key: 'ICING', label: '결빙 사고', action: '속도를 줄여주세요' },
  REAR_END: { key: 'REAR_END', label: '앞차 추돌 사고', action: '차간거리를 더 띄우세요' },
  SIGNAL_VIOLATION: { key: 'SIGNAL_VIOLATION', label: '노란불 측면 충돌 사고', action: '노란불이면 멈추세요' },
};

export const RoadShape = {
  INTERSECTION: { label: '교차로' },
  BRIDGE: { label: '다리' },
  TUNNEL: { label: '터널' },
  STRAIGHT: { label: '도로' },
};

export const Stage = { BANNER: 'BANNER', SPLIT: 'SPLIT' };

/** peakHours: [[시작시, 끝시], ...] (끝 포함). 없으면 null */
export function accidentZone(id, name, lat, lon, type, roadShape, accidentCount, peakHours = null) {
  return { id, name, lat, lon, type, roadShape, accidentCount, peakHours };
}

export function drivingContext(hour, temperatureC, speedKmh, distanceToZoneM, familiarRoute) {
  return { hour, temperatureC, speedKmh, distanceToZoneM, familiarRoute };
}
