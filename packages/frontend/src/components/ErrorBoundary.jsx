import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-primary, #f8fafc)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Ops! Algo deu errado ao carregar esta tela.</h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', maxWidth: 450, marginBottom: 20, fontSize: 14 }}>
            Ocorreu um erro inesperado. Tente recarregar a página para restabelecer a conexão com o sistema.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={this.handleReload}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
