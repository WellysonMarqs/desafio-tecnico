package com.desafiotecnico.academico.aluno.application.mapper;

import com.desafiotecnico.academico.aluno.application.dto.AlunoRequest;
import com.desafiotecnico.academico.aluno.application.dto.AlunoResponse;
import com.desafiotecnico.academico.aluno.domain.Aluno;
import org.springframework.stereotype.Component;

@Component
public class AlunoMapper {

    public Aluno toEntity(AlunoRequest request) {
        Aluno aluno = new Aluno();
        copy(request, aluno);
        return aluno;
    }

    public void copy(AlunoRequest request, Aluno aluno) {
        aluno.setNome(request.nome());
        aluno.setEmail(request.email());
        aluno.setMatricula(request.matricula());
    }

    public AlunoResponse toResponse(Aluno aluno) {
        return new AlunoResponse(
                aluno.getId(),
                aluno.getNome(),
                aluno.getEmail(),
                aluno.getMatricula(),
                aluno.getCriadoEm()
        );
    }
}
