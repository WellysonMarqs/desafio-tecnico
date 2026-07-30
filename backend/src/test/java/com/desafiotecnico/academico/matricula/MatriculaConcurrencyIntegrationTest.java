package com.desafiotecnico.academico.matricula;

import com.desafiotecnico.academico.aluno.domain.Aluno;
import com.desafiotecnico.academico.aluno.infrastructure.repository.AlunoRepository;
import com.desafiotecnico.academico.curso.domain.Curso;
import com.desafiotecnico.academico.curso.infrastructure.repository.CursoRepository;
import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import com.desafiotecnico.academico.disciplina.infrastructure.repository.DisciplinaRepository;
import com.desafiotecnico.academico.matricula.application.dto.MatriculaRequest;
import com.desafiotecnico.academico.matricula.application.service.MatriculaService;
import com.desafiotecnico.academico.matricula.domain.MatriculaStatus;
import com.desafiotecnico.academico.matricula.infrastructure.repository.MatriculaRepository;
import com.desafiotecnico.academico.turma.domain.Turma;
import com.desafiotecnico.academico.turma.domain.TurmaStatus;
import com.desafiotecnico.academico.turma.infrastructure.repository.TurmaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class MatriculaConcurrencyIntegrationTest {

    @Autowired
    private MatriculaService matriculaService;

    @Autowired
    private CursoRepository cursoRepository;

    @Autowired
    private DisciplinaRepository disciplinaRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private MatriculaRepository matriculaRepository;

    @BeforeEach
    void setUp() {
        matriculaRepository.deleteAll();
        turmaRepository.deleteAll();
        disciplinaRepository.deleteAll();
        alunoRepository.deleteAll();
        cursoRepository.deleteAll();
    }

    @Test
    void deveConfirmarSomenteUmaMatriculaQuandoHaApenasUmaVaga() throws Exception {
        Curso curso = cursoRepository.save(curso("Curso Concorrencia", "CC" + sufixo()));
        Disciplina disciplina = disciplinaRepository.save(disciplina(curso, "Disciplina Concorrencia", "DC" + sufixo()));
        Turma turma = turmaRepository.save(turma(disciplina, "TURMA-CONC-" + sufixo(), 1));

        Aluno aluno1 = alunoRepository.save(aluno("Aluno 1", "a1." + sufixo() + "@mail.com", "MAT1" + sufixo()));
        Aluno aluno2 = alunoRepository.save(aluno("Aluno 2", "a2." + sufixo() + "@mail.com", "MAT2" + sufixo()));

        Long matricula1 = matriculaService.create(new MatriculaRequest(aluno1.getId(), turma.getId())).id();
        Long matricula2 = matriculaService.create(new MatriculaRequest(aluno2.getId(), turma.getId())).id();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<String> confirmacao1 = () -> confirmarEmParalelo(matricula1, ready, start);
        Callable<String> confirmacao2 = () -> confirmarEmParalelo(matricula2, ready, start);

        Future<String> future1 = executor.submit(confirmacao1);
        Future<String> future2 = executor.submit(confirmacao2);

        ready.await(5, TimeUnit.SECONDS);
        start.countDown();

        List<String> resultados = new ArrayList<>();
        resultados.add(future1.get(10, TimeUnit.SECONDS));
        resultados.add(future2.get(10, TimeUnit.SECONDS));
        executor.shutdown();

        long confirmadas = resultados.stream().filter("CONFIRMADA"::equals).count();
        long semVaga = resultados.stream().filter("TURMA_SEM_VAGAS"::equals).count();

        Turma turmaAtualizada = turmaRepository.findById(turma.getId()).orElseThrow();
        long matriculasConfirmadas = matriculaRepository.findAll().stream()
                .filter(matricula -> matricula.getStatus() == MatriculaStatus.CONFIRMADA)
                .count();

        assertEquals(1, confirmadas);
        assertEquals(1, semVaga);
        assertEquals(1, matriculasConfirmadas);
        assertEquals(0, turmaAtualizada.getVagasDisponiveis());
        assertTrue(resultados.contains("CONFIRMADA"));
        assertTrue(resultados.contains("TURMA_SEM_VAGAS"));
    }

    private String confirmarEmParalelo(Long matriculaId, CountDownLatch ready, CountDownLatch start) {
        ready.countDown();
        try {
            start.await(5, TimeUnit.SECONDS);
            matriculaService.confirm(matriculaId);
            return "CONFIRMADA";
        } catch (Exception exception) {
            return exception instanceof com.desafiotecnico.academico.shared.exception.ConflictException conflictException
                    ? conflictException.getCode()
                    : exception.getClass().getSimpleName();
        }
    }

    private Curso curso(String nome, String codigo) {
        Curso curso = new Curso();
        curso.setNome(nome);
        curso.setCodigo(codigo);
        return curso;
    }

    private Disciplina disciplina(Curso curso, String nome, String codigo) {
        Disciplina disciplina = new Disciplina();
        disciplina.setCurso(curso);
        disciplina.setNome(nome);
        disciplina.setCodigo(codigo);
        return disciplina;
    }

    private Turma turma(Disciplina disciplina, String codigo, int capacidade) {
        Turma turma = new Turma();
        turma.setDisciplina(disciplina);
        turma.setCodigo(codigo);
        turma.setCapacidade(capacidade);
        turma.setVagasDisponiveis(capacidade);
        turma.setStatus(TurmaStatus.ABERTA);
        return turma;
    }

    private Aluno aluno(String nome, String email, String matricula) {
        Aluno aluno = new Aluno();
        aluno.setNome(nome);
        aluno.setEmail(email);
        aluno.setMatricula(matricula);
        return aluno;
    }

    private String sufixo() {
        return UUID.randomUUID().toString().substring(0, 6);
    }
}
