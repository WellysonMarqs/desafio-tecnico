package com.desafiotecnico.academico.turma.application.service;

import com.desafiotecnico.academico.disciplina.application.service.DisciplinaService;
import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.shared.exception.ResourceNotFoundException;
import com.desafiotecnico.academico.turma.application.dto.TurmaRequest;
import com.desafiotecnico.academico.turma.application.dto.TurmaResponse;
import com.desafiotecnico.academico.turma.application.mapper.TurmaMapper;
import com.desafiotecnico.academico.turma.domain.Turma;
import com.desafiotecnico.academico.turma.infrastructure.repository.TurmaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TurmaService {

    private final TurmaRepository turmaRepository;
    private final TurmaMapper turmaMapper;
    private final DisciplinaService disciplinaService;

    public TurmaService(TurmaRepository turmaRepository,
                        TurmaMapper turmaMapper,
                        DisciplinaService disciplinaService) {
        this.turmaRepository = turmaRepository;
        this.turmaMapper = turmaMapper;
        this.disciplinaService = disciplinaService;
    }

    @Transactional
    public TurmaResponse create(TurmaRequest request) {
        validateUniqueCodigo(request.codigo(), null);
        Disciplina disciplina = disciplinaService.getEntity(request.disciplinaId());

        Turma turma = new Turma();
        applyRequest(turma, request, disciplina);
        return turmaMapper.toResponse(turmaRepository.save(turma));
    }

    @Transactional(readOnly = true)
    public List<TurmaResponse> findAll() {
        return turmaRepository.findAll().stream().map(turmaMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TurmaResponse findById(Long id) {
        return turmaMapper.toResponse(getEntity(id));
    }

    @Transactional
    public TurmaResponse update(Long id, TurmaRequest request) {
        Turma turma = getEntity(id);
        validateUniqueCodigo(request.codigo(), id);
        Disciplina disciplina = disciplinaService.getEntity(request.disciplinaId());

        applyRequest(turma, request, disciplina);
        return turmaMapper.toResponse(turmaRepository.save(turma));
    }

    @Transactional
    public void delete(Long id) {
        Turma turma = getEntity(id);
        turmaRepository.delete(turma);
    }

    @Transactional(readOnly = true)
    public Turma getEntity(Long id) {
        return turmaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TURMA_NAO_ENCONTRADA", "Turma nao encontrada."));
    }

    private void applyRequest(Turma turma, TurmaRequest request, Disciplina disciplina) {
        turma.setCodigo(request.codigo());
        turma.setDisciplina(disciplina);
        turma.setCapacidade(request.capacidade());
        turma.setVagasDisponiveis(request.capacidade());
        turma.setStatus(request.status());
    }

    private void validateUniqueCodigo(String codigo, Long id) {
        boolean codigoExists = id == null ? turmaRepository.existsByCodigo(codigo) : turmaRepository.existsByCodigoAndIdNot(codigo, id);
        if (codigoExists) {
            throw new ConflictException("TURMA_CODIGO_DUPLICADO", "Ja existe turma com o codigo informado.");
        }
    }
}
