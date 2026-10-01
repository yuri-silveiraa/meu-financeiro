import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={{
    padding: '16px 24px',
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border-color)',
    marginTop: 'auto',
  }}>
    <span>© {new Date().getFullYear()} Meu Financeiro</span>
    <span style={{ margin: '0 8px' }}>·</span>
    <Link to="/termos" style={{ color: 'var(--text-secondary)' }}>Termos de Uso</Link>
    <span style={{ margin: '0 8px' }}>·</span>
    <Link to="/privacidade" style={{ color: 'var(--text-secondary)' }}>Privacidade</Link>
  </footer>
);

export default Footer;
