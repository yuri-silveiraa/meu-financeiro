# Plano: Testes Jest + E2E (Playwright) + Fixes Críticos

## Contexto

O projeto não tem nenhum teste. O usuário pediu:
1. Jest para testes unitários/integração
2. Playwright para testes E2E

**Também existem 2 bugs críticos que impedem o app de funcionar** (encontrados na auditoria):
- `bot.js:364` — rota duplicada e nunca fechada (backend não inicia)
- `api.js:1` — `API_BASE` fallback aponta para `localhost:3001` (frontend quebra em produção)

---

## Fase 0 — Fixes Críticos (antes de tudo)

### Fix 1: bot.js syntax error
**Arquivo:** `packages/backend/src/routes/bot.js`
**Problema:** Linhas 363-364 são uma cópia duplicada e quebrada de `router.get('/users-with-whatsapp')`. Precisa deletar as linhas 363-364.
**Ação:** Deletar as 2 linhas duplicadas.

### Fix 2: api.js API_BASE fallback
**Arquivo:** `packages/frontend/src/services/api.js:1`
**Problema:** `const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'` — quando `VITE_API_URL=""`, o fallback é `localhost:3001`.
**Ação:** Mudar para `const API_BASE = import.meta.env.VITE_API_URL || ''` (string vazia = same-origin).

---

## Fase 1 — Infraestrutura de Testes

### 1.1 Refatorar index.js para testabilidade
**Arquivo:** `packages/backend/src/index.js`
**Ação:** Extrair criação do Express app para `app.js`:

- `packages/backend/src/app.js` — exporta `createApp()` que retorna Express app configurado (rotas, middleware, CORS) SEM `listen()` e SEM `initDatabase()`
- `packages/backend/src/index.js` — importa `createApp()`, roda `initDatabase()`, chama `app.listen()`

Isso permite testar rotas com supertest sem iniciar servidor ou banco real.

### 1.2 Docker Compose para testes
**Arquivo:** `docker-compose.test.yml` (novo)
- Postgres 16-alpine na porta 5433 (evitar conflito com dev 5432)
- Database `meu_financeiro_test`
- Healthcheck rápido (2s interval)
- Volume separado `pgdata-test`

### 1.3 Variáveis de ambiente para testes
**Arquivo:** `.env.test` (novo)
```
DATABASE_URL=postgresql://meu_financeiro_test:test_password@localhost:5433/meu_financeiro_test
JWT_SECRET=test-jwt-secret-for-ci-only
BOT_API_KEY=test-bot-api-key-for-ci-only
GOOGLE_CLIENT_ID=test-google-client-id
GOOGLE_CLIENT_SECRET=test-google-client-secret
NODE_ENV=test
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 1.4 Setup de teste do banco
**Arquivo:** `packages/backend/src/test/setup.js` (novo)
- Roda `schema.sql` contra o banco de teste
- Roda migrações
- Função `resetDatabase()` que TRUNCATE todas as tabelas entre testes
- Função `createTestUser()` que cria usuário fake e retorna JWT

### 1.5 Configuração Jest
**Arquivo:** `packages/backend/jest.config.js` (novo)
```js
export default {
  transform: {},  // ESM puro, sem transform
  testEnvironment: 'node',
  setupFilesAfterSetup: ['./src/test/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!src/test/**'],
};
```

**Nota:** Jest com ESM puro (`"type": "module"`) requer `--experimental-vm-modules` ou usar `NODE_OPTIONS='--experimental-vm-modules'`.

### 1.6 Configuração Playwright
**Arquivo:** `e2e/playwright.config.ts` (novo)
- Base URL: `http://localhost:5173` (frontend dev server)
- WebServer: `npm run dev:frontend` (inicia automaticamente)
- Projects: Chromium (principal), Firefox, WebKit
- Timeout: 30s por teste
- Retries: 1 em CI
- Screenshots: apenas em falha
- Trace: gravar em primeiro retry

### 1.7 Scripts nos package.json
**Arquivo:** `packages/backend/package.json` — adicionar:
```json
"scripts": {
  "test": "NODE_OPTIONS='--experimental-vm-modules' jest",
  "test:coverage": "NODE_OPTIONS='--experimental-vm-modules' jest --coverage"
}
```

**Arquivo:** `package.json` (root) — adicionar:
```json
"scripts": {
  "test": "npm run test -w packages/backend",
  "test:e2e": "cd e2e && npx playwright test",
  "test:e2e:ui": "cd e2e && npx playwright test --ui"
}
```

**Arquivo:** `e2e/package.json` (novo) — dependências E2E:
```json
{
  "name": "e2e",
  "private": true,
  "devDependencies": {
    "@playwright/test": "^1.49.0"
  }
}
```

---

## Fase 2 — Testes Unitários Backend (Jest)

### 2.1 validate.js (pure functions — sem DB)
**Arquivo:** `packages/backend/src/middleware/__tests__/validate.test.js`

| Suite | Testes |
|-------|--------|
| `validateRequired` | null, undefined, empty string, whitespace, valid string |
| `validateString` | min/max, tipo não-string, caracteres especiais |
| `validateNumber` | NaN, min, max, zero, negativos |
| `validateInteger` | floats, strings, valores positivos |
| `validateDate` | formato inválido, data impossível, formato válido |
| `validateEnum` | valor permitido, valor não permitido, null/undefined (deve passar) |

### 2.2 auth.js middleware
**Arquivo:** `packages/backend/src/middleware/__tests__/auth.test.js`

| Suite | Testes |
|-------|--------|
| Token ausente | Retorna 401 |
| Token inválido | Retorna 401 |
| Token expirado | Retorna 401 |
| Token válido | Passa req.userId, chama next() |

### 2.3 Rotas de categorias (integração)
**Arquivo:** `packages/backend/src/routes/__tests__/categorias.test.js`

| Suite | Testes |
|-------|--------|
| GET / | Retorna categorias do usuário |
| POST / | Cria categoria, valida nome obrigatório |
| PUT /:id | Atualiza, retorna 404 se não existe |
| DELETE /:id | Deleta, limpa FK em transações/metas/gastos_fixos |

### 2.4 Rotas de contas (integração)
**Arquivo:** `packages/backend/src/routes/__tests__/contas.test.js`

| Suite | Testes |
|-------|--------|
| GET / | Retorna contas do usuário |
| POST / | Cria conta |
| PUT /:id | Atualiza |
| DELETE /:id | Deleta com transaction, limpa FK |

### 2.5 Rotas de transações (integração)
**Arquivo:** `packages/backend/src/routes/__tests__/transacoes.test.js`

| Suite | Testes |
|-------|--------|
| GET / | Retorna transações, filtros por data/tipo/pago |
| GET / | Limita a 500 resultados |
| POST / | Cria transação com validação completa |
| PUT /:id | Atualiza |
| DELETE /:id | Deleta |
| PATCH /:id/pago | Toggle pago |

### 2.6 Rotas de gastos fixos (integração)
**Arquivo:** `packages/backend/src/routes/__tests__/gastosFixos.test.js`

| Suite | Testes |
|-------|--------|
| POST / | Cria gasto fixo + gera transações do mês corrente |
| POST / | lastDayOfMonth: dia 31 em fev → 28/29 |
| POST / | Respeita total_parcelas |
| PUT /:id | Atualiza valores em transações não pagas |
| DELETE /:id | Soft delete (ativo=FALSE) |

### 2.7 Rotas de estatísticas (integração)
**Arquivo:** `packages/backend/src/routes/__tests__/estatisticas.test.js`

| Suite | Testes |
|-------|--------|
| GET / | Retorna 400 sem mes/ano |
| GET /?mes=13&ano=2026 | Retorna 400 |
| GET /?mes=1&ano=2026 | Retorna stats corretas |

### 2.8 Rotas de bot/whatsapp (integração)
**Arquivo:** `packages/backend/src/routes/__tests__/bot.test.js`

| Suite | Testes |
|-------|--------|
| POST /vincular (bot) | Requer API key |
| POST /vincular (whatsapp) | Requer JWT |
| GET /verificar-codigo | Código válido/inválido/expirado |
| POST /confirmar-vinculacao | Ownership check (userId != pending.userId → 403) |
| GET /users-with-whatsapp | Retorna apenas users com phone vinculado |

---

## Fase 3 — Testes Unitários Frontend (Jest/Vitest)

**Nota:** O frontend já tem Vitest configurado. Usar Vitest (não Jest) para o frontend por ser mais compatível com ESM + React.

### 3.1 currency.js
**Arquivo:** `packages/frontend/src/utils/__tests__/currency.test.js`

| Suite | Testes |
|-------|--------|
| formatCurrency | valores positivos, zero, negativos, centavos |
| parseCurrency | formato BRL, sem formatação, valores inválidos |

### 3.2 validation.js
**Arquivo:** `packages/frontend/src/utils/__tests__/validation.test.js`

| Suite | Testes |
|-------|--------|
| validateTransacao | Form completo válido, campos obrigatórios faltando, tipo_pagamento condicional |
| validateRequired | null, undefined, string vazia, whitespace, válido |
| validateMinValue | Abaixo do mínimo, no mínimo, acima, null (passa) |

---

## Fase 4 — Testes E2E (Playwright)

### 4.1 Fixture de autenticação
**Arquivo:** `e2e/fixtures/auth.fixture.ts`
- Bypass do Google OAuth: mockar resposta do backend `/auth/google`
- Criar usuário de teste no banco antes dos testes
- Login automático antes de cada teste E2E

### 4.2 Testes de autenticação
**Arquivo:** `e2e/tests/auth.spec.ts`

| Cenário | Prioridade |
|---------|-----------|
| Usuário não autenticado é redirecionado para /login | P0 |
| Página de login mostra botão Google | P0 |
| Login armazena token e redireciona para / | P0 |
| Logout limpa sessão e redireciona para /login | P0 |
| Token expirado → 401 → redirect /login | P1 |

### 4.3 Testes de navegação
**Arquivo:** `e2e/tests/navigation.spec.ts`

| Cenário | Prioridade |
|---------|-----------|
| Sidebar navega para todas as páginas | P0 |
| Rota desconhecida redireciona para / | P1 |

### 4.4 Testes de categorias (via Configurações)
**Arquivo:** `e2e/tests/categorias.spec.ts`

| Cenário | Prioridade |
|---------|-----------|
| Lista categorias padrão | P0 |
| Criar nova categoria | P0 |
| Editar categoria | P0 |
| Deletar categoria com confirmação | P0 |

### 4.5 Testes de contas (via Configurações)
**Arquivo:** `e2e/tests/contas.spec.ts`

| Cenário | Prioridade |
|---------|-----------|
| Criar conta bancária | P0 |
| Editar conta | P0 |
| Deletar conta | P0 |

### 4.6 Testes de transações
**Arquivo:** `e2e/tests/transacoes.spec.ts`

| Cenário | Prioridade |
|---------|-----------|
| Listar transações | P0 |
| Criar transação | P0 |
| Editar transação | P0 |
| Deletar transação | P0 |
| Toggle pago | P1 |

### 4.7 Testes de gastos fixos
**Arquivo:** `e2e/tests/gastosfixos.spec.ts`

| Cenário | Prioridade |
|---------|-----------|
| Criar gasto fixo com parcelas | P0 |
| Editar gasto fixo | P1 |
| Deletar (soft delete) | P1 |

### 4.8 Testes de WhatsApp vinculação
**Arquivo:** `e2e/tests/whatsapp.spec.ts`

| Cenário | Prioridade |
|---------|-----------|
| Gerar código de vinculação | P0 |
| Código aparece no alerta | P0 |

---

## Fase 5 — CI/CD (opcional)

### 5.1 GitHub Actions workflow
**Arquivo:** `.github/workflows/test.yml` (novo)

```yaml
jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: meu_financeiro_test
          POSTGRES_USER: meu_financeiro_test
          POSTGRES_PASSWORD: test_password
        ports: ['5433:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://meu_financeiro_test:test_password@localhost:5433/meu_financeiro_test
          JWT_SECRET: ci-test-secret
          BOT_API_KEY: ci-test-key

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Arquivos a Criar/Modificar (resumo)

### Novos (16 arquivos):
- `packages/backend/src/app.js`
- `packages/backend/jest.config.js`
- `packages/backend/src/test/setup.js`
- `packages/backend/src/middleware/__tests__/validate.test.js`
- `packages/backend/src/middleware/__tests__/auth.test.js`
- `packages/backend/src/routes/__tests__/categorias.test.js`
- `packages/backend/src/routes/__tests__/contas.test.js`
- `packages/backend/src/routes/__tests__/transacoes.test.js`
- `packages/backend/src/routes/__tests__/gastosFixos.test.js`
- `packages/backend/src/routes/__tests__/estatisticas.test.js`
- `packages/backend/src/routes/__tests__/bot.test.js`
- `packages/frontend/src/utils/__tests__/currency.test.js`
- `packages/frontend/src/utils/__tests__/validation.test.js`
- `e2e/playwright.config.ts`
- `e2e/package.json`
- `e2e/fixtures/auth.fixture.ts`
- `e2e/tests/*.spec.ts` (7 arquivos)
- `docker-compose.test.yml`
- `.env.test`

### Modificados (5 arquivos):
- `packages/backend/src/index.js` — extrair app para app.js
- `packages/backend/src/routes/bot.js` — deletar linhas 363-364
- `packages/frontend/src/services/api.js` — fix API_BASE fallback
- `packages/backend/package.json` — adicionar scripts + devDependencies
- `packages/frontend/package.json` — adicionar vitest devDependency
- `package.json` (root) — adicionar scripts de teste

---

## Ordem de Implementação

1. **Fix críticos** (bot.js + api.js)
2. **Refatoração index.js → app.js** (testabilidade)
3. **Infraestrutura** (jest.config, docker-compose.test, setup.js, .env.test)
4. **Testes unitários puros** (validate.js, currency.js, validation.js)
5. **Testes de middleware** (auth.js)
6. **Testes de integração** (categorias, contas, transacoes, gastosFixos, estatisticas, bot)
7. **Infraestrutura E2E** (playwright.config, fixtures)
8. **Testes E2E** (auth, navigation, CRUD pages)
9. **Scripts de teste** (package.json updates)
