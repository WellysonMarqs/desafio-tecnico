package com.desafiotecnico.academico.turma;

import com.desafiotecnico.academico.disciplina.application.service.DisciplinaService;
import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.turma.application.dto.TurmaRequest;
import com.desafiotecnico.academico.turma.application.dto.TurmaResponse;
import com.desafiotecnico.academico.turma.application.mapper.TurmaMapper;
import com.desafiotecnico.academico.turma.application.service.TurmaService;
import com.desafiotecnico.academico.turma.domain.Turma;
import com.desafiotecnico.academico.turma.domain.TurmaStatus;
import com.desafiotecnico.academico.turma.infrastructure.repository.TurmaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TurmaServiceTest {

    @Mock
    private TurmaRepository turmaRepository;

    @Mock
    private TurmaMapper turmaMapper;

    @Mock
    private DisciplinaService disciplinaService;

    @InjectMocks
    private TurmaService turmaService;

    @Test
    void deveCriarTurmaComVagasDisponiveisIguaisCapacidade() {
        TurmaRequest request = new TurmaRequest("T-2026-01", 1L, 30, TurmaStatus.ABERTA);
        Disciplina disciplina = new Disciplina();
        Turma salva = new Turma();
        TurmaResponse response = new TurmaResponse(1L, "T-2026-01", 1L, 30, 30, TurmaStatus.ABERTA);

        when(turmaRepository.existsByCodigo("T-2026-01")).thenReturn(false);
        when(disciplinaService.getEntity(1L)).thenReturn(disciplina);
        when(turmaRepository.save(any(Turma.class))).thenReturn(salva);
        when(turmaMapper.toResponse(salva)).thenReturn(response);

        TurmaResponse created = turmaService.create(request);

        assertEquals(30, created.capacidade());
        assertEquals(30, created.vagasDisponiveis());
    }

    @Test
    void deveFalharAoCriarTurmaComCodigoDuplicado() {
        TurmaRequest request = new TurmaRequest("T-2026-01", 1L, 30, TurmaStatus.ABERTA);

        when(turmaRepository.existsByCodigo("T-2026-01")).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> turmaService.create(request));

        assertEquals("TURMA_CODIGO_DUPLICADO", exception.getCode());
    }
}
