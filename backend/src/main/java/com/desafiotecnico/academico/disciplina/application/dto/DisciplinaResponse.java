package com.desafiotecnico.academico.disciplina.application.dto;

public record DisciplinaResponse(
        Long id,
        String nome,
        String codigo,
        Long cursoId
) {
}
