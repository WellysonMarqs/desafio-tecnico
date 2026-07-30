package com.desafiotecnico.academico.observability;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ObservabilitySmokeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void deveResponderHealthCheck() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void devePropagarCorrelationIdEmResposta() throws Exception {
        mockMvc.perform(get("/api/cursos").header("X-Correlation-Id", "corr-observability"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", "corr-observability"));
    }

    @Test
    void deveExporMetricasBasicas() throws Exception {
        mockMvc.perform(get("/actuator/metrics/http.server.requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("http.server.requests"));
    }
}
