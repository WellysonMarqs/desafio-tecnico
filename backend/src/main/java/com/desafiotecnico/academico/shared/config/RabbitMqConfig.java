package com.desafiotecnico.academico.shared.config;

import com.desafiotecnico.academico.eventos.infrastructure.amqp.RabbitMqTopology;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Bean
    public DirectExchange matriculaExchange() {
        return new DirectExchange(RabbitMqTopology.MATRICULA_EXCHANGE, true, false);
    }

    @Bean
    public Queue auditoriaQueue() {
        return QueueBuilder.durable(RabbitMqTopology.AUDITORIA_QUEUE)
                .withArgument("x-dead-letter-exchange", "")
                .withArgument("x-dead-letter-routing-key", RabbitMqTopology.AUDITORIA_DLQ)
                .build();
    }

    @Bean
    public Queue auditoriaDlq() {
        return QueueBuilder.durable(RabbitMqTopology.AUDITORIA_DLQ).build();
    }

    @Bean
    public Binding auditoriaCriadaBinding(DirectExchange matriculaExchange, Queue auditoriaQueue) {
        return BindingBuilder.bind(auditoriaQueue).to(matriculaExchange).with(RabbitMqTopology.ROUTING_KEY_CRIADA);
    }

    @Bean
    public Binding auditoriaConfirmadaBinding(DirectExchange matriculaExchange, Queue auditoriaQueue) {
        return BindingBuilder.bind(auditoriaQueue).to(matriculaExchange).with(RabbitMqTopology.ROUTING_KEY_CONFIRMADA);
    }

    @Bean
    public Binding auditoriaCanceladaBinding(DirectExchange matriculaExchange, Queue auditoriaQueue) {
        return BindingBuilder.bind(auditoriaQueue).to(matriculaExchange).with(RabbitMqTopology.ROUTING_KEY_CANCELADA);
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
