const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Não autorizado');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}

export const api = {
  // Auth
  loginWithGoogle: (credential) => request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  getMe: () => request('/auth/me'),

  // Transações
  getTransacoes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/transacoes${query ? `?${query}` : ''}`);
  },
  addTransacao: (data) => request('/api/transacoes', { method: 'POST', body: JSON.stringify(data) }),
  updateTransacao: (id, data) => request(`/api/transacoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransacao: (id) => request(`/api/transacoes/${id}`, { method: 'DELETE' }),
  togglePago: (id) => request(`/api/transacoes/${id}/pago`, { method: 'PATCH' }),

  // Categorias
  getCategorias: () => request('/api/categorias'),
  addCategoria: (data) => request('/api/categorias', { method: 'POST', body: JSON.stringify(data) }),
  updateCategoria: (id, data) => request(`/api/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategoria: (id) => request(`/api/categorias/${id}`, { method: 'DELETE' }),

  // Contas
  getContas: () => request('/api/contas'),
  addConta: (data) => request('/api/contas', { method: 'POST', body: JSON.stringify(data) }),
  updateConta: (id, data) => request(`/api/contas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConta: (id) => request(`/api/contas/${id}`, { method: 'DELETE' }),

  // Metas
  getMetas: () => request('/api/metas'),
  addMeta: (data) => request('/api/metas', { method: 'POST', body: JSON.stringify(data) }),
  updateMeta: (id, data) => request(`/api/metas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Gastos Fixos
  getGastosFixos: () => request('/api/gastos-fixos'),
  addGastoFixo: (data) => request('/api/gastos-fixos', { method: 'POST', body: JSON.stringify(data) }),
  updateGastoFixo: (id, data) => request(`/api/gastos-fixos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGastoFixo: (id) => request(`/api/gastos-fixos/${id}`, { method: 'DELETE' }),

  // Estatísticas
  getEstatisticas: (mes, ano) => request(`/api/estatisticas?mes=${mes}&ano=${ano}`),

  // Previsões
  getPrevisoes: () => request('/api/previsoes'),

  // WhatsApp Bot
  gerarCodigoVinculacao: (phoneNumber) =>
    request('/api/whatsapp/vincular', { method: 'POST', body: JSON.stringify({ phoneNumber }) }),
};
