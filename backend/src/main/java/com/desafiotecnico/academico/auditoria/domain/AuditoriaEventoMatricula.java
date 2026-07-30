package com.desafiotecnico.academico.auditoria.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "auditoria_eventos_matricula")
public class AuditoriaEventoMatricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true)
    private UUID eventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "matricula_id", nullable = false)
    private Long matriculaId;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(name = "turma_id", nullable = false)
    private Long turmaId;

    @Column(name = "status_matricula", nullable = false, length = 20)
    private String statusMatricula;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "recebido_em", nullable = false)
    private OffsetDateTime recebidoEm;

    public static AuditoriaEventoMatricula from(String eventType,
                                                UUID eventId,
                                                Long matriculaId,
                                                Long alunoId,
                                                Long turmaId,
                                                String statusMatricula,
                                                String correlationId,
                                                OffsetDateTime recebidoEm) {
        AuditoriaEventoMatricula auditoria = new AuditoriaEventoMatricula();
        auditoria.eventType = eventType;
        auditoria.eventId = eventId;
        auditoria.matriculaId = matriculaId;
        auditoria.alunoId = alunoId;
        auditoria.turmaId = turmaId;
        auditoria.statusMatricula = statusMatricula;
        auditoria.correlationId = correlationId;
        auditoria.recebidoEm = recebidoEm;
        return auditoria;
    }

    public Long getId() {
        return id;
    }

    public UUID getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public Long getMatriculaId() {
        return matriculaId;
    }
}
