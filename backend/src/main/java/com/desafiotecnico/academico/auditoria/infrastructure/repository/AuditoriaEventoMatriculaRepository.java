package com.desafiotecnico.academico.auditoria.infrastructure.repository;

import com.desafiotecnico.academico.auditoria.domain.AuditoriaEventoMatricula;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuditoriaEventoMatriculaRepository extends JpaRepository<AuditoriaEventoMatricula, Long> {

    boolean existsByEventId(UUID eventId);

    Optional<AuditoriaEventoMatricula> findByEventId(UUID eventId);
}
