package saygil.engine

/**
 * 시나리오 데모: 겨울 평일 출근길
 * 실행: gradle -q run
 * (구간 이름과 좌표는 예시입니다)
 */
fun main() {
    val bridge = AccidentZone("Z1", "○○교", 37.5000, 127.0000, AccidentType.ICING, RoadShape.BRIDGE, 9)
    val school = AccidentZone(
        "Z2", "○○초 사거리", 37.5100, 127.0000, AccidentType.CHILD_PEDESTRIAN, RoadShape.INTERSECTION, 12,
        peakHours = listOf(7..9, 13..17),
    )

    fun show(title: String, zone: AccidentZone, ctx: DrivingContext) {
        val g = GuidanceEngine.decide(zone, ctx)
        println("[$title]")
        println(if (g == null) "  (안내 안 함)" else "  ${g.stage}${if (g.strong) " · 강하게" else ""}: ${g.message}")
    }

    show("07:52 다리 1km 전, 영하 3도, 70km", bridge, DrivingContext(7, -3.0, 70, 1000, familiarRoute = false))
    show("같은 다리, 7월(기온 25도)", bridge, DrivingContext(7, 25.0, 70, 1000, familiarRoute = false))
    show("08:05 매일 지나는 초등학교 앞 300m", school, DrivingContext(8, -1.0, 30, 300, familiarRoute = true))
    show("15:30 처음 가는 초등학교 앞 300m, 하교 시간", school, DrivingContext(15, 2.0, 40, 300, familiarRoute = false))
    show("22:00 같은 초등학교 앞, 밤", school, DrivingContext(22, 2.0, 40, 300, familiarRoute = false))

    val ahead = ZoneFinder.zonesAhead(37.4950, 127.0000, 0.0, listOf(bridge, school))
    println("[내비 경로 없이 앞쪽 2km 예측 (북쪽으로 주행)]")
    ahead.forEach { println("  ${it.zone.name}: ${it.distanceM}m") }

    val refuel = FuelDetector.detect(
        FuelDetector.Snapshot(18.0, 32418, nearGasStation = true),
        FuelDetector.Snapshot(76.0, 32418, fuelDoorOpened = true, nearGasStation = true),
        tankLiters = 66.0,
    )
    println("[주유 감지]")
    println("  주유량 추정: ${refuel?.liters}L, 6만 2천 원 → 리터당 ${refuel?.let { FuelDetector.unitPrice(62000, it.liters) }}원")
}
