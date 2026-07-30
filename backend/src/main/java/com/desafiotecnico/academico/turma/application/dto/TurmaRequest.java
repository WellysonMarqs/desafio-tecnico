package com.desafiotecnico.academico.turma.application.dto;

import com.desafiotecnico.academico.turma.domain.TurmaStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TurmaRequest(
        @NotBlank @Size(max = 50) String codigo,
        @NotNull Long disciplinaId,
        @NotNull @Min(1) Integer capacidade,
        @NotNull TurmaStatus status
) {
}
