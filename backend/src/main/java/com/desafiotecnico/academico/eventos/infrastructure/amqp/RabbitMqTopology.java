package com.desafiotecnico.academico.eventos.infrastructure.amqp;

public final class RabbitMqTopology {

    public static final String MATRICULA_EXCHANGE = "academico.matriculas.exchange";
    public static final String AUDITORIA_QUEUE = "auditoria.matriculas.queue";
    public static final String AUDITORIA_DLQ = "auditoria.matriculas.dlq";
    public static final String ROUTING_KEY_CRIADA = "matricula.criada";
    public static final String ROUTING_KEY_CONFIRMADA = "matricula.confirmada";
    public static final String ROUTING_KEY_CANCELADA = "matricula.cancelada";

    private RabbitMqTopology() {
    }
}
