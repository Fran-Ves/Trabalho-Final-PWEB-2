# Academia API – Trabalho Final de Programação para a Web II

API RESTful para gestão de uma academia: autenticação com três papéis (`admin`, `trainer`, `member`), cadastro de membros e treinos, check-ins de frequência e um painel web simples para visualizar tudo.

**Grupo:** Naiana e Francisco das Chagas  
**Stack:** Node.js 22, Express 5, SQLite (better-sqlite3), JWT, Zod, Docker Compose + Nginx.  

Documentação detalhada: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) (arquitetura, pipeline de middlewares, persistência, cache, load balancing) e [`docs/SEGURANCA.md`](docs/SEGURANCA.md) (mapeamento ASVS 5.0).

## Executando localmente (sem Docker)

Requisitos: Node.js 22 ou superior.

```bash
npm install
cp .env.example .env          # edite o JWT_SECRET (mínimo 32 caracteres)
npm run seed:demo             # (opcional) cria admin, trainer, aluno e um treino de exemplo
npm start                     # http://localhost:3000
```

Abra `http://localhost:3000` para o painel web. A API fica em `/api`.

Usuários criados pelo `seed:demo` (senha **Academia@123**, apenas para demonstração):

| Papel | E-mail |
|---|---|
| admin | admin@academia.com |
| trainer | trainer@academia.com |
| member | aluno@academia.com |

Para criar um administrador ou treinador real, defina `STAFF_EMAIL`, `STAFF_PASSWORD` e `STAFF_ROLE` no `.env` e rode `npm run create:staff`.

## Executando com Docker (3 réplicas + load balancer)

```bash
cp .env.example .env          # edite o JWT_SECRET
docker compose up --build     # painel e API em http://localhost:8080
docker compose exec api1 npm run seed:demo    # dados de demonstração
```

Para ver o balanceamento, repita a chamada e observe o campo `instance` mudar entre `api1`, `api2` e `api3`:

```bash
for i in 1 2 3 4 5 6; do curl -s localhost:8080/health; echo; done
```

O painel web mostra na faixa amarela inferior qual réplica atendeu a última requisição e se a lista de treinos veio do cache (`HIT`) ou do banco (`MISS`).

## Endpoints

| Método | Endpoint | Funcionalidade | Permissão |
|---|---|---|---|
| POST | `/api/auth/register` | Cadastro público de aluno | Público |
| POST | `/api/auth/login` | Login (retorna JWT de 2 h) | Público |
| POST | `/api/members` | Cadastrar membro | Admin |
| GET | `/api/members` | Listar membros | Admin, Trainer |
| GET | `/api/members/:id` | Consultar membro | Admin, Trainer |
| GET | `/api/members/me` | Perfil do membro logado (extra) | Member |
| POST | `/api/workouts` | Cadastrar treino | Admin, Trainer |
| GET | `/api/workouts` | Listar treinos (com cache) | Admin, Trainer |
| GET | `/api/workouts/:id` | Consultar treino | Admin, Trainer, Member dono do treino |
| GET | `/api/workouts/mine` | Treinos do membro logado (extra) | Member |
| PUT | `/api/workouts/:id` | Atualizar treino | Admin, Trainer responsável |
| DELETE | `/api/workouts/:id` | Excluir treino | Admin |
| POST | `/api/checkins` | Registrar check-in próprio | Member |
| GET | `/api/checkins` | Listar todos os check-ins | Admin, Trainer |
| GET | `/api/checkins/:memberId` | Check-ins de um membro | Admin, Trainer, Member (só o próprio) |
| GET | `/health` | Verificação de saúde e identificação da réplica | Público |

Enviar o token em `Authorization: Bearer <token>`. Erros seguem sempre o formato `{ "error": "mensagem" }` (validação inclui também `details`).

## Testes

```bash
npm test
```

Testes de integração (`node:test`) com banco temporário: permissões de todos os endpoints, autorização por objeto, cache (MISS/HIT/invalidação), sanitização, migrações, cabeçalhos de segurança e tratamento de erros.

## Variáveis de ambiente

Veja o [`.env.example`](.env.example). As principais: `JWT_SECRET` (obrigatória, ≥ 32 caracteres), `CACHE_TTL_SECONDS`, `AUTH_RATE_LIMIT_MAX`, `CORS_ORIGIN`, `TRUST_PROXY`, `DB_PATH`.

## Deploy / CI

O workflow `.github/workflows/ci.yml` executa os testes, valida o `docker-compose.yml`, faz o build da imagem e, em push na `main`, publica a imagem no GitHub Container Registry. O ambiente é reproduzível com `docker compose up --build`.

## Estrutura

```
app.js · server.js          montagem do pipeline e inicialização
config/                     conexão com o banco
migrations/                 migrações versionadas (schema_migrations)
routes/ controllers/ services/ models/ validators/
middlewares/                auth, role, validação, sanitização, rate limit, logger, erros
utils/                      cache TTL, log de segurança, id da instância
public/                     painel web (HTML, CSS e JS puros)
nginx/ Dockerfile docker-compose.yml
tests/ docs/ scripts/
```
