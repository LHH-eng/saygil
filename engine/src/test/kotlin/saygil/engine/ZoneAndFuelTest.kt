package saygil.engine

import org.junit.Assert.*
import org.junit.Test

class ZoneAndFuelTest {

    private val north = AccidentZone("N", "북쪽 구간", 37.5100, 127.0, AccidentType.REAR_END, RoadShape.TUNNEL, 5)
    private val south = AccidentZone("S", "남쪽 구간", 37.4900, 127.0, AccidentType.REAR_END, RoadShape.TUNNEL, 5)
    private val far = AccidentZone("F", "먼 구간", 37.6000, 127.0, AccidentType.REAR_END, RoadShape.TUNNEL, 5)

    @Test fun `진행 방향 앞쪽 2km 안의 구간만 고른다`() {
        val result = ZoneFinder.zonesAhead(37.5000, 127.0, headingDeg = 0.0, zones = listOf(north, south, far))
        assertEquals(listOf("N"), result.map { it.zone.id })
        assertTrue(result[0].distanceM in 1000..1200)
    }

    @Test fun `주유구가 열리고 연료가 늘면 주유로 판단하고 주유량을 추정한다`() {
        val r = FuelDetector.detect(
            FuelDetector.Snapshot(18.0, 32418, nearGasStation = true),
            FuelDetector.Snapshot(76.0, 32418, fuelDoorOpened = true, nearGasStation = true),
            tankLiters = 66.0,
        )!!
        assertEquals(38.3, r.liters, 0.001)
    }

    @Test fun `주유구 정보가 없는 차종은 주유소 위치로 판단한다`() {
        val before = FuelDetector.Snapshot(20.0, 100, nearGasStation = false)
        assertNotNull(FuelDetector.detect(before, FuelDetector.Snapshot(80.0, 100, nearGasStation = true), 50.0))
        assertNull(FuelDetector.detect(before, FuelDetector.Snapshot(80.0, 100, nearGasStation = false), 50.0))
    }

    @Test fun `연료가 조금만 늘면 주유가 아니다`() {
        val before = FuelDetector.Snapshot(50.0, 100, nearGasStation = true)
        assertNull(FuelDetector.detect(before, FuelDetector.Snapshot(52.0, 100, fuelDoorOpened = true, nearGasStation = true), 50.0))
    }

    @Test fun `리터당 단가를 계산한다`() {
        assertEquals(1619, FuelDetector.unitPrice(62000, 38.3))
    }
}
