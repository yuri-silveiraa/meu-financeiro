import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils/currency';
import { getMonthName, getYearOptions } from '../utils/date';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6b7280'];

function Dashboard() {
  const [estatisticas, setEstatisticas] = useState({ receitas: 0, despesas: 0, saldo: 0, saldoProjetado: 0, despesasNaoPagas: 0, porCategoria: [], porPagamento: [] });
  const [previsoes, setPrevisoes] = useState([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    loadEstatisticas();
    loadPrevisoes();
    setYearOptions(getYearOptions());
  }, [mes, ano]);

  const loadEstatisticas = async () => {
    const data = await window.api.getEstatisticas(mes, ano);
    setEstatisticas(data);
  };

  const loadPrevisoes = async () => {
    const data = await window.api.getPrevisoes();
    setPrevisoes(data);
  };

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="form-select" style={{ width: 150 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>{getMonthName(i)}</option>
          ))}
        </select>
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="form-select" style={{ width: 100 }}>
          {yearOptions.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
            <div className="empty-state">Nenhuma despesa registrada</div>
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
            <div className="empty-state">Nenhuma despesa registrada</div>
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
              <Tooltip formatter={(value, name, props) => formatCurrency(value)} />
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
          <div className="empty-state">Adicione itens fixos para ver previsões</div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;