package com.desafiotecnico.academico.eventos.infrastructure.amqp;

import com.desafiotecnico.academico.eventos.application.dto.MatriculaEventoMessage;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class MatriculaRabbitPublisher {

    private final RabbitTemplate rabbitTemplate;

    public MatriculaRabbitPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(MatriculaEventoMessage message) {
        rabbitTemplate.convertAndSend(
                RabbitMqTopology.MATRICULA_EXCHANGE,
                routingKeyFor(message.eventType()),
                message,
                rabbitMessage -> {
                    rabbitMessage.getMessageProperties().setMessageId(message.eventId().toString());
                    rabbitMessage.getMessageProperties().setCorrelationId(message.correlationId());
                    rabbitMessage.getMessageProperties().setHeader("eventType", message.eventType());
                    rabbitMessage.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                    return rabbitMessage;
                }
        );
    }

    private String routingKeyFor(String eventType) {
        return switch (eventType) {
            case "MatriculaCriada" -> RabbitMqTopology.ROUTING_KEY_CRIADA;
            case "MatriculaConfirmada" -> RabbitMqTopology.ROUTING_KEY_CONFIRMADA;
            case "MatriculaCancelada" -> RabbitMqTopology.ROUTING_KEY_CANCELADA;
            default -> throw new IllegalArgumentException("Tipo de evento nao suportado para publicacao: " + eventType);
        };
    }
}
