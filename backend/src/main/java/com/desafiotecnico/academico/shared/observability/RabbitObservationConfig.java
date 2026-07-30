package com.desafiotecnico.academico.shared.observability;

import io.micrometer.common.KeyValue;
import io.micrometer.common.KeyValues;
import io.micrometer.observation.Observation;
import org.springframework.amqp.rabbit.support.micrometer.RabbitListenerObservationConvention;
import org.springframework.amqp.rabbit.support.micrometer.RabbitMessageReceiverContext;
import org.springframework.amqp.rabbit.support.micrometer.RabbitMessageSenderContext;
import org.springframework.amqp.rabbit.support.micrometer.RabbitTemplateObservationConvention;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitObservationConfig {

    @Bean
    RabbitTemplateObservationConvention rabbitTemplateObservationConvention() {
        return new RabbitTemplateObservationConvention() {
            @Override
            public boolean supportsContext(Observation.Context context) {
                return context instanceof RabbitMessageSenderContext;
            }

            @Override
            public String getName() {
                return "academico.rabbit.publish";
            }

            @Override
            public String getContextualName(RabbitMessageSenderContext context) {
                return "rabbit publish " + context.getExchange();
            }

            @Override
            public KeyValues getLowCardinalityKeyValues(RabbitMessageSenderContext context) {
                return KeyValues.of(
                        KeyValue.of("exchange", String.valueOf(context.getExchange())),
                        KeyValue.of("routingKey", String.valueOf(context.getRoutingKey()))
                );
            }
        };
    }

    @Bean
    RabbitListenerObservationConvention rabbitListenerObservationConvention() {
        return new RabbitListenerObservationConvention() {
            @Override
            public boolean supportsContext(Observation.Context context) {
                return context instanceof RabbitMessageReceiverContext;
            }

            @Override
            public String getName() {
                return "academico.rabbit.consume";
            }

            @Override
            public String getContextualName(RabbitMessageReceiverContext context) {
                return "rabbit consume " + context.getSource();
            }

            @Override
            public KeyValues getLowCardinalityKeyValues(RabbitMessageReceiverContext context) {
                return KeyValues.of(KeyValue.of("queue", String.valueOf(context.getSource())));
            }
        };
    }
}
