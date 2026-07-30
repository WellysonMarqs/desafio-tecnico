CREATE TABLE IF NOT EXISTS outbox_eventos (
    id UUID PRIMARY KEY,
    tipo_evento VARCHAR(100) NOT NULL,
    agregado VARCHAR(100) NOT NULL,
    agregado_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    publicado BOOLEAN NOT NULL DEFAULT FALSE,
    publicado_em TIMESTAMP WITH TIME ZONE NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_publicado_criado_em ON outbox_eventos (publicado, criado_em);
