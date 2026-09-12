# Meu Financeiro

Aplicativo web de gerenciamento de finanças pessoais, desenvolvido com **React**, **Node.js**, **Express** e **PostgreSQL**.

---

## Funcionalidades

### Dashboard
- Resumo mensal: receitas, despesas, despesas não pagas e saldo projetado
- Seletor de mês/ano para navegar entre períodos
- Gráfico de pizza: gastos por categoria
- Gráfico de barras: gastos por tipo de pagamento (débito, crédito, pix, etc.)
- Gráfico de barras horizontal: previsão de gastos mensais por categoria

### Transações
- Cadastro completo de receitas e despesas
- Filtros por período, tipo, status (pago/aberto), categoria e conta
- Coluna de toggle para marcar como pago/aberto diretamente na tabela
- Seleção múltipla com ações em lote (marcar pagas, marcar abertas, excluir)
- Importação de extratos bancários via **CSV** (com auto-detecção de colunas e categorias)
- Validação de formulário com mensagens de erro
- Estados de carregamento e tratamento de erros

### Gastos Fixos
- Cadastro de despesas recorrentes mensais (aluguel, internet, streaming, etc.)
- Geração automática de transações não pagas para os meses restantes do ano
- Ao editar, atualiza automaticamente as transações vinculadas
- Resumo: total mensal, quantidade, próximo vencimento

### Relatórios
- Visão anual com totais de receitas, despesas e saldo
- Gráfico de barras: receitas vs despesas por mês
- Gráfico de linha: evolução do saldo mensal
- Ranking de despesas por categoria

### Metas de Economia
- Cards com barra de progresso (%)
- Valor atual vs valor da meta
- Prazo e categoria vinculada (opcional)
- Progresso fica verde ao atingir 100%

### Configurações
- Gerenciamento de categorias com cores personalizáveis
- Gerenciamento de contas bancárias (nome, banco, tipo, saldo inicial)
- Documentação de formato para importação CSV

### Autenticação
- Login com Google (OAuth 2.0)
- Multi-usuário: cada usuário tem seus próprios dados isolados
- Tokens JWT para autenticação na API

---

## Arquitetura

```
meu-financeiro/
├── packages/
│   ├── frontend/              # React + Vite
│   │   ├── src/
│   │   │   ├── App.jsx        # Layout principal com rotas
│   │   │   ├── main.jsx       # Ponto de entrada React
│   │   │   ├── contexts/
│   │   │   │   └── AuthContext.jsx  # Gerenciamento de autenticação
│   │   │   ├── services/
│   │   │   │   └── api.js     # Cliente HTTP com JWT
│   │   │   ├── pages/
│   │   │   │   ├── Login.jsx  # Tela de login Google
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Transacoes.jsx
│   │   │   │   ├── GastosFixos.jsx
│   │   │   │   ├── Relatorios.jsx
│   │   │   │   ├── Metas.jsx
│   │   │   │   └── Configuracoes.jsx
│   │   │   ├── components/
│   │   │   │   └── FinanceGrid.jsx
│   │   │   └── utils/
│   │   │       ├── currency.js
│   │   │       ├── date.js
│   │   │       └── validation.js
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/               # Express + PostgreSQL
│       ├── src/
│       │   ├── index.js       # Servidor Express
│       │   ├── config/
│       │   │   ├── database.js # Conexão PostgreSQL (pg)
│       │   │   └── auth.js    # Google OAuth + JWT
│       │   ├── middleware/
│       │   │   └── auth.js    # Middleware JWT
│       │   ├── routes/
│       │   │   ├── auth.js    # POST /auth/google, GET /auth/me
│       │   │   ├── transacoes.js
│       │   │   ├── categorias.js
│       │   │   ├── contas.js
│       │   │   ├── metas.js
│       │   │   ├── gastosFixos.js
│       │   │   ├── estatisticas.js
│       │   │   └── previsoes.js
│       │   └── db/
│       │       └── schema.sql # Schema PostgreSQL
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml         # Produção (com Traefik)
├── docker-compose.dev.yml     # Desenvolvimento local
└── .env.example
```

### Fluxo de Comunicação

```
┌─────────────────────┐     HTTP (fetch)          ┌──────────────────────┐
│  Frontend (React)   │ ────────────────────────► │  Backend (Express)   │
│  api.js             │ ◄──────────────────────── │  /api/*              │
└─────────────────────┘     JSON Response         │  pg (PostgreSQL)     │
        ▲                                         └──────────────────────┘
        │                                                │
        │ localStorage (JWT)                             │
        │                                                ▼
        └── AuthContext                          PostgreSQL (banco)
```

---

## Banco de Dados

PostgreSQL com 6 tabelas, cada uma com coluna `user_id` para isolamento multi-usuário.

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários autenticados via Google |
| `contas` | Contas bancárias (nome, banco, tipo, saldo_inicial) |
| `categorias` | Categorias de gastos com cor personalizada |
| `transacoes` | Receitas e despesas com data, valor, tipo, status pago |
| `metas` | Metas de economia com valor alvo e prazo |
| `gastos_fixos` | Despesas recorrentes com dia de vencimento |

### Categorias Padrão

O app cria automaticamente 7 categorias na primeira execução de cada usuário:

| Categoria | Cor |
|-----------|-----|
| Alimentação | Verde |
| Transporte | Azul |
| Moradia | Roxo |
| Lazer | Amarelo |
| Saúde | Vermelho |
| Educação | Ciano |
| Outros | Cinza |

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 |
| Build | Vite 5 |
| UI | Ant Design 6 |
| Tabelas | ag-grid-react 35 |
| Gráficos | Recharts 2.12 |
| Roteamento | react-router-dom 6 |
| Backend | Express 4 |
| Banco de dados | PostgreSQL 16 |
| Autenticação | Google OAuth + JWT |
| CSV | PapaParse 5 |
| Containerização | Docker + Docker Compose |
| Proxy | Traefik (produção) |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- npm (v9+)
- [Docker](https://www.docker.com/) (para rodar com containers)
- Conta no [Google Cloud Console](https://console.cloud.google.com/) com OAuth 2.0 configurado

---

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta do projeto
cd meu-financeiro

# Copie os arquivos de exemplo
cp .env.example .env
cp packages/frontend/.env.example packages/frontend/.env
cp packages/backend/.env.example packages/backend/.env

# Edite o .env na raiz com suas credenciais do Google
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# JWT_SECRET=<gere_um_valor_forte>
```

---

## Uso

### Desenvolvimento Local (sem Docker)

```bash
# Terminal 1 - Backend
cd packages/backend
npm install
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm install
npm run dev
```

Acesse http://localhost:5173

### Desenvolvimento Local (com Docker Recomendado)

```bash
# Configure as variáveis de ambiente no .env na raiz

# Suba todos os serviços
docker-compose -f docker-compose.dev.yml up --build

# Ou em background
docker-compose -f docker-compose.dev.yml up --build -d

# Para parar
docker-compose -f docker-compose.dev.yml down
```

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 8080 | http://localhost:8080 |
| Backend | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |

### Produção (com Traefik)

```bash
# Configure o .env com credenciais de produção
# Configure o DNS para apontar para seu servidor
# Certifique-se de que o Traefik está rodando

docker-compose up --build -d
```

---

## Variáveis de Ambiente

### Backend (`packages/backend/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `GOOGLE_CLIENT_ID` | Client ID do Google Cloud | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google Cloud | `GOCSPX-...` |
| `JWT_SECRET` | Segredo para assinar tokens JWT | `meu-secreto-forte` |
| `PORT` | Porta do servidor backend | `3001` |
| `FRONTEND_URL` | URL do frontend (CORS) | `http://localhost:8080` |

### Frontend (`packages/frontend/.env`)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_URL` | URL do backend API | `http://localhost:3001` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID do Google (mesmo do backend) | `123456789.apps.googleusercontent.com` |

---

## Importação de Dados

### Formato CSV

O CSV deve conter estas colunas (aceita variações de maiúsculas/minúsculas):

| Coluna | Obrigatória | Descrição |
|--------|-------------|-----------|
| `data` | Sim | Data da transação (YYYY-MM-DD) |
| `descricao` | Sim | Descrição da transação |
| `valor` | Sim | Valor (positivo = receita, negativo = despesa) |
| `tipo_pagamento` | Não | credito, debito, pix, dinheiro, boleto |

As categorias são atribuídas automaticamente quando a descrição contém o nome da categoria.

---

## Licença

ISC
