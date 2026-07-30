package com.desafiotecnico.academico.disciplina.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DisciplinaRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Size(max = 30) String codigo,
        @NotNull Long cursoId
) {
}
