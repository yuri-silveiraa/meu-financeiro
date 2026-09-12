import {
  getEstatisticas,
  getCategorias,
  getGastosFixos,
  getTransacoes,
  criarTransacao,
  getAlertas,
} from './apiClient.js';
import { parseTransacao, extrairPeriodo } from './nlpParser.js';

const MESES = [
  '', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const HELP_TEXT = `📋 *Comandos disponíveis*

💰 *Financeiros*
• *saldo* — Resumo do mês atual
• *gastei [valor] [descrição]* — Registrar despesa
• *recebi [valor] [descrição]* — Registrar receita
• *pendentes* — Contas a pagar
• *gastosfixos* — Gastos fixos do mês
• *categorias* — Suas categorias

📊 *Relatórios*
• *resumo [mês]* — Resumo mensal
• *despesas [mês]* — Lista de despesas
• *receitas [mês]* — Lista de receitas
• *alertas* — Alertas e avisos

❓ *Ajuda*
• *ajuda* ou *menu* — Esta mensagem

💡 *Dicas de uso natural:*
_"Gastei 45 reais no almoço"_
_"Comprei roupa por 120 no PIX"_
_"Recebi 3500 de salário"_
_"Uber 35"_

📅 Mês: *julho*, *ago*, *set*, etc.
Padrão: mês atual`;

export async function handleCommand(text, userId) {
  const lower = text.toLowerCase().trim();

  if (lower === 'ajuda' || lower === 'menu' || lower === 'help') {
    return HELP_TEXT;
  }

  if (lower === 'saldo' || lower === 'resumo') {
    return handleSaldo(userId);
  }

  if (lower === 'pendentes') {
    return handlePendentes(userId);
  }

  if (lower === 'gastosfixos' || lower === 'fixos') {
    return handleGastosFixos(userId);
  }

  if (lower === 'categorias') {
    return handleCategorias(userId);
  }

  if (lower === 'alertas') {
    return handleAlertas(userId);
  }

  if (lower.startsWith('despesas') || lower.startsWith('gastos')) {
    return handleDespesas(userId, lower);
  }

  if (lower.startsWith('receitas')) {
    return handleReceitas(userId, lower);
  }

  if (lower.startsWith('resumo')) {
    return handleResumo(userId, lower);
  }

  if (lower.startsWith('gastei') || lower.startsWith('paguei') || lower.startsWith('comprei') ||
      lower.startsWith('perdi') || lower.startsWith('desembolsei') || lower.startsWith('gasto')) {
    return handleRegistrarDespesa(text, userId);
  }

  if (lower.startsWith('recebi') || lower.startsWith('ganhei') || lower.startsWith('entrou') ||
      lower.startsWith('salário') || lower.startsWith('salario')) {
    return handleRegistrarReceita(text, userId);
  }

  return null;
}

async function handleSaldo(userId) {
  const stats = await getEstatisticas(userId);
  if (!stats) return '❌ Erro ao buscar dados financeiros.';

  const emoji = stats.saldo >= 0 ? '✅' : '🔴';
  return `💰 *Resumo de ${MESES[stats.mes]} ${stats.ano}*

Receitas: R$ ${stats.receitas.toFixed(2)}
Despesas: R$ ${stats.despesas.toFixed(2)}
${emoji} *Saldo:* R$ ${stats.saldo.toFixed(2)}

${stats.despesasNaoPagas > 0 ? `⚠️ Pendentes: R$ ${stats.despesasNaoPagas.toFixed(2)}` : '✅ Sem pendências'}`;
}

async function handlePendentes(userId) {
  const transacoes = await getTransacoes(userId, { pago: 'false' });
  if (transacoes.length === 0) return '✅ Não há contas pendentes!';

  let msg = '📋 *Contas Pendentes*\n\n';
  for (const t of transacoes.slice(0, 10)) {
    const data = new Date(t.data + 'T12:00:00');
    msg += `• R$ ${parseFloat(t.valor).toFixed(2)} — ${t.descricao || 'Sem descrição'} (${data.getDate()}/${data.getMonth() + 1})\n`;
  }
  if (transacoes.length > 10) {
    msg += `\n... e mais ${transacoes.length - 10}`;
  }
  return msg;
}

async function handleGastosFixos(userId) {
  const gastos = await getGastosFixos(userId);
  if (gastos.length === 0) return '📋 Não há gastos fixos cadastrados.';

  let msg = '📅 *Gastos Fixos*\n\n';
  for (const g of gastos) {
    msg += `• Dia ${g.dia_vencimento}: ${g.nome} — R$ ${parseFloat(g.valor).toFixed(2)}`;
    if (g.categoria_nome) msg += ` (${g.categoria_nome})`;
    msg += '\n';
  }
  return msg;
}

async function handleCategorias(userId) {
  const cats = await getCategorias(userId);
  if (cats.length === 0) return '📋 Não há categorias cadastradas.';

  let msg = '🏷️ *Suas Categorias*\n\n';
  for (const c of cats) {
    msg += `• ${c.cor} ${c.nome}\n`;
  }
  return msg;
}

async function handleAlertas(userId) {
  const alertas = await getAlertas(userId);
  if (alertas.length === 0) return '✅ Sem alertas no momento!';

  let msg = '🔔 *Alertas*\n\n';
  for (const a of alertas) {
    msg += `${a.mensagem}\n`;
  }
  return msg;
}

async function handleDespesas(userId, text) {
  const { mes, ano } = extrairPeriodo(text);
  const transacoes = await getTransacoes(userId, { mes, ano, tipo: 'despesa' });

  if (transacoes.length === 0) return `📋 Sem despesas em ${MESES[mes]} ${ano}.`;

  let msg = `💸 *Despesas — ${MESES[mes]} ${ano}*\n\n`;
  let total = 0;
  for (const t of transacoes.slice(0, 15)) {
    const v = parseFloat(t.valor);
    total += v;
    const data = new Date(t.data + 'T12:00:00');
    const cat = t.categoria_nome || 'Sem categoria';
    msg += `• ${data.getDate()}/${data.getMonth() + 1} — R$ ${v.toFixed(2)} — ${t.descricao || 'Sem desc.'} [${cat}]\n`;
  }
  if (transacoes.length > 15) {
    msg += `\n... e mais ${transacoes.length - 15}`;
  }
  msg += `\n💰 *Total:* R$ ${total.toFixed(2)}`;
  return msg;
}

async function handleReceitas(userId, text) {
  const { mes, ano } = extrairPeriodo(text);
  const transacoes = await getTransacoes(userId, { mes, ano, tipo: 'receita' });

  if (transacoes.length === 0) return `📋 Sem receitas em ${MESES[mes]} ${ano}.`;

  let msg = `💵 *Receitas — ${MESES[mes]} ${ano}*\n\n`;
  let total = 0;
  for (const t of transacoes) {
    const v = parseFloat(t.valor);
    total += v;
    const data = new Date(t.data + 'T12:00:00');
    msg += `• ${data.getDate()}/${data.getMonth() + 1} — R$ ${v.toFixed(2)} — ${t.descricao || 'Sem desc.'}\n`;
  }
  msg += `\n💰 *Total:* R$ ${total.toFixed(2)}`;
  return msg;
}

async function handleResumo(userId, text) {
  const { mes, ano } = extrairPeriodo(text);
  const stats = await getEstatisticas(userId, mes, ano);
  if (!stats) return '❌ Erro ao buscar dados.';

  const emoji = stats.saldo >= 0 ? '✅' : '🔴';
  return `📊 *Resumo — ${MESES[stats.mes]} ${stats.ano}*

Receitas: R$ ${stats.receitas.toFixed(2)}
Despesas: R$ ${stats.despesas.toFixed(2)}
${emoji} *Saldo:* R$ ${stats.saldo.toFixed(2)}`;
}

async function handleRegistrarDespesa(text, userId) {
  try {
    const categorias = await getCategorias(userId);
    const parsed = parseTransacao(text, categorias);

    if (!parsed.valor) {
      return '❌ Não consegui identificar o valor. Exemplo: _"Gastei 45 reais no almoço"_';
    }

    const result = await criarTransacao(userId, {
      data: parsed.data,
      descricao: parsed.descricao,
      valor: parsed.valor,
      tipo: 'despesa',
      tipo_pagamento: parsed.tipo_pagamento,
      categoria_id: parsed.categoria_id,
    });

    const catMsg = parsed.categoria_id ? ` (${categorias.find(c => c.id === parsed.categoria_id)?.nome || ''})` : '';
    return `✅ *Despesa registrada!*

💰 R$ ${parsed.valor.toFixed(2)}${catMsg}
📅 ${parsed.data}${parsed.descricao ? `\n📝 ${parsed.descricao}` : ''}`;
  } catch (err) {
    return `❌ Erro ao registrar: ${err.message}`;
  }
}

async function handleRegistrarReceita(text, userId) {
  try {
    const categorias = await getCategorias(userId);
    const parsed = parseTransacao(text, categorias);

    if (!parsed.valor) {
      return '❌ Não consegui identificar o valor. Exemplo: _"Recebi 3500 de salário"_';
    }

    const result = await criarTransacao(userId, {
      data: parsed.data,
      descricao: parsed.descricao,
      valor: parsed.valor,
      tipo: 'receita',
      tipo_pagamento: parsed.tipo_pagamento,
      categoria_id: parsed.categoria_id,
    });

    return `✅ *Receita registrada!*

💵 R$ ${parsed.valor.toFixed(2)}
📅 ${parsed.data}${parsed.descricao ? `\n📝 ${parsed.descricao}` : ''}`;
  } catch (err) {
    return `❌ Erro ao registrar: ${err.message}`;
  }
}
