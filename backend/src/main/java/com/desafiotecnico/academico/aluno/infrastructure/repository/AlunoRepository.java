package com.desafiotecnico.academico.aluno.infrastructure.repository;

import com.desafiotecnico.academico.aluno.domain.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByMatriculaAndIdNot(String matricula, Long id);

    boolean existsByEmail(String email);

    boolean existsByMatricula(String matricula);
}
