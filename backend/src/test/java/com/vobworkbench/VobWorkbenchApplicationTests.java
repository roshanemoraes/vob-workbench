package com.vobworkbench;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "vob.dev-seed.enabled=false")
class VobWorkbenchApplicationTests {

    @Test
    void contextLoads() {
    }
}
