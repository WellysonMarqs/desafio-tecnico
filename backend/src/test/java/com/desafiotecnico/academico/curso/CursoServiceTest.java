package com.desafiotecnico.academico.curso;

import com.desafiotecnico.academico.curso.application.dto.CursoRequest;
import com.desafiotecnico.academico.curso.application.dto.CursoResponse;
import com.desafiotecnico.academico.curso.application.mapper.CursoMapper;
import com.desafiotecnico.academico.curso.application.service.CursoService;
import com.desafiotecnico.academico.curso.domain.Curso;
import com.desafiotecnico.academico.curso.infrastructure.repository.CursoRepository;
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
class CursoServiceTest {

    @Mock
    private CursoRepository cursoRepository;

    @Mock
    private CursoMapper cursoMapper;

    @InjectMocks
    private CursoService cursoService;

    @Test
    void deveFalharAoCriarCursoComCodigoDuplicado() {
        CursoRequest request = new CursoRequest("ADS", "ADS");

        when(cursoRepository.existsByCodigo("ADS")).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> cursoService.create(request));

        assertEquals("CURSO_CODIGO_DUPLICADO", exception.getCode());
    }

    @Test
    void deveCriarCursoQuandoCodigoForUnico() {
        CursoRequest request = new CursoRequest("ADS", "ADS");
        Curso curso = new Curso();
        Curso salvo = new Curso();
        CursoResponse response = new CursoResponse(1L, "ADS", "ADS");

        when(cursoRepository.existsByCodigo("ADS")).thenReturn(false);
        when(cursoMapper.toEntity(request)).thenReturn(curso);
        when(cursoRepository.save(curso)).thenReturn(salvo);
        when(cursoMapper.toResponse(salvo)).thenReturn(response);

        CursoResponse created = cursoService.create(request);

        assertEquals(1L, created.id());
    }
}
