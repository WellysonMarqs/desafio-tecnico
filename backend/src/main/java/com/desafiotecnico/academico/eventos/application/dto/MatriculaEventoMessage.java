package com.desafiotecnico.academico.eventos.application.dto;

import com.desafiotecnico.academico.eventos.domain.MatriculaEventoTipo;
import com.desafiotecnico.academico.matricula.domain.MatriculaStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MatriculaEventoMessage(
        UUID eventId,
        String eventType,
        int eventVersion,
        OffsetDateTime occurredAt,
        String correlationId,
        Payload payload
) {

    public static MatriculaEventoMessage of(UUID eventId,
                                            MatriculaEventoTipo eventType,
                                            OffsetDateTime occurredAt,
                                            String correlationId,
                                            Long matriculaId,
                                            Long alunoId,
                                            Long turmaId,
                                            MatriculaStatus status) {
        return new MatriculaEventoMessage(
                eventId,
                eventType.getValorContrato(),
                1,
                occurredAt,
                correlationId,
                new Payload(matriculaId, alunoId, turmaId, status)
        );
    }

    public record Payload(
            Long matriculaId,
            Long alunoId,
            Long turmaId,
            MatriculaStatus status
    ) {
    }
}
