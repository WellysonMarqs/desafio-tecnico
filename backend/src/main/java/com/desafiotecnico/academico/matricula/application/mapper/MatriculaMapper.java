package com.desafiotecnico.academico.matricula.application.mapper;

import com.desafiotecnico.academico.matricula.application.dto.MatriculaResponse;
import com.desafiotecnico.academico.matricula.domain.Matricula;
import org.springframework.stereotype.Component;

@Component
public class MatriculaMapper {

    public MatriculaResponse toResponse(Matricula matricula) {
        return new MatriculaResponse(
                matricula.getId(),
                matricula.getAluno().getId(),
                matricula.getTurma().getId(),
                matricula.getStatus(),
                matricula.getCriadaEm(),
                matricula.getConfirmadaEm(),
                matricula.getCanceladaEm()
        );
    }
}
