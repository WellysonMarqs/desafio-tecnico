package com.desafiotecnico.academico.turma.infrastructure.repository;

import com.desafiotecnico.academico.turma.domain.Turma;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TurmaRepository extends JpaRepository<Turma, Long> {

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);

    @Override
    @EntityGraph(attributePaths = {"disciplina", "disciplina.curso"})
    List<Turma> findAll();

    @Override
    @EntityGraph(attributePaths = {"disciplina", "disciplina.curso"})
    Optional<Turma> findById(Long id);
}
