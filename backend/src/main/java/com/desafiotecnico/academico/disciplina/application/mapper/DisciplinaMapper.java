package com.desafiotecnico.academico.disciplina.application.mapper;

import com.desafiotecnico.academico.disciplina.application.dto.DisciplinaResponse;
import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import org.springframework.stereotype.Component;

@Component
public class DisciplinaMapper {

    public DisciplinaResponse toResponse(Disciplina disciplina) {
        return new DisciplinaResponse(
                disciplina.getId(),
                disciplina.getNome(),
                disciplina.getCodigo(),
                disciplina.getCurso().getId()
        );
    }
}
