package saygil.engine

/**
 * 사고다발구간의 사고유형.
 * 도로교통공단 사고다발지역 데이터의 "사고유형구분"을 앱에서 쓰기 좋게 묶은 것입니다.
 * action = 운전자가 지금 해야 할 행동 1개 (안내 문장의 마지막에 들어갑니다)
 */
enum class AccidentType(val label: String, val action: String) {
    CHILD_PEDESTRIAN("어린이 횡단보도 사고", "우회전 전에 꼭 멈추세요"),
    ELDERLY_PEDESTRIAN("어르신 무단횡단 사고", "주차된 차 사이를 살피세요"),
    ICING("결빙 사고", "속도를 줄여주세요"),
    REAR_END("앞차 추돌 사고", "차간거리를 더 띄우세요"),
    SIGNAL_VIOLATION("노란불 측면 충돌 사고", "노란불이면 멈추세요"),
}

/** 도로 모양. 안내 문장을 더 구체적으로 만들 때 씁니다. */
enum class RoadShape(val label: String) {
    INTERSECTION("교차로"), BRIDGE("다리"), TUNNEL("터널"), STRAIGHT("도로")
}

/**
 * 사고다발구간 1곳 (서버가 공공데이터를 가공해 차량 앱에 내려주는 "안내 카드")
 * @param peakHours 사고가 주로 난 시간대(시 단위). null이면 시간 조건 없음
 */
data class AccidentZone(
    val id: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val type: AccidentType,
    val roadShape: RoadShape,
    val accidentCount: Int,
    val peakHours: List<IntRange>? = null,
)

/** 지금 차량 상황 (Pleos Vehicle SDK / 위치 / 날씨에서 받아오는 값) */
data class DrivingContext(
    val hour: Int,                 // 현재 시각(0~23)
    val temperatureC: Double,      // 바깥 기온
    val speedKmh: Int,             // 현재 차속
    val distanceToZoneM: Int,      // 구간까지 남은 거리
    val familiarRoute: Boolean,    // 매일 다니는 길인지(출퇴근 등)
)

/** 안내 단계: 1km 전 배너 → 300m 전 화면 분할 */
enum class Stage { BANNER, SPLIT }

data class Guidance(
    val stage: Stage,
    val message: String,
    val strong: Boolean,           // 빠르게 접근 중이면 한 번 더 강하게
)
