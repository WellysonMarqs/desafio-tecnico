package com.desafiotecnico.academico.auditoria.application.service;

import com.desafiotecnico.academico.auditoria.domain.AuditoriaEventoMatricula;
import com.desafiotecnico.academico.auditoria.infrastructure.repository.AuditoriaEventoMatriculaRepository;
import com.desafiotecnico.academico.eventos.application.dto.MatriculaEventoMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class AuditoriaMatriculaService {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaMatriculaService.class);

    private final AuditoriaEventoMatriculaRepository auditoriaRepository;

    public AuditoriaMatriculaService(AuditoriaEventoMatriculaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional
    public void registrarSeNovo(MatriculaEventoMessage message) {
        if (auditoriaRepository.existsByEventId(message.eventId())) {
            log.info("Evento de auditoria ignorado por idempotencia", kv("eventId", message.eventId()), kv("eventType", message.eventType()), kv("correlationId", message.correlationId()));
            return;
        }

        auditoriaRepository.save(AuditoriaEventoMatricula.from(
                message.eventType(),
                message.eventId(),
                message.payload().matriculaId(),
                message.payload().alunoId(),
                message.payload().turmaId(),
                message.payload().status().name(),
                message.correlationId(),
                OffsetDateTime.now()
        ));

        log.info("Evento de matricula auditado", kv("eventId", message.eventId()), kv("eventType", message.eventType()), kv("matriculaId", message.payload().matriculaId()), kv("correlationId", message.correlationId()));
    }

    private String kv(String chave, Object valor) {
        return chave + "=" + valor;
    }
}
