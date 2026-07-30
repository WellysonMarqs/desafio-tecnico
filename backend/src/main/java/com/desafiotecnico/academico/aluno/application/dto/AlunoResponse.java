package com.desafiotecnico.academico.aluno.application.dto;

import java.time.OffsetDateTime;

public record AlunoResponse(
        Long id,
        String nome,
        String email,
        String matricula,
        OffsetDateTime criadoEm
) {
}
