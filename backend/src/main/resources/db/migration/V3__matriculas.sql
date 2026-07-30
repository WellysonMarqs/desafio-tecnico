CREATE TABLE matriculas (
    id BIGSERIAL PRIMARY KEY,
    aluno_id BIGINT NOT NULL,
    turma_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    criada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmada_em TIMESTAMP WITH TIME ZONE NULL,
    cancelada_em TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT fk_matricula_aluno FOREIGN KEY (aluno_id) REFERENCES alunos (id),
    CONSTRAINT fk_matricula_turma FOREIGN KEY (turma_id) REFERENCES turmas (id),
    CONSTRAINT uk_matricula_aluno_turma UNIQUE (aluno_id, turma_id),
    CONSTRAINT ck_matricula_status CHECK (status IN ('PENDENTE', 'CONFIRMADA', 'CANCELADA'))
);

CREATE INDEX idx_matriculas_aluno_id ON matriculas (aluno_id);
CREATE INDEX idx_matriculas_turma_id ON matriculas (turma_id);
