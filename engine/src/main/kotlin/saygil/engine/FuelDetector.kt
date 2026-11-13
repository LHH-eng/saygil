package saygil.engine

import kotlin.math.roundToInt

/**
 * 주유 자동 감지
 * 시동 끌 때와 다시 켤 때의 차량 상태를 비교해 "주유했는지"와 "몇 리터 넣었는지"를 추정합니다.
 * 추정한 주유량은 기록 팝업에 미리 채워 두고, 사용자가 영수증을 보고 고칠 수 있습니다.
 */
object FuelDetector {

    const val MIN_RISE_PERCENT = 5.0   // 연료 게이지가 5% 이상 올라야 주유로 판단

    /** 차량 상태 스냅샷 (Vehicle SDK / AAOS 차량 속성 값) */
    data class Snapshot(
        val fuelPercent: Double,         // 연료량(%)
        val odometerKm: Int,             // 누적 주행거리
        val fuelDoorOpened: Boolean? = null, // 주유구가 열렸었는지 (지원 안 하는 차종은 null)
        val nearGasStation: Boolean,     // 위치가 주유소인지
    )

    data class Refuel(val liters: Double, val odometerKm: Int)

    fun detect(beforeOff: Snapshot, afterOn: Snapshot, tankLiters: Double): Refuel? {
        val rise = afterOn.fuelPercent - beforeOff.fuelPercent
        if (rise < MIN_RISE_PERCENT) return null
        // 주유구 정보를 읽을 수 있으면 그걸로, 못 읽으면 주유소 위치로 판단
        val evidence = afterOn.fuelDoorOpened ?: afterOn.nearGasStation
        if (!evidence) return null
        val liters = (tankLiters * rise / 100.0 * 10).roundToInt() / 10.0
        return Refuel(liters, afterOn.odometerKm)
    }

    /** 리터당 단가(원) */
    fun unitPrice(amountWon: Int, liters: Double): Int = (amountWon / liters).roundToInt()
}
