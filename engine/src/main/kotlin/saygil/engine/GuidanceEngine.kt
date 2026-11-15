package saygil.engine

/**
 * 세이길 안내 엔진
 * 사고다발구간 + 지금 상황을 보고 "안내할지 말지"와 "무슨 말을 할지"를 정합니다.
 *
 * 안내 문장 공식: [어디] + [어떤 사고] + [지금 할 행동 1개]
 */
object GuidanceEngine {

    const val BANNER_DISTANCE_M = 1000
    const val SPLIT_DISTANCE_M = 300
    const val ICING_MAX_TEMP_C = 3.0
    const val ICING_SAFE_SPEED = 40

    fun decide(zone: AccidentZone, ctx: DrivingContext): Guidance? {
        // 1) 거리: 1km보다 멀면 아직 안내하지 않음
        val stage = when {
            ctx.distanceToZoneM <= SPLIT_DISTANCE_M -> Stage.SPLIT
            ctx.distanceToZoneM <= BANNER_DISTANCE_M -> Stage.BANNER
            else -> return null
        }
        // 2) 상황이 맞을 때만: 결빙은 추운 날만, 시간대가 있는 사고는 그 시간에만
        if (!isRelevantNow(zone, ctx)) return null

        // 3) 매일 다니는 길은 300m 전 짧게 한 번만 (알림 피로 줄이기)
        if (ctx.familiarRoute) {
            if (stage != Stage.SPLIT) return null
            return Guidance(stage, "${shortLabel(zone.type)} 주의, ${zone.type.action}", strong = false)
        }

        val strong = isApproachingFast(zone, ctx)
        return Guidance(stage, fullMessage(zone, ctx, stage), strong)
    }

    fun isRelevantNow(zone: AccidentZone, ctx: DrivingContext): Boolean {
        if (zone.type == AccidentType.ICING && ctx.temperatureC > ICING_MAX_TEMP_C) return false
        val peaks = zone.peakHours ?: return true
        return peaks.any { ctx.hour in it }
    }

    private fun isApproachingFast(zone: AccidentZone, ctx: DrivingContext): Boolean = when (zone.type) {
        AccidentType.ICING -> ctx.speedKmh > ICING_SAFE_SPEED
        AccidentType.CHILD_PEDESTRIAN, AccidentType.ELDERLY_PEDESTRIAN -> ctx.speedKmh > 30
        else -> ctx.speedKmh > 60
    }

    /**
     * 안내 문장: [장소] + [사고 이유] + [행동]. "사고다발구간"이라는 말은 쓰지 않습니다.
     * 예) 곧 ○○초 사거리예요. 어린이 횡단보도 사고가 많았던 곳이에요. 우회전 전에 꼭 멈추세요.
     */
    private fun fullMessage(zone: AccidentZone, ctx: DrivingContext, stage: Stage): String {
        val where = if (stage == Stage.SPLIT) "곧 ${zone.name}${copula(zone.name)}." else "${roundDistance(ctx.distanceToZoneM)} 앞 ${zone.name}${copula(zone.name)}."
        val what = when (zone.type) {
            AccidentType.ICING -> "결빙이 잘 생기는 ${zone.roadShape.label}${copula(zone.roadShape.label)}."
            else -> "${zone.type.label}가 많았던 곳이에요."
        }
        val act = when (zone.type) {
            AccidentType.ICING ->
                if (ctx.speedKmh > ICING_SAFE_SPEED) "지금 ${ctx.speedKmh}km에서 ${ICING_SAFE_SPEED}km로 속도를 줄여주세요."
                else "지금 속도를 유지하고 급제동은 피하세요."
            else -> "${zone.type.action}."
        }
        return "$where $what $act"
    }

    private fun shortLabel(type: AccidentType) = when (type) {
        AccidentType.CHILD_PEDESTRIAN -> "어린이"
        AccidentType.ELDERLY_PEDESTRIAN -> "어르신 보행"
        AccidentType.ICING -> "결빙"
        AccidentType.REAR_END -> "추돌"
        AccidentType.SIGNAL_VIOLATION -> "신호"
    }

    /** 받침이 있으면 "이에요", 없으면 "예요" (○○교예요, ○○시장 앞이에요) */
    internal fun copula(word: String): String {
        val c = word.lastOrNull() ?: return "예요"
        if (c !in '가'..'힣') return "예요"
        return if ((c - '가') % 28 != 0) "이에요" else "예요"
    }

    private fun roundDistance(m: Int) = if (m >= 1000) "${m / 1000}km" else "${(m / 100) * 100}m"
}
