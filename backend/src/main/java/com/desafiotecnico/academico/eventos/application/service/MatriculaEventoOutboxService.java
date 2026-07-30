package com.desafiotecnico.academico.eventos.application.service;

import com.desafiotecnico.academico.eventos.application.dto.MatriculaEventoMessage;
import com.desafiotecnico.academico.eventos.domain.MatriculaEventoTipo;
import com.desafiotecnico.academico.eventos.domain.OutboxEvento;
import com.desafiotecnico.academico.eventos.infrastructure.persistence.OutboxEventoRepository;
import com.desafiotecnico.academico.matricula.domain.Matricula;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class MatriculaEventoOutboxService {

    private final OutboxEventoRepository outboxEventoRepository;
    private final ObjectMapper objectMapper;

    public MatriculaEventoOutboxService(OutboxEventoRepository outboxEventoRepository,
                                        ObjectMapper objectMapper) {
        this.outboxEventoRepository = outboxEventoRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void registrar(MatriculaEventoTipo tipo, Matricula matricula, String correlationId) {
        UUID eventId = UUID.randomUUID();
        MatriculaEventoMessage message = MatriculaEventoMessage.of(
                eventId,
                tipo,
                OffsetDateTime.now(),
                correlationId,
                matricula.getId(),
                matricula.getAluno().getId(),
                matricula.getTurma().getId(),
                matricula.getStatus()
        );

        outboxEventoRepository.save(OutboxEvento.create(
                eventId,
                message.eventType(),
                "Matricula",
                String.valueOf(matricula.getId()),
                serialize(message),
                correlationId
        ));
    }

    private String serialize(MatriculaEventoMessage message) {
        try {
            return objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Falha ao serializar evento de matricula para a outbox.", exception);
        }
    }
}
