package com.desafiotecnico.academico.matricula.application.service;

import com.desafiotecnico.academico.aluno.application.service.AlunoService;
import com.desafiotecnico.academico.aluno.domain.Aluno;
import com.desafiotecnico.academico.eventos.application.service.MatriculaEventoOutboxService;
import com.desafiotecnico.academico.eventos.domain.MatriculaEventoTipo;
import com.desafiotecnico.academico.matricula.application.dto.MatriculaRequest;
import com.desafiotecnico.academico.matricula.application.dto.MatriculaResponse;
import com.desafiotecnico.academico.matricula.application.mapper.MatriculaMapper;
import com.desafiotecnico.academico.matricula.domain.Matricula;
import com.desafiotecnico.academico.matricula.domain.MatriculaStatus;
import com.desafiotecnico.academico.matricula.infrastructure.repository.MatriculaRepository;
import com.desafiotecnico.academico.shared.correlation.CorrelationIdContext;
import com.desafiotecnico.academico.shared.exception.BusinessRuleException;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.shared.exception.ResourceNotFoundException;
import com.desafiotecnico.academico.turma.application.service.TurmaService;
import com.desafiotecnico.academico.turma.domain.Turma;
import com.desafiotecnico.academico.turma.domain.TurmaStatus;
import jakarta.persistence.OptimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MatriculaService {

    private static final Logger log = LoggerFactory.getLogger(MatriculaService.class);

    private final MatriculaRepository matriculaRepository;
    private final MatriculaMapper matriculaMapper;
    private final AlunoService alunoService;
    private final TurmaService turmaService;
    private final MatriculaEventoOutboxService matriculaEventoOutboxService;

    public MatriculaService(MatriculaRepository matriculaRepository,
                            MatriculaMapper matriculaMapper,
                            AlunoService alunoService,
                            TurmaService turmaService,
                            MatriculaEventoOutboxService matriculaEventoOutboxService) {
        this.matriculaRepository = matriculaRepository;
        this.matriculaMapper = matriculaMapper;
        this.alunoService = alunoService;
        this.turmaService = turmaService;
        this.matriculaEventoOutboxService = matriculaEventoOutboxService;
    }

    @Transactional
    public MatriculaResponse create(MatriculaRequest request) {
        Aluno aluno = alunoService.getEntity(request.alunoId());
        Turma turma = turmaService.getEntity(request.turmaId());

        if (matriculaRepository.existsByAlunoIdAndTurmaId(aluno.getId(), turma.getId())) {
            throw new ConflictException("MATRICULA_DUPLICADA", "O aluno ja possui matricula para a turma informada.");
        }

        validateTurmaAberta(turma);

        Matricula matricula = new Matricula();
        matricula.setAluno(aluno);
        matricula.setTurma(turma);
        matricula.setStatus(MatriculaStatus.PENDENTE);

        try {
            Matricula persisted = matriculaRepository.saveAndFlush(matricula);
            registrarEvento(MatriculaEventoTipo.MATRICULA_CRIADA, persisted);
            log.info("Matricula criada", kv("matriculaId", persisted.getId()), kv("alunoId", aluno.getId()), kv("turmaId", turma.getId()), kv("status", persisted.getStatus()));
            return matriculaMapper.toResponse(persisted);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("MATRICULA_DUPLICADA", "O aluno ja possui matricula para a turma informada.");
        }
    }

    @Transactional
    public MatriculaResponse confirm(Long id) {
        try {
            return confirmInternal(id);
        } catch (ObjectOptimisticLockingFailureException | OptimisticLockException exception) {
            throw new ConflictException("TURMA_SEM_VAGAS", "Nao ha vagas disponiveis para a turma informada.");
        }
    }

    private MatriculaResponse confirmInternal(Long id) {
        Matricula matricula = getEntity(id);
        Turma turma = turmaService.getEntity(matricula.getTurma().getId());

        if (matricula.getStatus() == MatriculaStatus.CONFIRMADA) {
            return matriculaMapper.toResponse(matricula);
        }

        if (matricula.getStatus() == MatriculaStatus.CANCELADA) {
            throw new BusinessRuleException("TRANSICAO_STATUS_INVALIDA", "Matricula cancelada nao pode ser confirmada.");
        }

        validateTurmaAberta(turma);

        if (turma.getVagasDisponiveis() == null || turma.getVagasDisponiveis() <= 0) {
            throw new ConflictException("TURMA_SEM_VAGAS", "Nao ha vagas disponiveis para a turma informada.");
        }

        turma.consumirVaga();
        matricula.setStatus(MatriculaStatus.CONFIRMADA);
        matricula.setConfirmadaEm(OffsetDateTime.now());

        Matricula persisted = matriculaRepository.saveAndFlush(matricula);
        registrarEvento(MatriculaEventoTipo.MATRICULA_CONFIRMADA, persisted);
        log.info("Matricula confirmada", kv("matriculaId", persisted.getId()), kv("turmaId", turma.getId()), kv("vagasDisponiveis", turma.getVagasDisponiveis()), kv("status", persisted.getStatus()));
        return matriculaMapper.toResponse(persisted);
    }

    @Transactional
    public MatriculaResponse cancel(Long id) {
        Matricula matricula = getEntity(id);
        Turma turma = turmaService.getEntity(matricula.getTurma().getId());

        if (matricula.getStatus() == MatriculaStatus.CANCELADA) {
            return matriculaMapper.toResponse(matricula);
        }

        if (matricula.getStatus() == MatriculaStatus.CONFIRMADA) {
            turma.liberarVaga();
        }

        matricula.setStatus(MatriculaStatus.CANCELADA);
        matricula.setCanceladaEm(OffsetDateTime.now());

        Matricula persisted = matriculaRepository.saveAndFlush(matricula);
        registrarEvento(MatriculaEventoTipo.MATRICULA_CANCELADA, persisted);
        log.info("Matricula cancelada", kv("matriculaId", persisted.getId()), kv("turmaId", turma.getId()), kv("vagasDisponiveis", turma.getVagasDisponiveis()), kv("status", persisted.getStatus()));
        return matriculaMapper.toResponse(persisted);
    }

    @Transactional(readOnly = true)
    public List<MatriculaResponse> findByAluno(Long alunoId) {
        alunoService.getEntity(alunoId);
        return matriculaRepository.findByAlunoIdOrderByCriadaEmDesc(alunoId)
                .stream()
                .map(matriculaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MatriculaResponse> findByTurma(Long turmaId) {
        turmaService.getEntity(turmaId);
        return matriculaRepository.findByTurmaIdOrderByCriadaEmDesc(turmaId)
                .stream()
                .map(matriculaMapper::toResponse)
                .toList();
    }

    private Matricula getEntity(Long id) {
        return matriculaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MATRICULA_NAO_ENCONTRADA", "Matricula nao encontrada."));
    }

    private void validateTurmaAberta(Turma turma) {
        if (turma.getStatus() != TurmaStatus.ABERTA) {
            throw new BusinessRuleException("TURMA_FECHADA", "A turma informada nao esta aberta para matricula.");
        }
    }

    private void registrarEvento(MatriculaEventoTipo tipo, Matricula matricula) {
        String correlationId = CorrelationIdContext.get() != null ? CorrelationIdContext.get() : "generated-" + UUID.randomUUID();
        matriculaEventoOutboxService.registrar(tipo, matricula, correlationId);
    }

    private String kv(String chave, Object valor) {
        return chave + "=" + valor;
    }
}
