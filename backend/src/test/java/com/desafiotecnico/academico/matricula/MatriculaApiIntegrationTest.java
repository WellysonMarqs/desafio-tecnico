package com.desafiotecnico.academico.matricula;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MatriculaApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void deveCriarConfirmarCancelarEConsultarMatricula() throws Exception {
        long cursoId = criarCurso("Engenharia de Software", "ES" + UUID.randomUUID().toString().substring(0, 5));
        long disciplinaId = criarDisciplina("Concorrencia", "CC" + UUID.randomUUID().toString().substring(0, 5), cursoId);
        long turmaId = criarTurma("TURMA-" + UUID.randomUUID().toString().substring(0, 8), disciplinaId, 2, "ABERTA");
        long alunoId = criarAluno("Aluno Integracao", "aluno." + UUID.randomUUID() + "@mail.com", "MAT" + UUID.randomUUID().toString().substring(0, 8));

        String correlationId = "corr-" + UUID.randomUUID();
        long matriculaId = criarMatricula(alunoId, turmaId, correlationId);

        mockMvc.perform(post("/api/matriculas/{id}/confirmacao", matriculaId)
                        .header("X-Correlation-Id", correlationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMADA"))
                .andExpect(jsonPath("$.confirmadaEm").exists());

        mockMvc.perform(get("/api/turmas/{id}", turmaId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vagasDisponiveis").value(1));

        mockMvc.perform(get("/api/alunos/{alunoId}/matriculas", alunoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(matriculaId));

        mockMvc.perform(get("/api/turmas/{turmaId}/matriculas", turmaId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(matriculaId));

        mockMvc.perform(post("/api/matriculas/{id}/cancelamento", matriculaId)
                        .header("X-Correlation-Id", correlationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADA"))
                .andExpect(jsonPath("$.canceladaEm").exists());

        mockMvc.perform(get("/api/turmas/{id}", turmaId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vagasDisponiveis").value(2));
    }

    @Test
    void deveRetornarConflitoAoDuplicarMatricula() throws Exception {
        long cursoId = criarCurso("Direito", "DIR" + UUID.randomUUID().toString().substring(0, 4));
        long disciplinaId = criarDisciplina("Civil", "CIV" + UUID.randomUUID().toString().substring(0, 4), cursoId);
        long turmaId = criarTurma("T-" + UUID.randomUUID().toString().substring(0, 6), disciplinaId, 1, "ABERTA");
        long alunoId = criarAluno("Aluno Duplicado", "dup." + UUID.randomUUID() + "@mail.com", "DUP" + UUID.randomUUID().toString().substring(0, 6));

        criarMatricula(alunoId, turmaId, "corr-dup-1");

        mockMvc.perform(post("/api/matriculas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MatriculaPayload(alunoId, turmaId))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MATRICULA_DUPLICADA"));
    }

    @Test
    void deveRetornarConflitoAoCriarMatriculaParaTurmaFechada() throws Exception {
        long cursoId = criarCurso("Arquitetura", "ARQ" + UUID.randomUUID().toString().substring(0, 4));
        long disciplinaId = criarDisciplina("Projeto", "PRJ" + UUID.randomUUID().toString().substring(0, 4), cursoId);
        long turmaId = criarTurma("F-" + UUID.randomUUID().toString().substring(0, 6), disciplinaId, 1, "FECHADA");
        long alunoId = criarAluno("Aluno Fechado", "fechado." + UUID.randomUUID() + "@mail.com", "FEC" + UUID.randomUUID().toString().substring(0, 6));

        mockMvc.perform(post("/api/matriculas")
                        .header("X-Correlation-Id", "corr-fechada")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MatriculaPayload(alunoId, turmaId))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TURMA_FECHADA"))
                .andExpect(jsonPath("$.correlationId").value("corr-fechada"));
    }

    private long criarCurso(String nome, String codigo) throws Exception {
        String response = mockMvc.perform(post("/api/cursos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CursoPayload(nome, codigo))))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return readId(response);
    }

    private long criarDisciplina(String nome, String codigo, long cursoId) throws Exception {
        String response = mockMvc.perform(post("/api/disciplinas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new DisciplinaPayload(nome, codigo, cursoId))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return readId(response);
    }

    private long criarTurma(String codigo, long disciplinaId, int capacidade, String status) throws Exception {
        String response = mockMvc.perform(post("/api/turmas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TurmaPayload(codigo, disciplinaId, capacidade, status))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return readId(response);
    }

    private long criarAluno(String nome, String email, String matricula) throws Exception {
        String response = mockMvc.perform(post("/api/alunos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AlunoPayload(nome, email, matricula))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return readId(response);
    }

    private long criarMatricula(long alunoId, long turmaId, String correlationId) throws Exception {
        String response = mockMvc.perform(post("/api/matriculas")
                        .header("X-Correlation-Id", correlationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MatriculaPayload(alunoId, turmaId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return readId(response);
    }

    private long readId(String content) throws Exception {
        JsonNode jsonNode = objectMapper.readTree(content);
        return jsonNode.get("id").asLong();
    }

    private record CursoPayload(String nome, String codigo) {
    }

    private record DisciplinaPayload(String nome, String codigo, long cursoId) {
    }

    private record TurmaPayload(String codigo, long disciplinaId, int capacidade, String status) {
    }

    private record AlunoPayload(String nome, String email, String matricula) {
    }

    private record MatriculaPayload(long alunoId, long turmaId) {
    }
}
