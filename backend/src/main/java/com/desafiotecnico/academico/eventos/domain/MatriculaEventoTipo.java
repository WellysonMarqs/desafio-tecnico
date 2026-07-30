package com.desafiotecnico.academico.eventos.domain;

public enum MatriculaEventoTipo {
    MATRICULA_CRIADA("MatriculaCriada"),
    MATRICULA_CONFIRMADA("MatriculaConfirmada"),
    MATRICULA_CANCELADA("MatriculaCancelada");

    private final String valorContrato;

    MatriculaEventoTipo(String valorContrato) {
        this.valorContrato = valorContrato;
    }

    public String getValorContrato() {
        return valorContrato;
    }
}
