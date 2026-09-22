import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { CreditCardOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/currency';
import { getMonthName, getYearOptions } from '../utils/date';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

function Relatorios() {
  const { isDark } = useTheme();

  const tooltipStyle = {
    backgroundColor: isDark ? '#131f38' : '#ffffff',
    borderColor: isDark ? '#1e2f52' : '#e2e8f0',
    color: isDark ? '#f8fafc' : '#0f172a',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  };

  const axisStroke = isDark ? '#94a3b8' : '#64748b';

  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cartoesAnual, setCartoesAnual] = useState(null);
  const [modoGraficoCartao, setModoGraficoCartao] = useState('status'); // 'status' | 'cartoes'
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    loadData();
    setYearOptions(getYearOptions());
  }, [ano]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, c, ca] = await Promise.all([
        api.getTransacoes({ dataInicio: `${ano}-01-01`, dataFim: `${ano}-12-31` }),
        api.getCategorias(),
        api.getEstatisticasCartoesAnual(ano),
      ]);
      setTransacoes(t);
      setCategorias(c);
      setCartoesAnual(ca);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dadosMensais = () => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses.map((nome, i) => {
      const mes = i + 1;
      const transacoesMes = transacoes.filter(t => new Date(t.data).getMonth() + 1 === mes);
      const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + parseFloat(t.valor), 0);
      const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + parseFloat(t.valor), 0);
      return { nome, receitas, despesas, saldo: receitas - despesas };
    });
  };

  const dadosPorCategoria = () => {
    const cats = {};
    transacoes.filter(t => t.tipo === 'despesa').forEach(t => {
      const nome = t.categoria_nome || 'Sem categoria';
      const cor = t.categoria_cor || '#6b7280';
      if (!cats[nome]) {
        cats[nome] = { nome, total: 0, cor };
      }
      cats[nome].total += parseFloat(t.valor);
    });
    return Object.values(cats).sort((a, b) => b.total - a.total);
  };

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + parseFloat(t.valor), 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + parseFloat(t.valor), 0);

  return (
    <div>
      <h1 className="page-title">Relatórios</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="form-select" style={{ width: 120 }}>
          {yearOptions.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card receita">
          <div className="stat-header">
            <span className="stat-label">Total de Receitas ({ano})</span>
            <span className="stat-indicator positive">↑</span>
          </div>
          <div className="stat-value positive">{formatCurrency(totalReceitas)}</div>
        </div>
        <div className="stat-card despesa">
          <div className="stat-header">
            <span className="stat-label">Total de Despesas ({ano})</span>
            <span className="stat-indicator negative">↓</span>
          </div>
          <div className="stat-value negative">{formatCurrency(totalDespesas)}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-header">
            <span className="stat-label">Saldo do Ano</span>
            <span className="stat-indicator saldo">⚡</span>
          </div>
          <div className={`stat-value ${totalReceitas - totalDespesas >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalReceitas - totalDespesas)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Receitas vs Despesas por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosMensais()}>
            <XAxis dataKey="nome" stroke={axisStroke} />
            <YAxis stroke={axisStroke} />
            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b' }} />
            <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Evolução do Saldo Mensal</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dadosMensais()}>
            <XAxis dataKey="nome" stroke={axisStroke} />
            <YAxis stroke={axisStroke} />
            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Despesas por Categoria</h3>
        {dadosPorCategoria().length > 0 ? (
          <div>
            {dadosPorCategoria().map((cat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: cat.cor }}></span>
                  <span style={{ color: 'var(--text-primary)' }}>{cat.nome}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(cat.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhuma despesa registrada</div>
        )}
      </div>

      {cartoesAnual && cartoesAnual.cartoes && cartoesAnual.cartoes.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCardOutlined style={{ fontSize: 20, color: '#6366f1' }} />
              <h3 style={{ margin: 0 }}>Evolução de Faturas de Cartão ({ano})</h3>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={modoGraficoCartao === 'status' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', minHeight: 32, fontSize: 13 }}
                onClick={() => setModoGraficoCartao('status')}
              >
                Pagas vs Abertas
              </button>
              <button
                type="button"
                className={modoGraficoCartao === 'cartoes' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 12px', minHeight: 32, fontSize: 13 }}
                onClick={() => setModoGraficoCartao('cartoes')}
              >
                Por Cartão
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg-card-subtle)', padding: 14, borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Faturado no Ano</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                {formatCurrency(cartoesAnual.totalAno || 0)}
              </div>
            </div>
            <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4', padding: 14, borderRadius: 10, border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 12, color: isDark ? '#34d399' : '#166534' }}>Faturas Pagas</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#34d399' : '#15803d', marginTop: 4 }}>
                {formatCurrency(cartoesAnual.totalPagoAno || 0)}
              </div>
            </div>
            <div style={{ background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fef3c7', padding: 14, borderRadius: 10, border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #fde68a' }}>
              <div style={{ fontSize: 12, color: isDark ? '#fbbf24' : '#92400e' }}>Faturas em Aberto</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#fbbf24' : '#b45309', marginTop: 4 }}>
                {formatCurrency(cartoesAnual.totalAbertoAno || 0)}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cartoesAnual.dadosMensais}>
              <XAxis dataKey="nome" stroke={axisStroke} />
              <YAxis stroke={axisStroke} />
              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b' }} />
              {modoGraficoCartao === 'status' ? (
                <>
                  <Bar dataKey="totalPago" name="Faturas Pagas" fill="#22c55e" stackId="status" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="totalAberto" name="Faturas em Aberto" fill="#f59e0b" stackId="status" radius={[2, 2, 0, 0]} />
                </>
              ) : (
                cartoesAnual.cartoes.map((c) => (
                  <Bar
                    key={c.id}
                    dataKey={c.nome}
                    name={c.nome}
                    fill={c.cor || '#6366f1'}
                    stackId="cartoes"
                    radius={[2, 2, 0, 0]}
                  />
                ))
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Relatorios;
