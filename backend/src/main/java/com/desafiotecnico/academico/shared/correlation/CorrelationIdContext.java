package com.desafiotecnico.academico.shared.correlation;

public final class CorrelationIdContext {

    private static final ThreadLocal<String> HOLDER = new ThreadLocal<>();

    private CorrelationIdContext() {
    }

    public static void set(String correlationId) {
        HOLDER.set(correlationId);
    }

    public static String get() {
        return HOLDER.get();
    }

    public static void clear() {
        HOLDER.remove();
    }
}
