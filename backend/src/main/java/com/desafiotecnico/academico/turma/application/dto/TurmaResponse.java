package com.desafiotecnico.academico.turma.application.dto;

import com.desafiotecnico.academico.turma.domain.TurmaStatus;

public record TurmaResponse(
        Long id,
        String codigo,
        Long disciplinaId,
        Integer capacidade,
        Integer vagasDisponiveis,
        TurmaStatus status
) {
}
