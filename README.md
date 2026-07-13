# Meu Financeiro

Aplicativo desktop de gerenciamento de finanças pessoais, desenvolvido com **Electron**, **React** e **SQLite**.

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
- Importação de extratos via **PDF** (extração de datas e valores por regex)
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

---

## Arquitetura

```
meu-financeiro/
├── electron/
│   ├── main.js          # Processo principal Electron (banco de dados, IPC, janela)
│   └── preload.js       # Bridge de segurança (contextBridge → window.api)
├── src/
│   ├── App.jsx          # Layout principal com sidebar e navegação por estado
│   ├── main.jsx         # Ponto de entrada React
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Transacoes.jsx
│   │   ├── GastosFixos.jsx
│   │   ├── Relatorios.jsx
│   │   ├── Metas.jsx
│   │   └── Configuracoes.jsx
│   ├── components/
│   │   └── FinanceGrid.jsx   # Wrapper reutilizável do ag-grid
│   ├── utils/
│   │   ├── currency.js       # Formatação BRL (formatCurrency, parseCurrency)
│   │   ├── date.js           # Formatação de datas em pt-BR
│   │   ├── validation.js     # Validação de formulários
│   │   ├── loading.js        # Helpers de estado de carregamento
│   │   └── browserApiMock.js # Mock completo da API para rodar no navegador
│   └── styles/
│       └── index.css         # Estilos globais (745 linhas)
├── index.html
├── vite.config.js
└── package.json
```

### Fluxo de Comunicação

```
┌─────────────────┐     IPC (invoke/handle)     ┌──────────────────┐
│  Renderer (React)│ ──────────────────────────► │  Main Process    │
│  window.api.*    │ ◄────────────────────────── │  ipcMain.handle  │
└─────────────────┘     Resultado                │  better-sqlite3  │
        ▲                                        └──────────────────┘
        │                                                │
        │ contextBridge                                   │
        │                                                ▼
        └── preload.js                          financeiro.db (SQLite)
```

- **preload.js** expõe `window.api` com todos os métodos necessários
- **main.js** recebe as chamadas via IPC e acessa o banco SQLite
- Cada método no renderer (ex: `window.api.getTransacoes()`) corresponde a um `ipcMain.handle` no processo principal

---

## Banco de Dados

Banco SQLite local criado automaticamente no diretório de dados do Electron (`userData/financeiro.db`).

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `contas` | Contas bancárias (nome, banco, tipo, saldo_inicial) |
| `categorias` | Categorias de gastos com cor personalizada |
| `transacoes` | Receitas e despesas com data, valor, tipo, status pago |
| `metas` | Metas de economia com valor alvo e prazo |
| `gastos_fixos` | Despesas recorrentes com dia de vencimento |

### Categorias Padrão

O app cria automaticamente 7 categorias na primeira execução:

| Categoria | Cor |
|-----------|-----|
| Alimentação | Verde |
| Transporte | Azul |
| Lazer | Amarelo |
| Moradia | Roxo |
| Saúde | Vermelho |
| Educação | Ciano |
| Outros | Cinza |

### Migrações

O processo principal verifica automaticamente a existência de colunas e as adiciona se necessário (`addColumnIfMissing`), garantindo compatibilidade com versões anteriores do banco.

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Desktop | Electron 28 |
| Frontend | React 18 |
| Build | Vite 5 |
| UI | Ant Design 6 |
| Tabelas | ag-grid-react 35 |
| Gráficos | Recharts 2.12 |
| Banco de dados | better-sqlite3 9 |
| Importação CSV | PapaParse 5 |
| Importação PDF | pdfjs-dist 5 |
| Estilos | CSS customizado (sem pré-processador) |

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (v18+)
- npm (v9+)

---

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre na pasta do projeto
cd meu-financeiro

# Instale as dependências
npm install
```

---

## Uso

### Modo Web (navegador)

Roda apenas o frontend com dados persistidos em localStorage:

```bash
npm run web:dev
```

Acesse http://localhost:5173

### Modo Desktop (Electron)

Roda o frontend + Electron com banco SQLite:

```bash
npm run electron:dev
```

### Build de Produção

```bash
# Gera o bundle do frontend
npm run build

# Gera o instalador Electron (Windows NSIS)
npm run electron:build
```

### Outros Comandos

```bash
npm run preview       # Visualiza o build de produção
npm run electron:start  # Roda o Electron com o build pronto
```

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

### Formato PDF

O app extrai linhas com padrão de data (DD/MM/YYYY) e valor, criando despesas automaticamente. Funciona melhor com extratos bancários em formato tabular simples.

---

## Estrutura do Banco de Dados (Schema)

```sql
-- Contas bancárias
CREATE TABLE contas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  banco TEXT,
  tipo_conta TEXT DEFAULT 'corrente',
  saldo_inicial REAL DEFAULT 0
);

-- Categorias
CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6b7280'
);

-- Transações
CREATE TABLE transacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  descricao TEXT,
  valor REAL NOT NULL,
  tipo TEXT NOT NULL,           -- 'receita' ou 'despesa'
  tipo_pagamento TEXT,          -- 'debito', 'credito', 'pix', 'dinheiro', 'boleto'
  categoria_id INTEGER,
  conta_id INTEGER,
  gasto_fixo_id INTEGER,
  pago INTEGER DEFAULT 0,      -- 0 = não pago, 1 = pago
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (conta_id) REFERENCES contas(id),
  FOREIGN KEY (gasto_fixo_id) REFERENCES gastos_fixos(id)
);

-- Metas
CREATE TABLE metas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  valor_meta REAL NOT NULL,
  valor_atual REAL DEFAULT 0,
  prazo TEXT,
  categoria_id INTEGER,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Gastos Fixos
CREATE TABLE gastos_fixos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  valor REAL NOT NULL,
  dia_vencimento INTEGER DEFAULT 1,
  tipo_pagamento TEXT DEFAULT 'pix',
  categoria_id INTEGER,
  ativo INTEGER DEFAULT 1,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

---

## Modo Browser (Desenvolvimento)

Quando rodando via `npm run web:dev` (sem Electron), o app usa um **mock completo** da API em `browserApiMock.js`:

- Todos os dados ficam salvos no `localStorage`
- Dados iniciais de exemplo são carregados automaticamente
- Funcionalidades de importação CSV/PDF ficam indisponíveis
- Todas as outras funcionalidades funcionam normalmente

---

## Licença

ISC
