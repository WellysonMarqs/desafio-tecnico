package com.desafiotecnico.academico.disciplina.infrastructure.repository;

import com.desafiotecnico.academico.disciplina.domain.Disciplina;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DisciplinaRepository extends JpaRepository<Disciplina, Long> {

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);

    @Override
    @EntityGraph(attributePaths = "curso")
    List<Disciplina> findAll();

    @Override
    @EntityGraph(attributePaths = "curso")
    Optional<Disciplina> findById(Long id);
}
