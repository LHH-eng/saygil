package saygil.engine

import kotlin.math.*

/**
 * 진행 방향 앞쪽의 사고다발구간 찾기
 * 내비 경로를 받을 수 없을 때(네이버지도, 카카오내비, 휴대폰 연결) 쓰는 방식입니다.
 * 현재 위치에서 반경 2km 안, 진행 방향 ±45도 안에 있는 구간만 고릅니다.
 */
object ZoneFinder {

    const val LOOKAHEAD_M = 2000.0
    const val HEADING_TOLERANCE_DEG = 45.0

    data class Ahead(val zone: AccidentZone, val distanceM: Int)

    fun zonesAhead(lat: Double, lon: Double, headingDeg: Double, zones: List<AccidentZone>): List<Ahead> =
        zones.mapNotNull { z ->
            val d = distanceM(lat, lon, z.lat, z.lon)
            if (d > LOOKAHEAD_M) return@mapNotNull null
            val diff = angleDiff(headingDeg, bearingDeg(lat, lon, z.lat, z.lon))
            if (diff > HEADING_TOLERANCE_DEG) null else Ahead(z, d.roundToInt())
        }.sortedBy { it.distanceM }

    /** 두 좌표 사이 거리(m), 하버사인 공식 */
    fun distanceM(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6_371_000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) + cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2).pow(2)
        return 2 * r * asin(sqrt(a))
    }

    /** 1번 지점에서 2번 지점을 바라보는 방향(0=북, 90=동) */
    fun bearingDeg(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val p1 = Math.toRadians(lat1); val p2 = Math.toRadians(lat2)
        val dl = Math.toRadians(lon2 - lon1)
        val y = sin(dl) * cos(p2)
        val x = cos(p1) * sin(p2) - sin(p1) * cos(p2) * cos(dl)
        return (Math.toDegrees(atan2(y, x)) + 360) % 360
    }

    private fun angleDiff(a: Double, b: Double): Double {
        val d = abs(a - b) % 360
        return if (d > 180) 360 - d else d
    }
}
