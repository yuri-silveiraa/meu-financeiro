import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils/currency';
import { getMonthName, getYearOptions } from '../utils/date';
import { api } from '../services/api';
import EmptyState from '../components/EmptyState';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6b7280'];

function Dashboard() {
  const [estatisticas, setEstatisticas] = useState({ receitas: 0, despesas: 0, saldo: 0, saldoProjetado: 0, despesasNaoPagas: 0, porCategoria: [], porPagamento: [] });
  const [previsoes, setPrevisoes] = useState([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEstatisticas();
    loadPrevisoes();
    setYearOptions(getYearOptions());
  }, [mes, ano]);

  const loadEstatisticas = async () => {
    try {
      setError(null);
      const data = await api.getEstatisticas(mes, ano);
      setEstatisticas(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Erro ao carregar dados do dashboard');
    }
  };

  const loadPrevisoes = async () => {
    try {
      const data = await api.getPrevisoes();
      setPrevisoes(data);
    } catch (err) {
      console.error('Erro ao carregar previsões:', err);
    }
  };

  const irParaMesAnterior = () => {
    if (mes === 1) {
      setMes(12);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  };

  const irParaProximoMes = () => {
    if (mes === 12) {
      setMes(1);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  };

  return (
    <div>
      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <h1 className="page-title">Dashboard</h1>

      <div className="dashboard-nav">
        <button className="nav-arrow" onClick={irParaMesAnterior} aria-label="Mês anterior">‹</button>
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="form-select">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>{getMonthName(i)}</option>
          ))}
        </select>
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="form-select">
          {yearOptions.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button className="nav-arrow" onClick={irParaProximoMes} aria-label="Próximo mês">›</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card receita">
          <div className="stat-label">Receitas do mês</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{formatCurrency(estatisticas.receitas)}</div>
        </div>
        <div className="stat-card despesa">
          <div className="stat-label">Despesas do mês</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{formatCurrency(estatisticas.despesas)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Despesas Não Pagas</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(estatisticas.despesasNaoPagas)}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-label">Saldo Projetado</div>
          <div className="stat-value" style={{ color: estatisticas.saldoProjetado >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(estatisticas.saldoProjetado)}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>(inclui não pagas)</div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Gastos por Categoria</h3>
          {estatisticas.porCategoria.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={estatisticas.porCategoria}
                  dataKey="total"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                >
                  {estatisticas.porCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon="📉"
              title="Sem despesas no mês"
              description="Adicione transações para visualizar os gastos por categoria."
            />
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Gastos por Tipo de Pagamento</h3>
          {estatisticas.porPagamento.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={estatisticas.porPagamento.map(p => ({ ...p, tipo: p.tipo_pagamento || 'Outros' }))}>
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon="📊"
              title="Sem dados de pagamento"
              description="Adicione transações para ver os gastos por tipo de pagamento."
            />
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Previsão Mensal</h3>
        {previsoes.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={previsoes} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="categoria" width={100} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="media_mensal" name="Média Mensal" radius={[0, 4, 4, 0]}>
                {previsoes.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.tipo === 'receita' ? '#22c55e' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon="📅"
            title="Sem previsões"
            description="Adicione itens fixos para ver previsões mensais."
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
