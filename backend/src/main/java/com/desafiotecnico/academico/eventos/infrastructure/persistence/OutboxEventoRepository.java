package com.desafiotecnico.academico.eventos.infrastructure.persistence;

import com.desafiotecnico.academico.eventos.domain.OutboxEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.UUID;

public interface OutboxEventoRepository extends JpaRepository<OutboxEvento, UUID> {

    @Transactional(readOnly = true)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<OutboxEvento> findTop20ByPublicadoFalseOrderByCriadoEmAsc();
}
