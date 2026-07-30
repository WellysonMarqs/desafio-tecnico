CREATE TABLE cursos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    CONSTRAINT uk_curso_codigo UNIQUE (codigo)
);

CREATE TABLE alunos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    matricula VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_aluno_email UNIQUE (email),
    CONSTRAINT uk_aluno_matricula UNIQUE (matricula)
);

CREATE TABLE disciplinas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    curso_id BIGINT NOT NULL,
    CONSTRAINT uk_disciplina_codigo UNIQUE (codigo),
    CONSTRAINT fk_disciplina_curso FOREIGN KEY (curso_id) REFERENCES cursos (id)
);

CREATE TABLE turmas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    disciplina_id BIGINT NOT NULL,
    capacidade INTEGER NOT NULL CHECK (capacidade > 0),
    vagas_disponiveis INTEGER NOT NULL CHECK (vagas_disponiveis >= 0),
    status VARCHAR(20) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_turma_codigo UNIQUE (codigo),
    CONSTRAINT fk_turma_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplinas (id),
    CONSTRAINT ck_turma_status CHECK (status IN ('ABERTA', 'FECHADA')),
    CONSTRAINT ck_turma_vagas_capacidade CHECK (vagas_disponiveis <= capacidade)
);
