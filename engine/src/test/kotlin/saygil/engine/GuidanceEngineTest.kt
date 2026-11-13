package saygil.engine

import org.junit.Assert.*
import org.junit.Test

class GuidanceEngineTest {

    private val bridge = AccidentZone("Z1", "○○교", 37.5, 127.0, AccidentType.ICING, RoadShape.BRIDGE, 9)
    private val school = AccidentZone(
        "Z2", "○○초 사거리", 37.51, 127.0, AccidentType.CHILD_PEDESTRIAN, RoadShape.INTERSECTION, 12,
        peakHours = listOf(7..9, 13..17),
    )

    private fun ctx(hour: Int = 8, temp: Double = -3.0, speed: Int = 70, dist: Int = 1000, familiar: Boolean = false) =
        DrivingContext(hour, temp, speed, dist, familiar)

    @Test fun `1km보다 멀면 안내하지 않는다`() {
        assertNull(GuidanceEngine.decide(bridge, ctx(dist = 1500)))
    }

    @Test fun `추운 날 결빙 구간은 내 속도를 넣어 구체적으로 안내한다`() {
        val g = GuidanceEngine.decide(bridge, ctx(speed = 70, dist = 1000))!!
        assertEquals(Stage.BANNER, g.stage)
        assertTrue(g.strong)
        assertTrue("결빙이 잘 생기는" in g.message)
        assertTrue("70km에서 40km로" in g.message)
    }

    @Test fun `따뜻한 날에는 결빙 안내를 하지 않는다`() {
        assertNull(GuidanceEngine.decide(bridge, ctx(temp = 25.0)))
    }

    @Test fun `어린이 사고 구간은 사고가 주로 난 시간에만 안내한다`() {
        GuidanceEngine.decide(school, ctx(hour = 15, dist = 300))!!
        assertNull(GuidanceEngine.decide(school, ctx(hour = 22, dist = 300)))
    }

    @Test fun `300m 안에서는 화면 분할 단계가 되고 행동을 알려준다`() {
        val g = GuidanceEngine.decide(school, ctx(hour = 15, speed = 40, dist = 300))!!
        assertEquals(Stage.SPLIT, g.stage)
        assertTrue("어린이 횡단보도 사고가 많았어요" in g.message)
        assertTrue("우회전 전에 꼭 멈추세요" in g.message)
    }

    @Test fun `매일 다니는 길은 1km 전 안내를 생략하고 300m 전 짧게 한 번만 한다`() {
        assertNull(GuidanceEngine.decide(school, ctx(hour = 8, dist = 900, familiar = true)))
        val g = GuidanceEngine.decide(school, ctx(hour = 8, dist = 300, familiar = true))!!
        assertEquals("어린이 주의, 우회전 전에 꼭 멈추세요", g.message)
    }

    @Test fun `이미 천천히 가면 강하게 안내하지 않는다`() {
        val g = GuidanceEngine.decide(bridge, ctx(speed = 35))!!
        assertFalse(g.strong)
    }
}
