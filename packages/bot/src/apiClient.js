const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

const headers = {
  'Content-Type': 'application/json',
  'X-API-KEY': process.env.BOT_API_KEY || '',
};

export async function getUserByPhone(phone) {
  const res = await fetch(`${BACKEND_URL}/bot/user/${phone}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

export async function linkPhoneToUser(phone, userId) {
  const res = await fetch(`${BACKEND_URL}/bot/link`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, phoneNumber: phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao vincular' }));
    throw new Error(err.error || 'Erro ao vincular');
  }
  return res.json();
}

export async function getEstatisticas(userId, mes, ano) {
  const params = new URLSearchParams();
  if (mes) params.set('mes', mes);
  if (ano) params.set('ano', ano);
  const res = await fetch(`${BACKEND_URL}/bot/estatisticas/${userId}?${params}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

export async function getCategorias(userId) {
  const res = await fetch(`${BACKEND_URL}/bot/categorias/${userId}`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getGastosFixos(userId) {
  const res = await fetch(`${BACKEND_URL}/bot/gastos-fixos/${userId}`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function getTransacoes(userId, { mes, ano, tipo, pago } = {}) {
  const params = new URLSearchParams();
  if (mes) params.set('mes', mes);
  if (ano) params.set('ano', ano);
  if (tipo) params.set('tipo', tipo);
  if (pago !== undefined) params.set('pago', pago);
  const res = await fetch(`${BACKEND_URL}/bot/transacoes/${userId}?${params}`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function criarTransacao(userId, { data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id }) {
  const res = await fetch(`${BACKEND_URL}/bot/transacao`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, data, descricao, valor, tipo, tipo_pagamento, categoria_id, conta_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao criar transação' }));
    throw new Error(err.error || 'Erro ao criar transação');
  }
  return res.json();
}

export async function getAlertas(userId) {
  const res = await fetch(`${BACKEND_URL}/bot/alertas/${userId}`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function gerarCodigoVinculacao(phoneNumber) {
  const res = await fetch(`${BACKEND_URL}/bot/vincular`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phoneNumber }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function confirmarVinculacao(phoneNumber, code, userId) {
  const res = await fetch(`${BACKEND_URL}/bot/confirmar-vinculacao`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phoneNumber, code, userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro ao confirmar vinculação' }));
    throw new Error(err.error || 'Erro ao confirmar vinculação');
  }
  return res.json();
}

export async function verificarCodigo(phone, code) {
  const res = await fetch(`${BACKEND_URL}/bot/verificar-codigo/${phone}/${code}`, { headers });
  if (!res.ok) return { valid: false, error: 'Erro ao verificar código' };
  return res.json();
}
