package com.desafiotecnico.academico.eventos.infrastructure.amqp;

import com.desafiotecnico.academico.auditoria.application.service.AuditoriaMatriculaService;
import com.desafiotecnico.academico.eventos.application.dto.MatriculaEventoMessage;
import com.desafiotecnico.academico.shared.correlation.CorrelationIdContext;
import org.slf4j.MDC;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
public class MatriculaAuditoriaConsumer {

    private final AuditoriaMatriculaService auditoriaMatriculaService;

    public MatriculaAuditoriaConsumer(AuditoriaMatriculaService auditoriaMatriculaService) {
        this.auditoriaMatriculaService = auditoriaMatriculaService;
    }

    @RabbitListener(queues = RabbitMqTopology.AUDITORIA_QUEUE)
    public void handle(@Payload MatriculaEventoMessage message) {
        CorrelationIdContext.set(message.correlationId());
        MDC.put("correlationId", message.correlationId());
        try {
            auditoriaMatriculaService.registrarSeNovo(message);
        } finally {
            MDC.remove("correlationId");
            CorrelationIdContext.clear();
        }
    }
}
