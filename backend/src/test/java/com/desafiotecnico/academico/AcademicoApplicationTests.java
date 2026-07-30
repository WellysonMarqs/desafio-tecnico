package com.desafiotecnico.academico;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AcademicoApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void deveCriarCursoViaApi() throws Exception {
        String payload = objectMapper.writeValueAsString(new CursoPayload("Analise e Desenvolvimento de Sistemas", "ADS"));

        mockMvc.perform(post("/api/cursos")
                        .header("X-Correlation-Id", "test-correlation-id")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.codigo").value("ADS"));
    }

    @Test
    void deveRetornarErroPadronizadoQuandoAlunoForInvalido() throws Exception {
        String payload = objectMapper.writeValueAsString(new AlunoPayload("", "email-invalido", ""));

        mockMvc.perform(post("/api/alunos")
                        .header("X-Correlation-Id", "corr-validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDACAO_INVALIDA"))
                .andExpect(jsonPath("$.correlationId").value("corr-validation"));
    }

    @Test
    void deveListarCursosCriados() throws Exception {
        String payload = objectMapper.writeValueAsString(new CursoPayload("Sistemas de Informacao", "SI"));

        mockMvc.perform(post("/api/cursos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)).andExpect(status().isCreated());

        mockMvc.perform(get("/api/cursos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").exists());
    }

    private record CursoPayload(String nome, String codigo) {
    }

    private record AlunoPayload(String nome, String email, String matricula) {
    }
}
