import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { CreditCardOutlined, RightOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { getMonthName, getYearOptions } from '../utils/date';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import EmptyState from '../components/EmptyState';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6b7280'];

function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const tooltipStyle = {
    backgroundColor: isDark ? '#131f38' : '#ffffff',
    borderColor: isDark ? '#1e2f52' : '#e2e8f0',
    color: isDark ? '#f8fafc' : '#0f172a',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  };

  const axisStroke = isDark ? '#94a3b8' : '#64748b';

  const [estatisticas, setEstatisticas] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    saldoProjetado: 0,
    despesasNaoPagas: 0,
    porCategoria: [],
    porPagamento: [],
    faturasMes: { total: 0, totalPagas: 0, totalAbertas: 0, qtd: 0, todasPagas: false },
    limitesCartoes: { limiteTotal: 0, limiteComprometido: 0, limiteDisponivel: 0, percentualUsado: 0, totalCartoes: 0 },
    projecaoFaturas: [],
    cartoesInfo: []
  });
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
          <div className="stat-header">
            <span className="stat-label">Receitas do mês</span>
            <span className="stat-indicator positive">↑</span>
          </div>
          <div className="stat-value positive">{formatCurrency(estatisticas.receitas)}</div>
        </div>
        <div className="stat-card despesa">
          <div className="stat-header">
            <span className="stat-label">Despesas do mês</span>
            <span className="stat-indicator negative">↓</span>
          </div>
          <div className="stat-value negative">{formatCurrency(estatisticas.despesas)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Despesas Não Pagas</span>
            <span className="stat-indicator neutral" style={{ background: 'rgba(245, 158, 11, 0.16)', color: '#f59e0b' }}>⏳</span>
          </div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{formatCurrency(estatisticas.despesasNaoPagas)}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-header">
            <span className="stat-label">Saldo Projetado</span>
            <span className="stat-indicator saldo">⚡</span>
          </div>
          <div className={`stat-value ${estatisticas.saldoProjetado >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(estatisticas.saldoProjetado)}
          </div>
          <div className="stat-note">(inclui não pagas)</div>
        </div>

        {/* Card Faturas do Mês */}
        <div
          className="stat-card"
          onClick={() => navigate('/cartoes')}
          style={{ cursor: 'pointer', position: 'relative' }}
          title="Clique para gerenciar cartões e faturas"
        >
          <div className="stat-header">
            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCardOutlined style={{ color: '#818cf8' }} /> Faturas do Mês
            </span>
            <RightOutlined style={{ fontSize: 11, color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value" style={{ color: '#818cf8' }}>
            {formatCurrency(estatisticas.faturasMes?.total || 0)}
          </div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            {estatisticas.faturasMes?.qtd === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>Sem faturas neste mês</span>
            ) : estatisticas.faturasMes?.todasPagas ? (
              <span style={{ color: '#10b981', fontWeight: 500 }}>✓ Faturas pagas</span>
            ) : (
              <span style={{ color: '#ef4444', fontWeight: 500 }}>
                {formatCurrency(estatisticas.faturasMes?.totalAbertas || 0)} pendente
              </span>
            )}
          </div>
        </div>

        {/* Card Limite dos Cartões */}
        <div
          className="stat-card"
          onClick={() => navigate('/cartoes')}
          style={{ cursor: 'pointer', position: 'relative' }}
          title="Clique para ver limites e faturas"
        >
          <div className="stat-header">
            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCardOutlined style={{ color: '#38bdf8' }} /> Limite dos Cartões
            </span>
            <RightOutlined style={{ fontSize: 11, color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value positive">
            {formatCurrency(estatisticas.limitesCartoes?.limiteDisponivel || 0)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            livre de {formatCurrency(estatisticas.limitesCartoes?.limiteTotal || 0)}
          </div>
          {estatisticas.limitesCartoes?.limiteTotal > 0 && (
            <div style={{ width: '100%', height: 4, background: 'var(--border-color)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${estatisticas.limitesCartoes.percentualUsado}%`,
                  height: '100%',
                  background: estatisticas.limitesCartoes.percentualUsado > 80 ? '#ef4444' : '#6366f1',
                  borderRadius: 2
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Projeção de Faturas Futuras */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCardOutlined style={{ color: '#6366f1' }} />
              Projeção de Faturas dos Cartões (Próximos 6 Meses)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Valores já comprometidos por compras parceladas e gastos fixos em cada fatura
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/cartoes')}
            style={{ fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Ver Detalhes dos Cartões <RightOutlined style={{ fontSize: 10 }} />
          </button>
        </div>

        {estatisticas.projecaoFaturas?.some((p) => p.total > 0) ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={estatisticas.projecaoFaturas}>
              <XAxis dataKey="label" stroke={axisStroke} />
              <YAxis tickFormatter={(val) => formatCurrency(val)} stroke={axisStroke} />
              <Tooltip formatter={(value, name) => [formatCurrency(value), name]} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b' }} />
              {estatisticas.cartoesInfo?.length > 0 ? (
                estatisticas.cartoesInfo.map((cartao) => (
                  <Bar
                    key={cartao.id}
                    dataKey={cartao.nome}
                    name={cartao.nome}
                    stackId="faturas"
                    fill={cartao.cor || '#6366f1'}
                    radius={[2, 2, 0, 0]}
                  />
                ))
              ) : (
                <Bar dataKey="total" name="Total Fatura" fill="#6366f1" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon="💳"
            title="Sem faturas futuras comprometidas"
            description="Quando você fizer compras parceladas no cartão de crédito, a projeção dos próximos 6 meses aparecerá aqui."
          />
        )}
      </div>

      <div className="dashboard-charts" style={{ marginTop: 20 }}>
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
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
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
                <XAxis dataKey="tipo" stroke={axisStroke} />
                <YAxis stroke={axisStroke} />
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Previsão Mensal</h3>
        {previsoes.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={previsoes} layout="vertical">
              <XAxis type="number" stroke={axisStroke} />
              <YAxis type="category" dataKey="categoria" width={100} stroke={axisStroke} />
              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b' }} />
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
