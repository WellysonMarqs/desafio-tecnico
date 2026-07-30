package com.desafiotecnico.academico.aluno.application.service;

import com.desafiotecnico.academico.aluno.application.dto.AlunoRequest;
import com.desafiotecnico.academico.aluno.application.dto.AlunoResponse;
import com.desafiotecnico.academico.aluno.application.mapper.AlunoMapper;
import com.desafiotecnico.academico.aluno.domain.Aluno;
import com.desafiotecnico.academico.aluno.infrastructure.repository.AlunoRepository;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final AlunoMapper alunoMapper;

    public AlunoService(AlunoRepository alunoRepository, AlunoMapper alunoMapper) {
        this.alunoRepository = alunoRepository;
        this.alunoMapper = alunoMapper;
    }

    @Transactional
    public AlunoResponse create(AlunoRequest request) {
        validateUniqueness(request.email(), request.matricula(), null);
        Aluno aluno = alunoMapper.toEntity(request);
        return alunoMapper.toResponse(alunoRepository.save(aluno));
    }

    @Transactional(readOnly = true)
    public List<AlunoResponse> findAll() {
        return alunoRepository.findAll().stream().map(alunoMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AlunoResponse findById(Long id) {
        return alunoMapper.toResponse(getEntity(id));
    }

    @Transactional
    public AlunoResponse update(Long id, AlunoRequest request) {
        Aluno aluno = getEntity(id);
        validateUniqueness(request.email(), request.matricula(), id);
        alunoMapper.copy(request, aluno);
        return alunoMapper.toResponse(alunoRepository.save(aluno));
    }

    @Transactional
    public void delete(Long id) {
        Aluno aluno = getEntity(id);
        alunoRepository.delete(aluno);
    }

    @Transactional(readOnly = true)
    public Aluno getEntity(Long id) {
        return alunoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ALUNO_NAO_ENCONTRADO", "Aluno nao encontrado."));
    }

    private void validateUniqueness(String email, String matricula, Long id) {
        boolean emailExists = id == null ? alunoRepository.existsByEmail(email) : alunoRepository.existsByEmailAndIdNot(email, id);
        if (emailExists) {
            throw new ConflictException("ALUNO_EMAIL_DUPLICADO", "Ja existe aluno com o email informado.");
        }

        boolean matriculaExists = id == null ? alunoRepository.existsByMatricula(matricula) : alunoRepository.existsByMatriculaAndIdNot(matricula, id);
        if (matriculaExists) {
            throw new ConflictException("ALUNO_MATRICULA_DUPLICADA", "Ja existe aluno com a matricula informada.");
        }
    }
}
