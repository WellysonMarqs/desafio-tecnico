package com.desafiotecnico.academico.matricula.application.dto;

import jakarta.validation.constraints.NotNull;

public record MatriculaRequest(
        @NotNull(message = "alunoId e obrigatorio")
        Long alunoId,
        @NotNull(message = "turmaId e obrigatorio")
        Long turmaId
) {
}
