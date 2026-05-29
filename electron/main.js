const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db;

function hasColumn(tableName, columnName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all()
    .some((column) => column.name === columnName);
}

function addColumnIfMissing(tableName, columnName, definition) {
  if (!hasColumn(tableName, columnName)) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
}

let pdfNodePolyfillsLoaded = false;

function ensurePdfNodePolyfills() {
  if (pdfNodePolyfillsLoaded) return;

  try {
    const canvas = require('@napi-rs/canvas');
    const requiredPolyfills = ['DOMMatrix', 'ImageData', 'Path2D'];
    const missingPolyfills = [];

    for (const polyfillName of requiredPolyfills) {
      if (!globalThis[polyfillName] && canvas[polyfillName]) {
        globalThis[polyfillName] = canvas[polyfillName];
      }

      if (!globalThis[polyfillName]) {
        missingPolyfills.push(polyfillName);
      }
    }

    if (missingPolyfills.length > 0) {
      throw new Error(`Polyfills ausentes: ${missingPolyfills.join(', ')}`);
    }

    pdfNodePolyfillsLoaded = true;
  } catch (error) {
    console.error('Erro ao preparar polyfills do PDF.js:', error);
    throw new Error('Não foi possível preparar o leitor de PDF. Rode npm install e tente novamente.');
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'financeiro.db');
  db = new Database(dbPath);
  console.log('Banco de dados inicializado em:', dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS contas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      banco TEXT,
      tipo_conta TEXT DEFAULT 'corrente',
      saldo_inicial REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cor TEXT DEFAULT '#6366f1',
      icone TEXT DEFAULT 'folder'
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      descricao TEXT,
      valor REAL NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
      tipo_pagamento TEXT CHECK(tipo_pagamento IN ('credito', 'debito', 'pix', 'dinheiro', 'boleto')),
      categoria_id INTEGER,
      conta_id INTEGER,
      pago INTEGER DEFAULT 0,
      gasto_fixo_id INTEGER,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id),
      FOREIGN KEY (conta_id) REFERENCES contas(id)
    );

    CREATE TABLE IF NOT EXISTS metas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      valor_meta REAL NOT NULL,
      valor_atual REAL DEFAULT 0,
      prazo TEXT,
      categoria_id INTEGER,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );

    CREATE TABLE IF NOT EXISTS gastos_fixos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      valor REAL NOT NULL,
      dia_vencimento INTEGER NOT NULL,
      tipo_pagamento TEXT,
      categoria_id INTEGER,
      ativo INTEGER DEFAULT 1,
      data_criacao TEXT,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
  `);

  addColumnIfMissing('categorias', 'cor', "TEXT DEFAULT '#6366f1'");
  addColumnIfMissing('categorias', 'icone', "TEXT DEFAULT 'folder'");

  addColumnIfMissing('contas', 'banco', 'TEXT');
  addColumnIfMissing('contas', 'tipo_conta', "TEXT DEFAULT 'corrente'");
  addColumnIfMissing('contas', 'saldo_inicial', 'REAL DEFAULT 0');

  addColumnIfMissing('transacoes', 'tipo_pagamento', 'TEXT');
  addColumnIfMissing('transacoes', 'categoria_id', 'INTEGER');
  addColumnIfMissing('transacoes', 'conta_id', 'INTEGER');
  addColumnIfMissing('transacoes', 'pago', 'INTEGER DEFAULT 0');
  addColumnIfMissing('transacoes', 'gasto_fixo_id', 'INTEGER');

  addColumnIfMissing('metas', 'valor_atual', 'REAL DEFAULT 0');
  addColumnIfMissing('metas', 'prazo', 'TEXT');
  addColumnIfMissing('metas', 'categoria_id', 'INTEGER');

  addColumnIfMissing('gastos_fixos', 'tipo_pagamento', 'TEXT');
  addColumnIfMissing('gastos_fixos', 'categoria_id', 'INTEGER');
  addColumnIfMissing('gastos_fixos', 'ativo', 'INTEGER DEFAULT 1');
  addColumnIfMissing('gastos_fixos', 'data_criacao', 'TEXT');

  const countCategorias = db.prepare('SELECT COUNT(*) as count FROM categorias').get();
  if (countCategorias.count === 0) {
    const insert = db.prepare('INSERT INTO categorias (nome, cor, icone) VALUES (?, ?, ?)');
    insert.run('Alimentação', '#22c55e', 'utensils');
    insert.run('Transporte', '#3b82f6', 'car');
    insert.run('Lazer', '#f59e0b', 'gamepad-2');
    insert.run('Moradia', '#8b5cf6', 'home');
    insert.run('Saúde', '#ef4444', 'heart');
    insert.run('Educação', '#06b6d4', 'graduation-cap');
    insert.run('Outros', '#6b7280', 'folder');
  }
}

ipcMain.handle('db:getTransacoes', (event, filtros) => {
  let query = `SELECT t.*, c.nome as categoria_nome, c.cor as categoria_cor, ct.nome as conta_nome, gf.nome as gasto_fixo_nome
    FROM transacoes t
    LEFT JOIN categorias c ON t.categoria_id = c.id
    LEFT JOIN contas ct ON t.conta_id = ct.id
    LEFT JOIN gastos_fixos gf ON t.gasto_fixo_id = gf.id
    WHERE 1=1`;
  const params = [];

  if (filtros?.dataInicio) {
    query += ' AND t.data >= ?';
    params.push(filtros.dataInicio);
  }
  if (filtros?.dataFim) {
    query += ' AND t.data <= ?';
    params.push(filtros.dataFim);
  }
  if (filtros?.categoriaId) {
    query += ' AND t.categoria_id = ?';
    params.push(filtros.categoriaId);
  }
  if (filtros?.contaId) {
    query += ' AND t.conta_id = ?';
    params.push(filtros.contaId);
  }
  if (filtros?.tipo) {
    query += ' AND t.tipo = ?';
    params.push(filtros.tipo);
  }
  if (filtros?.pago !== undefined && filtros.pago !== '') {
    query += ' AND t.pago = ?';
    params.push(filtros.pago);
  }

  query += ' ORDER BY t.data DESC';
  return db.prepare(query).all(...params);
});

ipcMain.handle('db:addTransacao', (event, transacao) => {
  const stmt = db.prepare(`
    INSERT INTO transacoes (data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id, pago, gasto_fixo_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    transacao.data,
    transacao.descricao,
    transacao.valor,
    transacao.tipo,
    transacao.tipo_pagamento || null,
    transacao.categoria_id || null,
    transacao.conta_id || null,
    transacao.pago ? 1 : 0,
    transacao.gasto_fixo_id || null
  );
  return { id: result.lastInsertRowid, ...transacao };
});

ipcMain.handle('db:updateTransacao', (event, transacao) => {
  const stmt = db.prepare(`
    UPDATE transacoes SET data = ?, descricao = ?, valor = ?, tipo = ?, tipo_pagamento = ?, categoria_id = ?, conta_id = ?, pago = ?, gasto_fixo_id = ?
    WHERE id = ?
  `);
  stmt.run(
    transacao.data,
    transacao.descricao,
    transacao.valor,
    transacao.tipo,
    transacao.tipo_pagamento || null,
    transacao.categoria_id || null,
    transacao.conta_id || null,
    transacao.pago ? 1 : 0,
    transacao.gasto_fixo_id || null,
    transacao.id
  );
  return transacao;
});

ipcMain.handle('db:togglePago', (event, id) => {
  const transacao = db.prepare('SELECT pago FROM transacoes WHERE id = ?').get(id);
  if (transacao) {
    db.prepare('UPDATE transacoes SET pago = ? WHERE id = ?').run(transacao.pago ? 0 : 1, id);
    return { success: true, pago: !transacao.pago };
  }
  return { success: false };
});

ipcMain.handle('db:deleteTransacao', (event, id) => {
  db.prepare('DELETE FROM transacoes WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('db:getCategorias', () => {
  return db.prepare('SELECT * FROM categorias ORDER BY nome').all();
});

ipcMain.handle('db:addCategoria', (event, categoria) => {
  const stmt = db.prepare('INSERT INTO categorias (nome, cor, icone) VALUES (?, ?, ?)');
  const result = stmt.run(categoria.nome, categoria.cor, categoria.icone || 'folder');
  return { id: result.lastInsertRowid, ...categoria };
});

ipcMain.handle('db:updateCategoria', (event, categoria) => {
  db.prepare('UPDATE categorias SET nome = ?, cor = ?, icone = ? WHERE id = ?')
    .run(categoria.nome, categoria.cor, categoria.icone || 'folder', categoria.id);
  return categoria;
});

ipcMain.handle('db:deleteCategoria', (event, id) => {
  const transaction = db.transaction((categoriaId) => {
    db.prepare('UPDATE transacoes SET categoria_id = NULL WHERE categoria_id = ?').run(categoriaId);
    db.prepare('UPDATE metas SET categoria_id = NULL WHERE categoria_id = ?').run(categoriaId);
    db.prepare('UPDATE gastos_fixos SET categoria_id = NULL WHERE categoria_id = ?').run(categoriaId);
    db.prepare('DELETE FROM categorias WHERE id = ?').run(categoriaId);
  });

  transaction(id);
  return { success: true };
});

ipcMain.handle('db:getContas', () => {
  return db.prepare('SELECT * FROM contas ORDER BY nome').all();
});

ipcMain.handle('db:addConta', (event, conta) => {
  const stmt = db.prepare('INSERT INTO contas (nome, banco, tipo_conta, saldo_inicial) VALUES (?, ?, ?, ?)');
  const result = stmt.run(conta.nome, conta.banco, conta.tipo_conta, conta.saldo_inicial || 0);
  return { id: result.lastInsertRowid, ...conta };
});

ipcMain.handle('db:updateConta', (event, conta) => {
  db.prepare('UPDATE contas SET nome = ?, banco = ?, tipo_conta = ?, saldo_inicial = ? WHERE id = ?')
    .run(conta.nome, conta.banco, conta.tipo_conta, conta.saldo_inicial || 0, conta.id);
  return conta;
});

ipcMain.handle('db:deleteConta', (event, id) => {
  const transaction = db.transaction((contaId) => {
    db.prepare('UPDATE transacoes SET conta_id = NULL WHERE conta_id = ?').run(contaId);
    db.prepare('DELETE FROM contas WHERE id = ?').run(contaId);
  });

  transaction(id);
  return { success: true };
});

ipcMain.handle('db:getMetas', () => {
  return db.prepare('SELECT m.*, c.nome as categoria_nome FROM metas m LEFT JOIN categorias c ON m.categoria_id = c.id ORDER BY m.prazo').all();
});

ipcMain.handle('db:addMeta', (event, meta) => {
  const stmt = db.prepare('INSERT INTO metas (nome, valor_meta, valor_atual, prazo, categoria_id) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(meta.nome, meta.valor_meta, meta.valor_atual || 0, meta.prazo, meta.categoria_id || null);
  return { id: result.lastInsertRowid, ...meta };
});

ipcMain.handle('db:updateMeta', (event, meta) => {
  const stmt = db.prepare('UPDATE metas SET nome = ?, valor_meta = ?, valor_atual = ?, prazo = ?, categoria_id = ? WHERE id = ?');
  stmt.run(meta.nome, meta.valor_meta, meta.valor_atual, meta.prazo, meta.categoria_id || null, meta.id);
  return meta;
});

ipcMain.handle('db:getGastosFixos', () => {
  return db.prepare(`
    SELECT gf.*, c.nome as categoria_nome, c.cor as categoria_cor
    FROM gastos_fixos gf
    LEFT JOIN categorias c ON gf.categoria_id = c.id
    WHERE gf.ativo = 1
    ORDER BY gf.dia_vencimento
  `).all();
});

ipcMain.handle('db:addGastoFixo', (event, gastoFixo) => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  const dia = gastoFixo.dia_vencimento;

  const stmt = db.prepare(`
    INSERT INTO gastos_fixos (nome, valor, dia_vencimento, tipo_pagamento, categoria_id, ativo, data_criacao)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);
  const result = stmt.run(
    gastoFixo.nome,
    gastoFixo.valor,
    gastoFixo.dia_vencimento,
    gastoFixo.tipo_pagamento || null,
    gastoFixo.categoria_id || null,
    `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  );

  const gastoId = result.lastInsertRowid;

  let transacoesCriadas = 0;
  for (let m = mes; m <= 12; m++) {
    const dataTransacao = `${ano}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    db.prepare(`
      INSERT INTO transacoes (data, descricao, valor, tipo, tipo_pagamento, categoria_id, pago, gasto_fixo_id)
      VALUES (?, ?, ?, 'despesa', ?, ?, 0, ?)
    `).run(
      dataTransacao,
      gastoFixo.nome,
      gastoFixo.valor,
      gastoFixo.tipo_pagamento || 'pix',
      gastoFixo.categoria_id || null,
      gastoId
    );
    transacoesCriadas++;
  }

  return { id: gastoId, ...gastoFixo, transacoesCriadas };
});

ipcMain.handle('db:updateGastoFixo', (event, gastoFixo) => {
  db.prepare(`
    UPDATE gastos_fixos SET nome = ?, valor = ?, dia_vencimento = ?, tipo_pagamento = ?, categoria_id = ?
    WHERE id = ?
  `).run(
    gastoFixo.nome,
    gastoFixo.valor,
    gastoFixo.dia_vencimento,
    gastoFixo.tipo_pagamento || null,
    gastoFixo.categoria_id || null,
    gastoFixo.id
  );

  db.prepare(`
    UPDATE transacoes SET valor = ?, descricao = ?, tipo_pagamento = ?, categoria_id = ?
    WHERE gasto_fixo_id = ? AND pago = 0
  `).run(
    gastoFixo.valor,
    gastoFixo.nome,
    gastoFixo.tipo_pagamento || 'pix',
    gastoFixo.categoria_id || null,
    gastoFixo.id
  );

  return gastoFixo;
});

ipcMain.handle('db:deleteGastoFixo', (event, id) => {
  db.prepare('UPDATE gastos_fixos SET ativo = 0 WHERE id = ?').run(id);
  return { success: true };
});

ipcMain.handle('db:getEstatisticas', (event, mes, ano) => {
  const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const endDate = `${ano}-${String(mes).padStart(2, '0')}-31`;

  const receitas = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE tipo = 'receita' AND data >= ? AND data <= ?
  `).get(startDate, endDate).total;

  const despesas = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE tipo = 'despesa' AND data >= ? AND data <= ?
  `).get(startDate, endDate).total;

  const despesasNaoPagas = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE tipo = 'despesa' AND pago = 0 AND data >= ? AND data <= ?
  `).get(startDate, endDate).total;

  const porCategoria = db.prepare(`
    SELECT c.nome, c.cor, SUM(t.valor) as total
    FROM transacoes t
    JOIN categorias c ON t.categoria_id = c.id
    WHERE t.tipo = 'despesa' AND t.data >= ? AND t.data <= ?
    GROUP BY c.id
    ORDER BY total DESC
  `).all(startDate, endDate);

  const porPagamento = db.prepare(`
    SELECT tipo_pagamento, SUM(valor) as total
    FROM transacoes
    WHERE tipo = 'despesa' AND data >= ? AND data <= ?
    GROUP BY tipo_pagamento
  `).all(startDate, endDate);

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    saldoProjetado: receitas - despesas - despesasNaoPagas,
    despesasNaoPagas,
    porCategoria,
    porPagamento
  };
});

ipcMain.handle('db:getPrevisoes', () => {
  return db.prepare(`
    SELECT c.nome as categoria, c.cor, AVG(t.valor) as media_mensal
    FROM transacoes t
    JOIN categorias c ON t.categoria_id = c.id
    WHERE t.tipo = 'despesa'
    GROUP BY c.id
    ORDER BY media_mensal DESC
  `).all();
});

ipcMain.handle('dialog:openFile', async (event, tipo) => {
  const filters = tipo === 'pdf'
    ? [{ name: 'PDF', extensions: ['pdf'] }]
    : [{ name: 'CSV', extensions: ['csv'] }];

  const result = await dialog.showOpenDialog({
    filters,
    properties: ['openFile']
  });
  return result;
});

ipcMain.handle('file:readPDF', async (event, filePath) => {
  try {
    ensurePdfNodePolyfills();
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjs.getDocument({
      data,
      disableWorker: true,
      useWorkerFetch: false
    }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }

    return { success: true, text };
  } catch (error) {
    console.error('Erro ao ler PDF:', error);
    return { success: false, error: error.message || 'Não foi possível ler o PDF selecionado.' };
  }
});

app.whenReady().then(() => {
  initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
