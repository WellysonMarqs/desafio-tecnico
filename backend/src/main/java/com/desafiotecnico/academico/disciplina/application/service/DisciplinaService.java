package com.desafiotecnico.academico.disciplina.application.service;

import com.desafiotecnico.academico.curso.application.service.CursoService;
import com.desafiotecnico.academico.curso.domain.Curso;
import com.desafiotecnico.academico.disciplina.application.dto.DisciplinaRequest;
import com.desafiotecnico.academico.disciplina.application.dto.DisciplinaResponse;
import com.desafiotecnico.academico.disciplina.application.mapper.DisciplinaMapper;
import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import com.desafiotecnico.academico.disciplina.infrastructure.repository.DisciplinaRepository;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DisciplinaService {

    private final DisciplinaRepository disciplinaRepository;
    private final DisciplinaMapper disciplinaMapper;
    private final CursoService cursoService;

    public DisciplinaService(DisciplinaRepository disciplinaRepository,
                             DisciplinaMapper disciplinaMapper,
                             CursoService cursoService) {
        this.disciplinaRepository = disciplinaRepository;
        this.disciplinaMapper = disciplinaMapper;
        this.cursoService = cursoService;
    }

    @Transactional
    public DisciplinaResponse create(DisciplinaRequest request) {
        validateUniqueCodigo(request.codigo(), null);
        Curso curso = cursoService.getEntity(request.cursoId());

        Disciplina disciplina = new Disciplina();
        disciplina.setNome(request.nome());
        disciplina.setCodigo(request.codigo());
        disciplina.setCurso(curso);

        return disciplinaMapper.toResponse(disciplinaRepository.save(disciplina));
    }

    @Transactional(readOnly = true)
    public List<DisciplinaResponse> findAll() {
        return disciplinaRepository.findAll().stream().map(disciplinaMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DisciplinaResponse findById(Long id) {
        return disciplinaMapper.toResponse(getEntity(id));
    }

    @Transactional
    public DisciplinaResponse update(Long id, DisciplinaRequest request) {
        Disciplina disciplina = getEntity(id);
        validateUniqueCodigo(request.codigo(), id);
        Curso curso = cursoService.getEntity(request.cursoId());

        disciplina.setNome(request.nome());
        disciplina.setCodigo(request.codigo());
        disciplina.setCurso(curso);

        return disciplinaMapper.toResponse(disciplinaRepository.save(disciplina));
    }

    @Transactional
    public void delete(Long id) {
        Disciplina disciplina = getEntity(id);
        disciplinaRepository.delete(disciplina);
    }

    public Disciplina getEntity(Long id) {
        return disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DISCIPLINA_NAO_ENCONTRADA", "Disciplina nao encontrada."));
    }

    private void validateUniqueCodigo(String codigo, Long id) {
        boolean codigoExists = id == null ? disciplinaRepository.existsByCodigo(codigo) : disciplinaRepository.existsByCodigoAndIdNot(codigo, id);
        if (codigoExists) {
            throw new ConflictException("DISCIPLINA_CODIGO_DUPLICADO", "Ja existe disciplina com o codigo informado.");
        }
    }
}
