package com.desafiotecnico.academico.matricula.infrastructure.repository;

import com.desafiotecnico.academico.matricula.domain.Matricula;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {

    boolean existsByAlunoIdAndTurmaId(Long alunoId, Long turmaId);

    @Override
    @EntityGraph(attributePaths = {"aluno", "turma", "turma.disciplina", "turma.disciplina.curso"})
    Optional<Matricula> findById(Long id);

    @EntityGraph(attributePaths = {"aluno", "turma", "turma.disciplina", "turma.disciplina.curso"})
    List<Matricula> findByAlunoIdOrderByCriadaEmDesc(Long alunoId);

    @EntityGraph(attributePaths = {"aluno", "turma", "turma.disciplina", "turma.disciplina.curso"})
    List<Matricula> findByTurmaIdOrderByCriadaEmDesc(Long turmaId);
}
