package com.desafiotecnico.academico.disciplina;

import com.desafiotecnico.academico.curso.application.service.CursoService;
import com.desafiotecnico.academico.curso.domain.Curso;
import com.desafiotecnico.academico.disciplina.application.dto.DisciplinaRequest;
import com.desafiotecnico.academico.disciplina.application.dto.DisciplinaResponse;
import com.desafiotecnico.academico.disciplina.application.mapper.DisciplinaMapper;
import com.desafiotecnico.academico.disciplina.application.service.DisciplinaService;
import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import com.desafiotecnico.academico.disciplina.infrastructure.repository.DisciplinaRepository;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisciplinaServiceTest {

    @Mock
    private DisciplinaRepository disciplinaRepository;

    @Mock
    private DisciplinaMapper disciplinaMapper;

    @Mock
    private CursoService cursoService;

    @InjectMocks
    private DisciplinaService disciplinaService;

    @Test
    void deveFalharAoCriarDisciplinaComCodigoDuplicado() {
        DisciplinaRequest request = new DisciplinaRequest("Arquitetura", "ARQ-001", 1L);

        when(disciplinaRepository.existsByCodigo("ARQ-001")).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> disciplinaService.create(request));

        assertEquals("DISCIPLINA_CODIGO_DUPLICADO", exception.getCode());
    }

    @Test
    void deveCriarDisciplinaQuandoCursoExistirECodigoForUnico() {
        DisciplinaRequest request = new DisciplinaRequest("Arquitetura", "ARQ-001", 1L);
        Curso curso = new Curso();
        Disciplina salva = new Disciplina();
        DisciplinaResponse response = new DisciplinaResponse(1L, "Arquitetura", "ARQ-001", 1L);

        when(disciplinaRepository.existsByCodigo("ARQ-001")).thenReturn(false);
        when(cursoService.getEntity(1L)).thenReturn(curso);
        when(disciplinaRepository.save(org.mockito.ArgumentMatchers.any(Disciplina.class))).thenReturn(salva);
        when(disciplinaMapper.toResponse(salva)).thenReturn(response);

        DisciplinaResponse created = disciplinaService.create(request);

        assertEquals(1L, created.id());
    }
}
