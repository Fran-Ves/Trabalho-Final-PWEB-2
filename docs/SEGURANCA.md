# Segurança – requisitos OWASP ASVS 5.0.0

Os identificadores abaixo seguem o formato `v5.0.0-X.Y.Z` do ASVS 5.0.0 (conferidos no texto oficial do padrão). Foram escolhidos por fazerem sentido numa API REST com autenticação por token, papéis e dados por usuário.

| ASVS | Requisito (resumo) | Como foi atendido | Onde |
|---|---|---|---|
| **1.2.4** | Consultas ao banco parametrizadas, protegidas contra injeção | Todas as queries usam `?` com `better-sqlite3`; nenhuma concatenação de entrada em SQL. | `models/*.js` |
| **6.2.1** | Senhas com no mínimo 8 caracteres | Zod exige ≥ 8 caracteres em cadastro e criação de membro (o ASVS recomenda 15; o grupo adotou o mínimo de 8). | `validators/passwordRule.js` |
| **6.2.9** | Senhas de pelo menos 64 caracteres são aceitas | Limite máximo é 72 bytes, que é o que o bcrypt processa; assim senhas longas não são silenciosamente truncadas. Sem regras de composição. | `validators/passwordRule.js` |
| **6.3.1** | Controles contra força bruta e credential stuffing | `express-rate-limit` em `/api/auth` (10 falhas / 15 min por IP, por réplica) + `limit_req` no Nginx (compartilhado entre réplicas). Hash com bcrypt (custo 12); login com e-mail inexistente também executa um `bcrypt.compare` para igualar o tempo de resposta. Mensagem de erro genérica. | `middlewares/rateLimitMiddleware.js`, `services/authService.js`, `nginx/nginx.conf` |
| **8.2.1** | Acesso por função restrito a quem tem permissão explícita | `roleMiddleware(...papéis)` em todas as rotas protegidas; negar por padrão (sem token = 401, papel errado = 403). | `middlewares/roleMiddleware.js`, `routes/*.js` |
| **8.2.2** | Acesso a dados específicos restrito a quem tem permissão (evita IDOR/BOLA) | Membro só consulta o próprio treino e os próprios check-ins; trainer só edita treinos em que é o responsável; trainer não pode atribuir treino a outro treinador. | `services/workoutService.js`, `controllers/checkinController.js` |
| **9.1.2** | Só algoritmos de uma allowlist para criar/verificar tokens autocontidos | O JWT é assinado com `HS256` e verificado com `algorithms: ['HS256']`, recusando `none` e outros algoritmos (há teste automatizado). O servidor também recusa `JWT_SECRET` com menos de 32 caracteres. Expiração de 2 h. | `services/authService.js`, `middlewares/authMiddleware.js`, `server.js` |
| **16.2.1** | Cada entrada de log traz metadados (quando, onde, quem, o quê) | Log de requisições com data/hora, instância, método, URL, status, duração, IP e usuário; eventos de segurança em JSON com os mesmos campos. Senhas e tokens nunca são registrados. | `middlewares/loggerMiddleware.js`, `utils/securityLog.js` |
| **16.5.1** | Mensagem genérica em erros inesperados, sem expor detalhes internos | Erros 5xx retornam "Erro interno do servidor"; o stack trace fica só no log do servidor. JSON malformado também recebe mensagem padronizada (o texto do parser não vaza). | `middlewares/errorMiddleware.js` |

## Medidas adicionais

- **Sanitização e validação de entrada:** `sanitizeMiddleware` (remove tags HTML e caracteres de controle, bloqueia chaves de poluição de protótipo) seguido de validação Zod com tamanhos máximos.
- **Cabeçalhos de segurança:** `helmet` com CSP restritiva (`script-src 'self'`), `nosniff`, proteção contra clickjacking; `X-Powered-By` removido.
- **XSS no frontend:** conteúdo da API só entra no DOM por `textContent` (função `h()`), nunca `innerHTML` (há teste com HTML cru vindo do banco).
- **CORS restrito** e **limite de 10 kb** no corpo das requisições.
- **Eventos de segurança registrados:** `LOGIN_SUCCESS`, `LOGIN_FAILED`, `AUTH_TOKEN_MISSING/MALFORMED/INVALID`, `ROLE_DENIED`, `ACCESS_DENIED`, `RATE_LIMIT_EXCEEDED`.
- **Contêiner:** imagem final sem ferramentas de build, executa como usuário não-root.
- **Segredos:** `.env` fora do repositório (`.gitignore`); `.env.example` sem valores reais.

## Limitações assumidas

- O rate limit da aplicação é em memória e por réplica (o do Nginx cobre o conjunto).
- O token JWT não pode ser revogado antes de expirar (sem lista de revogação).
- O tráfego local roda em HTTP; em produção o TLS seria terminado no Nginx ou na plataforma.
- Não há troca de senha, recuperação de conta nem MFA.
