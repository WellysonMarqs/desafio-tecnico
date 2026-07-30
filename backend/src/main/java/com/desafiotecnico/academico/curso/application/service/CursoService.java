package com.desafiotecnico.academico.curso.application.service;

import com.desafiotecnico.academico.curso.application.dto.CursoRequest;
import com.desafiotecnico.academico.curso.application.dto.CursoResponse;
import com.desafiotecnico.academico.curso.application.mapper.CursoMapper;
import com.desafiotecnico.academico.curso.domain.Curso;
import com.desafiotecnico.academico.curso.infrastructure.repository.CursoRepository;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CursoService {

    private final CursoRepository cursoRepository;
    private final CursoMapper cursoMapper;

    public CursoService(CursoRepository cursoRepository, CursoMapper cursoMapper) {
        this.cursoRepository = cursoRepository;
        this.cursoMapper = cursoMapper;
    }

    @Transactional
    public CursoResponse create(CursoRequest request) {
        validateUniqueCodigo(request.codigo(), null);
        Curso curso = cursoMapper.toEntity(request);
        return cursoMapper.toResponse(cursoRepository.save(curso));
    }

    @Transactional(readOnly = true)
    public List<CursoResponse> findAll() {
        return cursoRepository.findAll().stream().map(cursoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CursoResponse findById(Long id) {
        return cursoMapper.toResponse(getEntity(id));
    }

    @Transactional
    public CursoResponse update(Long id, CursoRequest request) {
        Curso curso = getEntity(id);
        validateUniqueCodigo(request.codigo(), id);
        cursoMapper.copy(request, curso);
        return cursoMapper.toResponse(cursoRepository.save(curso));
    }

    @Transactional
    public void delete(Long id) {
        Curso curso = getEntity(id);
        cursoRepository.delete(curso);
    }

    public Curso getEntity(Long id) {
        return cursoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CURSO_NAO_ENCONTRADO", "Curso nao encontrado."));
    }

    private void validateUniqueCodigo(String codigo, Long id) {
        boolean codigoExists = id == null ? cursoRepository.existsByCodigo(codigo) : cursoRepository.existsByCodigoAndIdNot(codigo, id);
        if (codigoExists) {
            throw new ConflictException("CURSO_CODIGO_DUPLICADO", "Ja existe curso com o codigo informado.");
        }
    }
}
