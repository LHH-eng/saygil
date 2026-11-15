// engine/GuidanceEngine.kt 포팅
import { AccidentType, Stage } from './model.js';

export const BANNER_DISTANCE_M = 1000;
export const SPLIT_DISTANCE_M = 300;
export const ICING_MAX_TEMP_C = 3.0;
export const ICING_SAFE_SPEED = 40;

export function decide(zone, ctx) {
  let stage;
  if (ctx.distanceToZoneM <= SPLIT_DISTANCE_M) stage = Stage.SPLIT;
  else if (ctx.distanceToZoneM <= BANNER_DISTANCE_M) stage = Stage.BANNER;
  else return null;

  if (!isRelevantNow(zone, ctx)) return null;

  if (ctx.familiarRoute) {
    if (stage !== Stage.SPLIT) return null;
    return { stage, message: `${shortLabel(zone.type)} 주의, ${zone.type.action}`, strong: false };
  }
  return { stage, message: fullMessage(zone, ctx, stage), strong: isApproachingFast(zone, ctx) };
}

export function isRelevantNow(zone, ctx) {
  if (zone.type === AccidentType.ICING && ctx.temperatureC > ICING_MAX_TEMP_C) return false;
  if (!zone.peakHours) return true;
  return zone.peakHours.some(([from, to]) => ctx.hour >= from && ctx.hour <= to);
}

function isApproachingFast(zone, ctx) {
  switch (zone.type) {
    case AccidentType.ICING: return ctx.speedKmh > ICING_SAFE_SPEED;
    case AccidentType.CHILD_PEDESTRIAN:
    case AccidentType.ELDERLY_PEDESTRIAN: return ctx.speedKmh > 30;
    default: return ctx.speedKmh > 60;
  }
}

function fullMessage(zone, ctx, stage) {
  const where = stage === Stage.SPLIT
    ? '곧 사고다발구간이에요.'
    : `${roundDistance(ctx.distanceToZoneM)} 앞 ${zone.name}, 사고다발구간이에요.`;
  const what = zone.type === AccidentType.ICING
    ? `이 ${zone.roadShape.label}는 결빙이 잘 생기는 구간이에요.`
    : `여기는 ${zone.type.label}가 많았어요.`;
  let act;
  if (zone.type === AccidentType.ICING) {
    act = ctx.speedKmh > ICING_SAFE_SPEED
      ? `지금 ${ctx.speedKmh}km에서 ${ICING_SAFE_SPEED}km로 속도를 줄여주세요.`
      : '지금 속도를 유지하고 급제동은 피하세요.';
  } else {
    act = `${zone.type.action}.`;
  }
  return `${where} ${what} ${act}`;
}

function shortLabel(type) {
  switch (type) {
    case AccidentType.CHILD_PEDESTRIAN: return '어린이';
    case AccidentType.ELDERLY_PEDESTRIAN: return '어르신 보행';
    case AccidentType.ICING: return '결빙';
    case AccidentType.REAR_END: return '추돌';
    default: return '신호';
  }
}

function roundDistance(m) {
  return m >= 1000 ? `${Math.floor(m / 1000)}km` : `${Math.floor(m / 100) * 100}m`;
}
