package com.desafiotecnico.academico.matricula.application.dto;

import com.desafiotecnico.academico.matricula.domain.MatriculaStatus;

import java.time.OffsetDateTime;

public record MatriculaResponse(
        Long id,
        Long alunoId,
        Long turmaId,
        MatriculaStatus status,
        OffsetDateTime criadaEm,
        OffsetDateTime confirmadaEm,
        OffsetDateTime canceladaEm
) {
}
