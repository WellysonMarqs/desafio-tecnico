package com.desafiotecnico.academico.curso.application.mapper;

import com.desafiotecnico.academico.curso.application.dto.CursoRequest;
import com.desafiotecnico.academico.curso.application.dto.CursoResponse;
import com.desafiotecnico.academico.curso.domain.Curso;
import org.springframework.stereotype.Component;

@Component
public class CursoMapper {

    public Curso toEntity(CursoRequest request) {
        Curso curso = new Curso();
        copy(request, curso);
        return curso;
    }

    public void copy(CursoRequest request, Curso curso) {
        curso.setNome(request.nome());
        curso.setCodigo(request.codigo());
    }

    public CursoResponse toResponse(Curso curso) {
        return new CursoResponse(curso.getId(), curso.getNome(), curso.getCodigo());
    }
}
