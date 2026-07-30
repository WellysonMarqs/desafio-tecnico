package com.desafiotecnico.academico.eventos.application.service;

import com.desafiotecnico.academico.eventos.application.dto.MatriculaEventoMessage;
import com.desafiotecnico.academico.eventos.domain.OutboxEvento;
import com.desafiotecnico.academico.eventos.infrastructure.amqp.MatriculaRabbitPublisher;
import com.desafiotecnico.academico.eventos.infrastructure.persistence.OutboxEventoRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class OutboxEventPublisherService {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventPublisherService.class);

    private final OutboxEventoRepository outboxEventoRepository;
    private final MatriculaRabbitPublisher matriculaRabbitPublisher;
    private final ObjectMapper objectMapper;

    public OutboxEventPublisherService(OutboxEventoRepository outboxEventoRepository,
                                       MatriculaRabbitPublisher matriculaRabbitPublisher,
                                       ObjectMapper objectMapper) {
        this.outboxEventoRepository = outboxEventoRepository;
        this.matriculaRabbitPublisher = matriculaRabbitPublisher;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelayString = "${app.outbox.publisher-delay-ms:1000}")
    @Transactional
    public void publishPendingEvents() {
        publishBatch();
    }

    @Transactional
    public void publishBatch() {
        List<OutboxEvento> pendentes = outboxEventoRepository.findTop20ByPublicadoFalseOrderByCriadoEmAsc();
        for (OutboxEvento evento : pendentes) {
            MatriculaEventoMessage message = deserialize(evento.getPayload());
            matriculaRabbitPublisher.publish(message);
            evento.marcarComoPublicado(OffsetDateTime.now());
            log.info("Evento de matricula publicado", kv("eventId", evento.getId()), kv("eventType", evento.getTipoEvento()), kv("correlationId", evento.getCorrelationId()));
        }
    }

    private MatriculaEventoMessage deserialize(String payload) {
        try {
            return objectMapper.readValue(payload, MatriculaEventoMessage.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Falha ao desserializar evento pendente da outbox.", exception);
        }
    }

    private String kv(String chave, Object valor) {
        return chave + "=" + valor;
    }
}
