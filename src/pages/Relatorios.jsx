import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { formatCurrency, getMonthName, getYearOptions } from '../utils/date';

function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [tipoRelatorio, setTipoRelatorio] = useState('mensal');
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
      const [t, c] = await Promise.all([
        window.api.getTransacoes({ dataInicio: `${ano}-01-01`, dataFim: `${ano}-12-31` }),
        window.api.getCategorias()
      ]);
      setTransacoes(t);
      setCategorias(c);
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
      const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
      const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
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
      cats[nome].total += t.valor;
    });
    return Object.values(cats).sort((a, b) => b.total - a.total);
  };

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);

  return (
    <div>
      <h1 className="page-title">Relatórios</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="form-select" style={{ width: 120 }}>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card receita">
          <div className="stat-label">Total de Receitas ({ano})</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{formatCurrency(totalReceitas)}</div>
        </div>
        <div className="stat-card despesa">
          <div className="stat-label">Total de Despesas ({ano})</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{formatCurrency(totalDespesas)}</div>
        </div>
        <div className="stat-card saldo">
          <div className="stat-label">Saldo do Ano</div>
          <div className="stat-value" style={{ color: totalReceitas - totalDespesas >= 0 ? '#22c55e' : '#ef4444' }}>
            {formatCurrency(totalReceitas - totalDespesas)}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Receitas vs Despesas por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosMensais()}>
            <XAxis dataKey="nome" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="receitas" name="Receitas" fill="#22c55e" />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Evolução do Saldo Mensal</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dadosMensais()}>
            <XAxis dataKey="nome" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Despesas por Categoria</h3>
        {dadosPorCategoria().length > 0 ? (
          <div>
            {dadosPorCategoria().map((cat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: cat.cor }}></span>
                  <span>{cat.nome}</span>
                </div>
                <span style={{ fontWeight: 500 }}>{formatCurrency(cat.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhuma despesa registrada</div>
        )}
      </div>
    </div>
  );
}

export default Relatorios;