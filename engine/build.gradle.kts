plugins {
    kotlin("jvm") version "2.0.21"
    application
}

repositories { mavenCentral() }

dependencies {
    testImplementation("junit:junit:4.13.2")
}

kotlin { jvmToolchain(21) }

application { mainClass.set("saygil.engine.DemoKt") }

tasks.test {
    useJUnit()
    testLogging { events("passed", "failed") }
}
