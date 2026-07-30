package com.desafiotecnico.academico.eventos;

import com.desafiotecnico.academico.auditoria.application.service.AuditoriaMatriculaService;
import com.desafiotecnico.academico.auditoria.infrastructure.repository.AuditoriaEventoMatriculaRepository;
import com.desafiotecnico.academico.eventos.application.dto.MatriculaEventoMessage;
import com.desafiotecnico.academico.eventos.application.service.OutboxEventPublisherService;
import com.desafiotecnico.academico.eventos.infrastructure.amqp.MatriculaAuditoriaConsumer;
import com.desafiotecnico.academico.eventos.infrastructure.persistence.OutboxEventoRepository;
import com.desafiotecnico.academico.matricula.domain.MatriculaStatus;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MatriculaEventosIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OutboxEventoRepository outboxEventoRepository;

    @Autowired
    private OutboxEventPublisherService outboxEventPublisherService;

    @Autowired
    private AuditoriaEventoMatriculaRepository auditoriaRepository;

    @Autowired
    private AuditoriaMatriculaService auditoriaMatriculaService;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @Test
    void devePersistirOutboxEPublicarEventoDeMatriculaCriada() throws Exception {
        long cursoId = criarCurso("Eventos", "EVT" + sufixo());
        long disciplinaId = criarDisciplina("Mensageria", "MSG" + sufixo(), cursoId);
        long turmaId = criarTurma("T-EVT-" + sufixo(), disciplinaId, 2, "ABERTA");
        long alunoId = criarAluno("Aluno Evento", "evento." + UUID.randomUUID() + "@mail.com", "MEV" + sufixo());
        String correlationId = "corr-evento-" + UUID.randomUUID();

        mockMvc.perform(post("/api/matriculas")
                        .header("X-Correlation-Id", correlationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"alunoId":%d,"turmaId":%d}
                                """.formatted(alunoId, turmaId)))
                .andExpect(status().isCreated());

        assertThat(outboxEventoRepository.findTop20ByPublicadoFalseOrderByCriadoEmAsc())
                .hasSize(1)
                .first()
                .satisfies(evento -> {
                    assertThat(evento.getTipoEvento()).isEqualTo("MatriculaCriada");
                    assertThat(evento.getCorrelationId()).isEqualTo(correlationId);
                });

        outboxEventPublisherService.publishBatch();

        assertThat(outboxEventoRepository.findTop20ByPublicadoFalseOrderByCriadoEmAsc()).isEmpty();
        verify(rabbitTemplate, atLeastOnce()).convertAndSend(any(String.class), any(String.class), any(), any(MessagePostProcessor.class));
    }

    @Test
    void deveConsumirEventoComIdempotenciaBasica() {
        UUID eventId = UUID.randomUUID();
        MatriculaEventoMessage mensagem = new MatriculaEventoMessage(
                eventId,
                "MatriculaConfirmada",
                1,
                OffsetDateTime.now(),
                "corr-auditoria",
                new MatriculaEventoMessage.Payload(10L, 20L, 30L, MatriculaStatus.CONFIRMADA)
        );

        MatriculaAuditoriaConsumer consumer = new MatriculaAuditoriaConsumer(auditoriaMatriculaService);
        consumer.handle(mensagem);
        consumer.handle(mensagem);

        assertThat(auditoriaRepository.findByEventId(eventId)).isPresent();
        assertThat(auditoriaRepository.count()).isEqualTo(1);
    }

    private long criarCurso(String nome, String codigo) throws Exception {
        String response = mockMvc.perform(post("/api/cursos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"%s","codigo":"%s"}
                                """.formatted(nome, codigo)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return extrairId(response);
    }

    private long criarDisciplina(String nome, String codigo, long cursoId) throws Exception {
        String response = mockMvc.perform(post("/api/disciplinas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"%s","codigo":"%s","cursoId":%d}
                                """.formatted(nome, codigo, cursoId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return extrairId(response);
    }

    private long criarTurma(String codigo, long disciplinaId, int capacidade, String statusTurma) throws Exception {
        String response = mockMvc.perform(post("/api/turmas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"codigo":"%s","disciplinaId":%d,"capacidade":%d,"status":"%s"}
                                """.formatted(codigo, disciplinaId, capacidade, statusTurma)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return extrairId(response);
    }

    private long criarAluno(String nome, String email, String matricula) throws Exception {
        String response = mockMvc.perform(post("/api/alunos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"%s","email":"%s","matricula":"%s"}
                                """.formatted(nome, email, matricula)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return extrairId(response);
    }

    private long extrairId(String json) {
        String valor = json.replaceAll(".*\\\"id\\\":(\\d+).*", "$1");
        return Long.parseLong(valor);
    }

    private String sufixo() {
        return UUID.randomUUID().toString().substring(0, 6);
    }
}
