package com.desafiotecnico.academico.eventos.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "outbox_eventos")
public class OutboxEvento {

    @Id
    private UUID id;

    @Column(name = "tipo_evento", nullable = false, length = 100)
    private String tipoEvento;

    @Column(name = "agregado", nullable = false, length = 100)
    private String agregado;

    @Column(name = "agregado_id", nullable = false, length = 100)
    private String agregadoId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private String payload;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "publicado", nullable = false)
    private boolean publicado;

    @Column(name = "publicado_em")
    private OffsetDateTime publicadoEm;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    public static OutboxEvento create(UUID id,
                                      String tipoEvento,
                                      String agregado,
                                      String agregadoId,
                                      String payload,
                                      String correlationId) {
        OutboxEvento evento = new OutboxEvento();
        evento.id = id;
        evento.tipoEvento = tipoEvento;
        evento.agregado = agregado;
        evento.agregadoId = agregadoId;
        evento.payload = payload;
        evento.correlationId = correlationId;
        evento.publicado = false;
        return evento;
    }

    @PrePersist
    public void prePersist() {
        if (criadoEm == null) {
            criadoEm = OffsetDateTime.now();
        }
    }

    public void marcarComoPublicado(OffsetDateTime publicadoEm) {
        this.publicado = true;
        this.publicadoEm = publicadoEm;
    }

    public UUID getId() {
        return id;
    }

    public String getTipoEvento() {
        return tipoEvento;
    }

    public String getAgregado() {
        return agregado;
    }

    public String getAgregadoId() {
        return agregadoId;
    }

    public String getPayload() {
        return payload;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public boolean isPublicado() {
        return publicado;
    }

    public OffsetDateTime getPublicadoEm() {
        return publicadoEm;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}
