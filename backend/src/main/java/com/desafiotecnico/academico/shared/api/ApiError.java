package com.desafiotecnico.academico.shared.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        OffsetDateTime timestamp,
        int status,
        String code,
        String message,
        String path,
        String correlationId
) {
}
