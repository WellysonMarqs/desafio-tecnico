package com.desafiotecnico.academico.turma.application.mapper;

import com.desafiotecnico.academico.turma.application.dto.TurmaResponse;
import com.desafiotecnico.academico.turma.domain.Turma;
import org.springframework.stereotype.Component;

@Component
public class TurmaMapper {

    public TurmaResponse toResponse(Turma turma) {
        return new TurmaResponse(
                turma.getId(),
                turma.getCodigo(),
                turma.getDisciplina().getId(),
                turma.getCapacidade(),
                turma.getVagasDisponiveis(),
                turma.getStatus()
        );
    }
}
