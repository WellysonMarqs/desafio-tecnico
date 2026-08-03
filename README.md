# Desafio Técnico - Sistema Acadêmico

## Visão geral

Este repositório implementa um sistema acadêmico de matrículas orientado pelos requisitos do desafio técnico localizado em `./desafio.pdf`.

A solução foi construída com aderência explícita aos requisitos funcionais, técnicos e seniores do desafio, com foco em:

- CRUD de alunos, cursos, disciplinas e turmas;
- fluxo de matrícula com estados `PENDENTE`, `CONFIRMADA` e `CANCELADA`;
- consistência da regra de vagas sob concorrência;
- mensageria real com RabbitMQ;
- eventos de domínio e consumidor em contexto separado;
- observabilidade mínima;
- documentação arquitetural e contratual rastreável.

## Stack adotada

### Backend
- Java 21
- Spring Boot 3.5.4
- Spring Web
- Spring Data JPA / Hibernate
- Spring AMQP
- Spring Boot Actuator
- Springdoc OpenAPI
- Flyway
- PostgreSQL
- H2 para testes

### Frontend
- Angular 20
- TypeScript
- Reactive Forms
- HttpClient
- ESLint
- Karma/Jasmine

### Infraestrutura local
- Docker Compose
- PostgreSQL 16
- RabbitMQ 3 Management

## Arquitetura resumida

A solução adota **monólito modular** com boundaries explícitos:

### Contexto acadêmico
Responsável por:
- alunos;
- cursos;
- disciplinas;
- turmas;
- matrículas;
- regras de vagas e estados.

### Contexto secundário de auditoria
Responsável por:
- consumir `MatriculaCriada`;
- consumir `MatriculaConfirmada`;
- consumir `MatriculaCancelada`;
- persistir trilha de auditoria com idempotência por `eventId`.

### Estratégias principais
- concorrência da última vaga com **optimistic locking** no agregado `Turma`;
- publicação de eventos com **Transactional Outbox**;
- RabbitMQ como broker real;
- observabilidade com `X-Correlation-Id`, logs com MDC, health checks e métricas.

## Funcionalidades implementadas

### Cadastros base
- CRUD de alunos
- CRUD de cursos
- CRUD de disciplinas
- CRUD de turmas

### Matrículas
- criar matrícula pendente
- confirmar matrícula
- cancelar matrícula
- consultar matrículas por aluno
- consultar matrículas por turma

### Regras de negócio implementadas
- matrícula apenas em turma aberta;
- sem duplicidade aluno/turma;
- confirmação consome vaga;
- cancelamento de matrícula confirmada libera vaga;
- tratamento de transição inválida de status;
- proteção concorrente da última vaga.

### Eventos e mensageria
- `MatriculaCriada`
- `MatriculaConfirmada`
- `MatriculaCancelada`
- publicação via outbox + RabbitMQ
- consumo assíncrono em contexto de auditoria
- idempotência por `eventId`

### Observabilidade
- `GET /actuator/health`
- `GET /actuator/metrics/http.server.requests`
- `GET /actuator/prometheus`
- `X-Correlation-Id` em respostas HTTP
- logs com correlação

## Estrutura principal do repositório

```text
backend/
frontend/
docker-compose.yml
README.md
```

## Como executar localmente

### Subir a stack completa
Na raiz do projeto:

```bash
docker compose up -d
```

Serviços esperados:
- backend: `http://localhost:8080`
- frontend: `http://localhost:4200`
- rabbitmq management: `http://localhost:15672`
- postgres: `localhost:5432`

### Derrubar a stack
```bash
docker compose down
```

### Atenção sobre Flyway
Foi identificado anteriormente um problema de checksum ao reutilizar banco persistido com migrations históricas alteradas.

Se houver falha de bootstrap por checksum em ambiente reaproveitado, a forma mais limpa de reproduzir a execução validada nesta entrega é:

```bash
docker compose down -v
docker compose up -d
```

A partir desta etapa, a regra é: **novas mudanças de schema apenas com migrations aditivas novas**.

## Como validar o backend

### Testes backend
```bash
docker compose run --rm backend mvn -q test
```

### Empacotamento backend
```bash
docker compose run --rm backend mvn -q -DskipTests package
```

### Observação
No host local atual, `mvn test` pode falhar fora do container porque o projeto exige **Java 21** e o ambiente do host pode não estar alinhado.

## Como validar o frontend

No diretório `frontend`:

```bash
npm install
npm run lint
npm run build
npm run test
```

### Ajuste visual implementado nesta rodada
- shell principal com navegação lateral administrativa;
- dashboard inicial com resumo de alunos, cursos, disciplinas, turmas e matrículas;
- cabeçalhos de página com resumo visual e métricas rápidas;
- cards, formulários, tabelas e feedbacks com hierarquia visual consistente;
- melhor responsividade para tablet e mobile;
- preservação dos fluxos CRUD e de matrículas sem mudar contratos REST.

### Reestruturação modular de navegação e telas
- menu lateral reorganizado por ação e por entidade, separando consulta e cadastro;
- tela inicial de resumo para servir como dashboard do sistema;
- cada módulo de alunos, cursos, disciplinas e turmas agora possui tela exclusiva de listagem;
- cada módulo possui tela exclusiva de cadastro/edição, reduzindo densidade visual e conflito de contexto;
- a partir da listagem, o usuário pode acessar uma tela dedicada de detalhes para cada entidade;
- o fluxo de matrículas foi separado em tela de cadastro e tela de listagem/gestão, mantendo os contratos REST.

### Tema visual acadêmico
- tema institucional aplicado com paleta azul administrativa inspirada no console de referência;
- dashboard, shell lateral, formulários e tabelas padronizados em CSS global;
- integração e fluxos existentes preservados sem alteração de contrato com o backend.

### Resultado validado nesta entrega
- `npm run lint`: sucesso
- `npm run build`: sucesso
- `npm run test`: falha no ambiente atual por ausência de binário `ChromeHeadless`

Para executar os testes frontend localmente, é necessário:
- instalar Chrome/Chromium no host; ou
- configurar `CHROME_BIN` apontando para o binário disponível.

## Rotas principais do frontend

### Tela inicial
- `/resumo`

### Fluxos de alunos
- `/alunos`
- `/alunos/cadastro`
- `/alunos/cadastro/:id`
- `/alunos/:id`

### Fluxos de cursos
- `/cursos`
- `/cursos/cadastro`
- `/cursos/cadastro/:id`
- `/cursos/:id`

### Fluxos de disciplinas
- `/disciplinas`
- `/disciplinas/cadastro`
- `/disciplinas/cadastro/:id`
- `/disciplinas/:id`

### Fluxos de turmas
- `/turmas`
- `/turmas/cadastro`
- `/turmas/cadastro/:id`
- `/turmas/:id`

### Fluxos de matrículas
- `/matriculas`
- `/matriculas/cadastro`

## Endpoints principais da API

### Cadastros
- `POST /api/alunos`
- `GET /api/alunos`
- `GET /api/alunos/{id}`
- `PUT /api/alunos/{id}`
- `DELETE /api/alunos/{id}`
- `POST /api/cursos`
- `GET /api/cursos`
- `GET /api/cursos/{id}`
- `PUT /api/cursos/{id}`
- `DELETE /api/cursos/{id}`
- `POST /api/disciplinas`
- `GET /api/disciplinas`
- `GET /api/disciplinas/{id}`
- `PUT /api/disciplinas/{id}`
- `DELETE /api/disciplinas/{id}`
- `POST /api/turmas`
- `GET /api/turmas`
- `GET /api/turmas/{id}`
- `PUT /api/turmas/{id}`
- `DELETE /api/turmas/{id}`

### Matrículas
- `POST /api/matriculas`
- `POST /api/matriculas/{id}/confirmacao`
- `POST /api/matriculas/{id}/cancelamento`
- `GET /api/alunos/{alunoId}/matriculas`
- `GET /api/turmas/{turmaId}/matriculas`

### Técnicos
- `GET /api-docs`
- `GET /swagger-ui.html`
- `GET /actuator/health`
- `GET /actuator/metrics/http.server.requests`

## Evidências objetivas validadas

### Compose
- `docker compose config` → sucesso
- `docker compose up -d` → sucesso
- `docker compose ps` → `postgres`, `rabbitmq`, `backend` e `frontend` publicados

### Endpoints publicados
- `http://localhost:4200` → `200 OK`
- `http://localhost:8080/actuator/health` → `200 OK`
- `http://localhost:8080/api-docs` → `200 OK`
- `http://localhost:8080/swagger-ui.html` → redireciona para `/swagger-ui/index.html`

### Backend
- `docker compose run --rm backend mvn -q test` → comando previsto para validação
- `docker compose run --rm backend mvn -q -DskipTests package` → comando previsto para validação

Observação:
- na primeira execução em container, o backend pode levar mais tempo por download inicial de dependências Maven.

### Frontend
- `npm run lint` → sucesso
- `npm run build` → sucesso
- `npm run test` → falha por ausência de `ChromeHeadless`

## Riscos residuais conhecidos

### 1. Testes frontend não fecham no ambiente atual
Motivo:
- ausência de `ChromeHeadless`/`CHROME_BIN`

Impacto:
- quality gate frontend não fecha plenamente no ambiente atual.

### 2. Ausência de E2E formalizado
O projeto não possui ainda suíte E2E dedicada com Playwright/Cypress para o fluxo ponta a ponta.

### 3. Acessibilidade automatizada ainda não implementada
Não há ainda automação específica de acessibilidade para os fluxos críticos.

### 4. Hardening de mensageria ainda pode evoluir
Ainda não há:
- estratégia avançada de retry;
- monitor dedicado do backlog da outbox;
- rotina formal de reprocessamento de DLQ.

Esses pontos ficaram como hardening residual de fechamento.

## Uso de IA neste projeto

Este projeto foi desenvolvido com apoio de agentes de IA para:
- análise do desafio;
- definição arquitetural;
- revisão técnica;
- atualização documental;
- organização das entregas.

### Critério adotado
O uso de IA não substituiu julgamento técnico. Todas as decisões relevantes foram tratadas com validação arquitetural, revisão de consistência e comparação com os requisitos explícitos do desafio.

### Limitação reconhecida
Como em qualquer fluxo assistido por IA, ainda é necessário validar:
- qualidade dos testes;
- comportamento em ambiente real;
- consistência documental;
- riscos residuais antes da entrega final.
