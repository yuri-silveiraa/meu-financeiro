const STORAGE_KEY = 'meu-financeiro:browser-api';

const today = new Date().toISOString().split('T')[0];

const initialState = {
  categorias: [
    { id: 1, nome: 'Alimentacao', cor: '#22c55e', icone: 'utensils' },
    { id: 2, nome: 'Transporte', cor: '#3b82f6', icone: 'car' },
    { id: 3, nome: 'Moradia', cor: '#8b5cf6', icone: 'home' },
    { id: 4, nome: 'Lazer', cor: '#f59e0b', icone: 'gamepad-2' },
    { id: 5, nome: 'Outros', cor: '#6b7280', icone: 'folder' }
  ],
  contas: [
    { id: 1, nome: 'Conta principal', banco: 'Banco demo', tipo_conta: 'corrente', saldo_inicial: 0 }
  ],
  transacoes: [
    { id: 1, data: today, descricao: 'Salario', valor: 5200, tipo: 'receita', tipo_pagamento: null, categoria_id: 5, conta_id: 1, pago: 1, parcela_atual: null },
    { id: 2, data: today, descricao: 'Mercado', valor: 248.9, tipo: 'despesa', tipo_pagamento: 'debito', categoria_id: 1, conta_id: 1, pago: 1, parcela_atual: null },
    { id: 3, data: today, descricao: 'Aluguel', valor: 1500, tipo: 'despesa', tipo_pagamento: 'pix', categoria_id: 3, conta_id: 1, pago: 0, parcela_atual: null }
  ],
  metas: [
    { id: 1, nome: 'Reserva', valor_meta: 10000, valor_atual: 2800, prazo: '', categoria_id: null }
  ],
  gastosFixos: [
    { id: 1, nome: 'Internet', valor: 120, dia_vencimento: 10, tipo_pagamento: 'credito', categoria_id: 3, conta_id: null, total_parcelas: null, tipo: 'despesa', ativo: 1 }
  ]
};

function loadState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(initialState);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;
}

function withRelations(state, transacao) {
  const categoria = state.categorias.find((item) => item.id === Number(transacao.categoria_id));
  const conta = state.contas.find((item) => item.id === Number(transacao.conta_id));
  const gastoFixo = transacao.gasto_fixo_id
    ? state.gastosFixos.find((item) => item.id === Number(transacao.gasto_fixo_id))
    : null;

  return {
    ...transacao,
    categoria_nome: categoria?.nome || null,
    categoria_cor: categoria?.cor || null,
    conta_nome: conta?.nome || null,
    gasto_fixo_nome: gastoFixo?.nome || null,
    parcela_atual: transacao.parcela_atual || null,
    total_parcelas: gastoFixo?.total_parcelas || null
  };
}

function filterTransacoes(state, filtros = {}) {
  return state.transacoes
    .filter((item) => !filtros.dataInicio || item.data >= filtros.dataInicio)
    .filter((item) => !filtros.dataFim || item.data <= filtros.dataFim)
    .filter((item) => !filtros.tipo || item.tipo === filtros.tipo)
    .filter((item) => filtros.pago === '' || filtros.pago === undefined || Number(item.pago) === Number(filtros.pago))
    .filter((item) => !filtros.categoriaId || Number(item.categoria_id) === Number(filtros.categoriaId))
    .filter((item) => !filtros.contaId || Number(item.conta_id) === Number(filtros.contaId))
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((item) => withRelations(state, item));
}

function getGastosFixosWithRelations(state) {
  return state.gastosFixos
    .filter((item) => item.ativo !== 0)
    .sort((a, b) => a.dia_vencimento - b.dia_vencimento)
    .map((item) => {
      const categoria = state.categorias.find((cat) => cat.id === Number(item.categoria_id));
      const conta = state.contas.find((ct) => ct.id === Number(item.conta_id));
      return {
        ...item,
        categoria_nome: categoria?.nome || null,
        categoria_cor: categoria?.cor || null,
        conta_nome: conta?.nome || null
      };
    });
}

function getEstatisticas(state, mes, ano) {
  const prefix = `${ano}-${String(mes).padStart(2, '0')}`;
  const transacoesMes = state.transacoes.filter((item) => item.data.startsWith(prefix));
  const despesas = transacoesMes.filter((item) => item.tipo === 'despesa').reduce((sum, item) => sum + item.valor, 0);
  const receitas = transacoesMes.filter((item) => item.tipo === 'receita').reduce((sum, item) => sum + item.valor, 0);
  const despesasNaoPagas = transacoesMes.filter((item) => item.tipo === 'despesa' && !item.pago).reduce((sum, item) => sum + item.valor, 0);

  const porCategoria = state.categorias.map((categoria) => ({
    nome: categoria.nome,
    cor: categoria.cor,
    total: transacoesMes
      .filter((item) => item.tipo === 'despesa' && Number(item.categoria_id) === categoria.id)
      .reduce((sum, item) => sum + item.valor, 0)
  })).filter((item) => item.total > 0);

  const pagamentos = ['credito', 'debito', 'pix', 'dinheiro', 'boleto'];
  const porPagamento = pagamentos.map((tipo_pagamento) => ({
    tipo_pagamento,
    total: transacoesMes
      .filter((item) => item.tipo === 'despesa' && item.tipo_pagamento === tipo_pagamento)
      .reduce((sum, item) => sum + item.valor, 0)
  })).filter((item) => item.total > 0);

  return { receitas, despesas, saldo: receitas - despesas, saldoProjetado: receitas - despesas - despesasNaoPagas, despesasNaoPagas, porCategoria, porPagamento };
}

export function installBrowserApiMock() {
  if (window.api) return;

  console.info('[Meu Financeiro] Usando API mock no navegador. Dados salvos em localStorage.');

  window.api = {
    getTransacoes: async (filtros) => filterTransacoes(loadState(), filtros),
    addTransacao: async (transacao) => {
      const state = loadState();
      const item = { ...transacao, id: nextId(state.transacoes), pago: transacao.pago ? 1 : 0 };
      state.transacoes.push(item);
      saveState(state);
      return item;
    },
    updateTransacao: async (transacao) => {
      const state = loadState();
      state.transacoes = state.transacoes.map((item) => item.id === transacao.id ? { ...item, ...transacao } : item);
      saveState(state);
      return transacao;
    },
    deleteTransacao: async (id) => {
      const state = loadState();
      state.transacoes = state.transacoes.filter((item) => item.id !== id);
      saveState(state);
      return { success: true };
    },
    togglePago: async (id) => {
      const state = loadState();
      const item = state.transacoes.find((transacao) => transacao.id === id);
      if (item) item.pago = item.pago ? 0 : 1;
      saveState(state);
      return { success: Boolean(item), pago: item?.pago };
    },
    getCategorias: async () => loadState().categorias.sort((a, b) => a.nome.localeCompare(b.nome)),
    addCategoria: async (categoria) => {
      const state = loadState();
      const item = { ...categoria, id: nextId(state.categorias), icone: categoria.icone || 'folder' };
      state.categorias.push(item);
      saveState(state);
      return item;
    },
    updateCategoria: async (categoria) => {
      const state = loadState();
      state.categorias = state.categorias.map((item) => item.id === categoria.id ? { ...item, ...categoria } : item);
      saveState(state);
      return categoria;
    },
    deleteCategoria: async (id) => {
      const state = loadState();
      state.transacoes = state.transacoes.map((item) => Number(item.categoria_id) === Number(id) ? { ...item, categoria_id: null } : item);
      state.metas = state.metas.map((item) => Number(item.categoria_id) === Number(id) ? { ...item, categoria_id: null } : item);
      state.gastosFixos = state.gastosFixos.map((item) => Number(item.categoria_id) === Number(id) ? { ...item, categoria_id: null } : item);
      state.categorias = state.categorias.filter((item) => item.id !== id);
      saveState(state);
      return { success: true };
    },
    getContas: async () => loadState().contas.sort((a, b) => a.nome.localeCompare(b.nome)),
    addConta: async (conta) => {
      const state = loadState();
      const item = { ...conta, id: nextId(state.contas) };
      state.contas.push(item);
      saveState(state);
      return item;
    },
    updateConta: async (conta) => {
      const state = loadState();
      state.contas = state.contas.map((item) => item.id === conta.id ? { ...item, ...conta } : item);
      saveState(state);
      return conta;
    },
    deleteConta: async (id) => {
      const state = loadState();
      state.transacoes = state.transacoes.map((item) => Number(item.conta_id) === Number(id) ? { ...item, conta_id: null } : item);
      state.gastosFixos = state.gastosFixos.map((item) => Number(item.conta_id) === Number(id) ? { ...item, conta_id: null } : item);
      state.contas = state.contas.filter((item) => item.id !== id);
      saveState(state);
      return { success: true };
    },
    getMetas: async () => loadState().metas,
    addMeta: async (meta) => {
      const state = loadState();
      const item = { ...meta, id: nextId(state.metas) };
      state.metas.push(item);
      saveState(state);
      return item;
    },
    updateMeta: async (meta) => {
      const state = loadState();
      state.metas = state.metas.map((item) => item.id === meta.id ? { ...item, ...meta } : item);
      saveState(state);
      return meta;
    },
    getGastosFixos: async () => getGastosFixosWithRelations(loadState()),
    addGastoFixo: async (gastoFixo) => {
      const state = loadState();
      const id = nextId(state.gastosFixos);
      const totalParcelas = gastoFixo.total_parcelas || null;
      const contaId = gastoFixo.conta_id || null;
      const tipo = gastoFixo.tipo || 'despesa';

      const item = { ...gastoFixo, id, conta_id: contaId, total_parcelas: totalParcelas, tipo, ativo: 1 };
      state.gastosFixos.push(item);

      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth() + 1;
      const dia = gastoFixo.dia_vencimento;
      let parcelaAtual = 1;

      for (let m = mes; m <= 12; m++) {
        if (totalParcelas && parcelaAtual > totalParcelas) break;

        const dataTransacao = `${ano}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        state.transacoes.push({
          id: nextId(state.transacoes),
          data: dataTransacao,
          descricao: gastoFixo.nome,
          valor: gastoFixo.valor,
          tipo,
          tipo_pagamento: gastoFixo.tipo_pagamento || 'pix',
          categoria_id: gastoFixo.categoria_id || null,
          conta_id: contaId,
          pago: 0,
          gasto_fixo_id: id,
          parcela_atual: totalParcelas ? parcelaAtual : null
        });
        parcelaAtual++;
      }

      saveState(state);
      return { ...item, transacoesCriadas: parcelaAtual - 1 };
    },
    updateGastoFixo: async (gastoFixo) => {
      const state = loadState();
      const totalParcelas = gastoFixo.total_parcelas || null;
      const contaId = gastoFixo.conta_id || null;
      const tipo = gastoFixo.tipo || 'despesa';

      state.gastosFixos = state.gastosFixos.map((item) =>
        item.id === gastoFixo.id ? { ...item, ...gastoFixo, conta_id: contaId, total_parcelas: totalParcelas, tipo } : item
      );

      state.transacoes = state.transacoes.map((item) => {
        if (Number(item.gasto_fixo_id) === Number(gastoFixo.id) && !item.pago) {
          return {
            ...item,
            valor: gastoFixo.valor,
            descricao: gastoFixo.nome,
            tipo,
            tipo_pagamento: gastoFixo.tipo_pagamento || 'pix',
            categoria_id: gastoFixo.categoria_id || null,
            conta_id: contaId
          };
        }
        return item;
      });

      if (totalParcelas) {
        const pagas = state.transacoes.filter(
          (t) => Number(t.gasto_fixo_id) === Number(gastoFixo.id) && t.pago
        ).length;

        const naoPagasCount = state.transacoes.filter(
          (t) => Number(t.gasto_fixo_id) === Number(gastoFixo.id) && !t.pago
        ).length;

        const faltam = totalParcelas - pagas - naoPagasCount;

        if (faltam > 0) {
          const hoje = new Date();
          const ano = hoje.getFullYear();
          const dia = gastoFixo.dia_vencimento;
          let parcelaBase = pagas + 1;
          const ultimaParcela = state.transacoes
            .filter((t) => Number(t.gasto_fixo_id) === Number(gastoFixo.id) && t.pago && t.parcela_atual)
            .sort((a, b) => b.parcela_atual - a.parcela_atual)[0];
          if (ultimaParcela) parcelaBase = ultimaParcela.parcela_atual + 1;

          let criadas = 0;
          for (let m = hoje.getMonth() + 1; m <= 12; m++) {
            if (criadas >= faltam) break;

            const dataTransacao = `${ano}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const existe = state.transacoes.find(
              (t) => Number(t.gasto_fixo_id) === Number(gastoFixo.id) && t.data === dataTransacao
            );

            if (!existe) {
              state.transacoes.push({
                id: nextId(state.transacoes),
                data: dataTransacao,
                descricao: gastoFixo.nome,
                valor: gastoFixo.valor,
                tipo,
                tipo_pagamento: gastoFixo.tipo_pagamento || 'pix',
                categoria_id: gastoFixo.categoria_id || null,
                conta_id: contaId,
                pago: 0,
                gasto_fixo_id: gastoFixo.id,
                parcela_atual: parcelaBase + criadas
              });
              criadas++;
            }
          }
        }
      }

      saveState(state);
      return gastoFixo;
    },
    deleteGastoFixo: async (id) => {
      const state = loadState();
      state.gastosFixos = state.gastosFixos.map((item) => item.id === id ? { ...item, ativo: 0 } : item);
      saveState(state);
      return { success: true };
    },
    getEstatisticas: async (mes, ano) => getEstatisticas(loadState(), mes, ano),
    getPrevisoes: async () => getGastosFixosWithRelations(loadState()).map((item) => ({ categoria: item.categoria_nome || item.nome, cor: item.categoria_cor, tipo: item.tipo || 'despesa', media_mensal: item.valor })),
    openFile: async () => ({ canceled: true, filePaths: [] }),
    readPDF: async () => ({ success: false, error: 'Leitura de PDF disponivel apenas no Electron.' })
  };
}
