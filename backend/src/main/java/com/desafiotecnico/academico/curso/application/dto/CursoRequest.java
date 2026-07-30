package com.desafiotecnico.academico.curso.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CursoRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Size(max = 30) String codigo
) {
}
