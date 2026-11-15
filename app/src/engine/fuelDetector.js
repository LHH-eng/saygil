// engine/FuelDetector.kt 포팅
export const MIN_RISE_PERCENT = 5.0;

/** fuelDoorOpened: true/false/null(미지원 차종) */
export function snapshot(fuelPercent, odometerKm, fuelDoorOpened, nearGasStation) {
  return { fuelPercent, odometerKm, fuelDoorOpened, nearGasStation };
}

export function detect(beforeOff, afterOn, tankLiters) {
  const rise = afterOn.fuelPercent - beforeOff.fuelPercent;
  if (rise < MIN_RISE_PERCENT) return null;
  const evidence = afterOn.fuelDoorOpened ?? afterOn.nearGasStation;
  if (!evidence) return null;
  const liters = Math.round(((tankLiters * rise) / 100.0) * 10) / 10.0;
  return { liters, odometerKm: afterOn.odometerKm };
}

export function unitPrice(amountWon, liters) {
  return Math.round(amountWon / liters);
}
