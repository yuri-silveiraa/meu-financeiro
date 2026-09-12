-- ============================================
-- Meu Financeiro - PostgreSQL Schema
-- ============================================

-- Tabela de usuários (autenticação Google + WhatsApp)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  whatsapp_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  banco TEXT,
  tipo_conta TEXT DEFAULT 'corrente',
  saldo_inicial NUMERIC(12,2) DEFAULT 0
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6366f1',
  icone TEXT DEFAULT 'folder'
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT,
  valor NUMERIC(12,2) NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
  tipo_pagamento TEXT CHECK(tipo_pagamento IN ('credito', 'debito', 'pix', 'dinheiro', 'boleto')),
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  conta_id INTEGER REFERENCES contas(id) ON DELETE SET NULL,
  pago BOOLEAN DEFAULT FALSE,
  gasto_fixo_id INTEGER,
  parcela_atual INTEGER
);

-- Tabela de metas
CREATE TABLE IF NOT EXISTS metas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor_meta NUMERIC(12,2) NOT NULL,
  valor_atual NUMERIC(12,2) DEFAULT 0,
  prazo DATE,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabela de gastos fixos
CREATE TABLE IF NOT EXISTS gastos_fixos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  dia_vencimento INTEGER NOT NULL,
  tipo_pagamento TEXT,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  conta_id INTEGER REFERENCES contas(id) ON DELETE SET NULL,
  total_parcelas INTEGER,
  tipo TEXT DEFAULT 'despesa',
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao DATE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_user_id ON transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria_id ON transacoes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_id ON transacoes(conta_id);
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_user_id ON contas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fixos_user_id ON gastos_fixos(user_id);
