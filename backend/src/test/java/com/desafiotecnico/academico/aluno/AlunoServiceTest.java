package com.desafiotecnico.academico.aluno;

import com.desafiotecnico.academico.aluno.application.dto.AlunoRequest;
import com.desafiotecnico.academico.aluno.application.dto.AlunoResponse;
import com.desafiotecnico.academico.aluno.application.mapper.AlunoMapper;
import com.desafiotecnico.academico.aluno.application.service.AlunoService;
import com.desafiotecnico.academico.aluno.domain.Aluno;
import com.desafiotecnico.academico.aluno.infrastructure.repository.AlunoRepository;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlunoServiceTest {

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private AlunoMapper alunoMapper;

    @InjectMocks
    private AlunoService alunoService;

    @Test
    void deveCriarAlunoQuandoDadosForemValidos() {
        AlunoRequest request = new AlunoRequest("Joao", "joao@example.com", "20260001");
        Aluno aluno = new Aluno();
        Aluno salvo = new Aluno();
        AlunoResponse response = new AlunoResponse(1L, "Joao", "joao@example.com", "20260001", OffsetDateTime.now());

        when(alunoRepository.existsByEmail("joao@example.com")).thenReturn(false);
        when(alunoRepository.existsByMatricula("20260001")).thenReturn(false);
        when(alunoMapper.toEntity(request)).thenReturn(aluno);
        when(alunoRepository.save(aluno)).thenReturn(salvo);
        when(alunoMapper.toResponse(salvo)).thenReturn(response);

        AlunoResponse created = alunoService.create(request);

        assertEquals(1L, created.id());
        assertEquals("Joao", created.nome());
    }

    @Test
    void deveFalharAoCriarAlunoComEmailDuplicado() {
        AlunoRequest request = new AlunoRequest("Joao", "joao@example.com", "20260001");

        when(alunoRepository.existsByEmail("joao@example.com")).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> alunoService.create(request));

        assertEquals("ALUNO_EMAIL_DUPLICADO", exception.getCode());
    }
}
