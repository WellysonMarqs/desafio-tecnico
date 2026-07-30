package com.desafiotecnico.academico.matricula;

import com.desafiotecnico.academico.aluno.application.service.AlunoService;
import com.desafiotecnico.academico.aluno.domain.Aluno;
import com.desafiotecnico.academico.eventos.application.service.MatriculaEventoOutboxService;
import com.desafiotecnico.academico.eventos.domain.MatriculaEventoTipo;
import com.desafiotecnico.academico.matricula.application.dto.MatriculaRequest;
import com.desafiotecnico.academico.matricula.application.dto.MatriculaResponse;
import com.desafiotecnico.academico.matricula.application.mapper.MatriculaMapper;
import com.desafiotecnico.academico.matricula.application.service.MatriculaService;
import com.desafiotecnico.academico.matricula.domain.Matricula;
import com.desafiotecnico.academico.matricula.domain.MatriculaStatus;
import com.desafiotecnico.academico.matricula.infrastructure.repository.MatriculaRepository;
import com.desafiotecnico.academico.shared.exception.BusinessRuleException;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.turma.application.service.TurmaService;
import com.desafiotecnico.academico.turma.domain.Turma;
import com.desafiotecnico.academico.turma.domain.TurmaStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatriculaServiceTest {

    @Mock
    private MatriculaRepository matriculaRepository;

    @Mock
    private MatriculaMapper matriculaMapper;

    @Mock
    private AlunoService alunoService;

    @Mock
    private TurmaService turmaService;

    @Mock
    private MatriculaEventoOutboxService matriculaEventoOutboxService;

    @InjectMocks
    private MatriculaService matriculaService;

    @Test
    void deveCriarMatriculaPendente() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 2);
        Matricula matriculaSalva = matricula(aluno, turma, MatriculaStatus.PENDENTE);
        MatriculaResponse response = response(99L, 1L, 10L, MatriculaStatus.PENDENTE);

        when(alunoService.getEntity(1L)).thenReturn(aluno);
        when(turmaService.getEntity(10L)).thenReturn(turma);
        when(matriculaRepository.existsByAlunoIdAndTurmaId(1L, 10L)).thenReturn(false);
        when(matriculaRepository.saveAndFlush(any(Matricula.class))).thenReturn(matriculaSalva);
        when(matriculaMapper.toResponse(matriculaSalva)).thenReturn(response);

        MatriculaResponse created = matriculaService.create(new MatriculaRequest(1L, 10L));

        assertEquals(MatriculaStatus.PENDENTE, created.status());
        verify(matriculaRepository).saveAndFlush(any(Matricula.class));
        verify(matriculaEventoOutboxService).registrar(org.mockito.ArgumentMatchers.eq(MatriculaEventoTipo.MATRICULA_CRIADA), org.mockito.ArgumentMatchers.any(Matricula.class), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void deveFalharAoCriarMatriculaDuplicada() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 2);

        when(alunoService.getEntity(1L)).thenReturn(aluno);
        when(turmaService.getEntity(10L)).thenReturn(turma);
        when(matriculaRepository.existsByAlunoIdAndTurmaId(1L, 10L)).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class,
                () -> matriculaService.create(new MatriculaRequest(1L, 10L)));

        assertEquals("MATRICULA_DUPLICADA", exception.getCode());
    }

    @Test
    void deveConfirmarMatriculaConsumindoVaga() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 1);
        Matricula matricula = matricula(aluno, turma, MatriculaStatus.PENDENTE);
        MatriculaResponse response = response(99L, 1L, 10L, MatriculaStatus.CONFIRMADA);

        when(matriculaRepository.findById(99L)).thenReturn(Optional.of(matricula));
        when(turmaService.getEntity(10L)).thenReturn(turma);
        when(matriculaRepository.saveAndFlush(matricula)).thenReturn(matricula);
        when(matriculaMapper.toResponse(matricula)).thenReturn(response);

        MatriculaResponse confirmed = matriculaService.confirm(99L);

        assertEquals(MatriculaStatus.CONFIRMADA, confirmed.status());
        assertEquals(0, turma.getVagasDisponiveis());
        assertNotNull(matricula.getConfirmadaEm());
        verify(matriculaEventoOutboxService).registrar(org.mockito.ArgumentMatchers.eq(MatriculaEventoTipo.MATRICULA_CONFIRMADA), org.mockito.ArgumentMatchers.same(matricula), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void deveFalharAoConfirmarSemVagas() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 0);
        Matricula matricula = matricula(aluno, turma, MatriculaStatus.PENDENTE);

        when(matriculaRepository.findById(99L)).thenReturn(Optional.of(matricula));
        when(turmaService.getEntity(10L)).thenReturn(turma);

        ConflictException exception = assertThrows(ConflictException.class, () -> matriculaService.confirm(99L));

        assertEquals("TURMA_SEM_VAGAS", exception.getCode());
    }

    @Test
    void deveFalharAoConfirmarMatriculaCancelada() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 1);
        Matricula matricula = matricula(aluno, turma, MatriculaStatus.CANCELADA);

        when(matriculaRepository.findById(99L)).thenReturn(Optional.of(matricula));
        when(turmaService.getEntity(10L)).thenReturn(turma);

        BusinessRuleException exception = assertThrows(BusinessRuleException.class, () -> matriculaService.confirm(99L));

        assertEquals("TRANSICAO_STATUS_INVALIDA", exception.getCode());
    }

    @Test
    void deveCancelarMatriculaConfirmadaELiberarVaga() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 0);
        turma.setCapacidade(1);
        Matricula matricula = matricula(aluno, turma, MatriculaStatus.CONFIRMADA);
        matricula.setConfirmadaEm(OffsetDateTime.now().minusMinutes(1));
        MatriculaResponse response = response(99L, 1L, 10L, MatriculaStatus.CANCELADA);

        when(matriculaRepository.findById(99L)).thenReturn(Optional.of(matricula));
        when(turmaService.getEntity(10L)).thenReturn(turma);
        when(matriculaRepository.saveAndFlush(matricula)).thenReturn(matricula);
        when(matriculaMapper.toResponse(matricula)).thenReturn(response);

        MatriculaResponse canceled = matriculaService.cancel(99L);

        assertEquals(MatriculaStatus.CANCELADA, canceled.status());
        verify(matriculaEventoOutboxService).registrar(org.mockito.ArgumentMatchers.eq(MatriculaEventoTipo.MATRICULA_CANCELADA), org.mockito.ArgumentMatchers.same(matricula), org.mockito.ArgumentMatchers.anyString());
        assertEquals(1, turma.getVagasDisponiveis());
        assertNotNull(matricula.getCanceladaEm());
        verify(matriculaEventoOutboxService).registrar(org.mockito.ArgumentMatchers.eq(MatriculaEventoTipo.MATRICULA_CANCELADA), org.mockito.ArgumentMatchers.same(matricula), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void naoDeveLiberarVagaAoCancelarMatriculaPendente() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 1);
        Matricula matricula = matricula(aluno, turma, MatriculaStatus.PENDENTE);
        MatriculaResponse response = response(99L, 1L, 10L, MatriculaStatus.CANCELADA);

        when(matriculaRepository.findById(99L)).thenReturn(Optional.of(matricula));
        when(turmaService.getEntity(10L)).thenReturn(turma);
        when(matriculaRepository.saveAndFlush(matricula)).thenReturn(matricula);
        when(matriculaMapper.toResponse(matricula)).thenReturn(response);

        MatriculaResponse canceled = matriculaService.cancel(99L);

        assertEquals(1, turma.getVagasDisponiveis());
        assertEquals(MatriculaStatus.CANCELADA, canceled.status());
    }

    @Test
    void deveListarMatriculasPorAluno() {
        when(alunoService.getEntity(1L)).thenReturn(aluno(1L));
        when(matriculaRepository.findByAlunoIdOrderByCriadaEmDesc(1L)).thenReturn(List.of());

        assertEquals(0, matriculaService.findByAluno(1L).size());
        verify(matriculaRepository).findByAlunoIdOrderByCriadaEmDesc(1L);
    }

    @Test
    void deveListarMatriculasPorTurma() {
        when(turmaService.getEntity(10L)).thenReturn(turma(10L, TurmaStatus.ABERTA, 1));
        when(matriculaRepository.findByTurmaIdOrderByCriadaEmDesc(10L)).thenReturn(List.of());

        assertEquals(0, matriculaService.findByTurma(10L).size());
        verify(matriculaRepository).findByTurmaIdOrderByCriadaEmDesc(10L);
    }

    @Test
    void deveIgnorarNovaConfirmacaoQuandoJaConfirmada() {
        Aluno aluno = aluno(1L);
        Turma turma = turma(10L, TurmaStatus.ABERTA, 0);
        Matricula matricula = matricula(aluno, turma, MatriculaStatus.CONFIRMADA);
        MatriculaResponse response = response(99L, 1L, 10L, MatriculaStatus.CONFIRMADA);

        when(matriculaRepository.findById(99L)).thenReturn(Optional.of(matricula));
        when(turmaService.getEntity(10L)).thenReturn(turma);
        when(matriculaMapper.toResponse(matricula)).thenReturn(response);

        MatriculaResponse confirmed = matriculaService.confirm(99L);

        assertEquals(MatriculaStatus.CONFIRMADA, confirmed.status());
        verify(matriculaRepository, never()).saveAndFlush(matricula);
    }

    private Aluno aluno(Long id) {
        Aluno aluno = new Aluno();
        try {
            var field = Aluno.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(aluno, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        return aluno;
    }

    private Turma turma(Long id, TurmaStatus status, int vagasDisponiveis) {
        Turma turma = new Turma();
        try {
            var field = Turma.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(turma, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        turma.setStatus(status);
        turma.setCapacidade(Math.max(vagasDisponiveis, 1));
        turma.setVagasDisponiveis(vagasDisponiveis);
        return turma;
    }

    private Matricula matricula(Aluno aluno, Turma turma, MatriculaStatus status) {
        Matricula matricula = new Matricula();
        try {
            var field = Matricula.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(matricula, 99L);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
        matricula.setAluno(aluno);
        matricula.setTurma(turma);
        matricula.setStatus(status);
        return matricula;
    }

    private MatriculaResponse response(Long id, Long alunoId, Long turmaId, MatriculaStatus status) {
        return new MatriculaResponse(id, alunoId, turmaId, status, OffsetDateTime.now(), null, null);
    }
}
