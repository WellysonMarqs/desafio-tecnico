CREATE TABLE auditoria_eventos_matricula (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    matricula_id BIGINT NOT NULL,
    aluno_id BIGINT NOT NULL,
    turma_id BIGINT NOT NULL,
    status_matricula VARCHAR(20) NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    recebido_em TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_auditoria_evento_event_id UNIQUE (event_id)
);

ALTER TABLE outbox_eventos
    ADD COLUMN IF NOT EXISTS publicado_em TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_publicado_criado_em ON outbox_eventos (publicado, criado_em);
CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_matricula_matricula_id ON auditoria_eventos_matricula (matricula_id);
