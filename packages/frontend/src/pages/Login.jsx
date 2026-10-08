import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Alert, message } from 'antd';

export default function Login() {
  const { user, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      setIsLoggingIn(true);
      loginWithToken(token)
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Erro ao autenticar com token:', err);
          setErrorMessage('Falha ao concluir login. Tente novamente.');
          setIsLoggingIn(false);
        });
    } else if (error) {
      setErrorMessage(decodeURIComponent(error));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, loginWithToken, navigate, setSearchParams]);

  const handleGoogleLogin = () => {
    if (!consentAccepted) {
      message.warning('Por favor, aceite os Termos de Uso e Política de Privacidade antes de entrar.');
      return;
    }

    setIsLoggingIn(true);
    const apiBase = import.meta.env.VITE_API_URL || '';
    window.location.href = `${apiBase}/auth/google?consentAccepted=true`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 15%, rgba(59, 130, 246, 0.22) 0%, transparent 50%), radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 45%), #080d19',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative ambient blurred ring */}
      <div style={{
        position: 'absolute',
        width: 320,
        height: 320,
        background: 'rgba(59, 130, 246, 0.12)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        top: '10%',
        left: '20%',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(19, 31, 56, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(59, 130, 246, 0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Brand Logo Avatar */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
          fontSize: 28
        }}>
          💎
        </div>

        <h1 style={{
          fontSize: 26,
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: 8,
          letterSpacing: '-0.03em'
        }}>
          Meu Financeiro
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: 14,
          lineHeight: 1.5,
          marginBottom: 24
        }}>
          Gerencie suas finanças, faturas de cartão e metas de forma moderna e inteligente.
        </p>

        {errorMessage && (
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <Alert
              message={errorMessage}
              type="error"
              showIcon
              closable
              onClose={() => setErrorMessage(null)}
            />
          </div>
        )}

        <div
          style={{
            position: 'relative',
            width: '100%',
            marginTop: 8,
          }}
          onMouseEnter={() => !isLoggingIn && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Botão de login oficial com redirecionamento direto */}
          <button
            type="button"
            disabled={isLoggingIn}
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoggingIn ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: isHovered
                ? '0 6px 20px rgba(37, 99, 235, 0.45)'
                : '0 4px 16px rgba(37, 99, 235, 0.35)',
              transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'all 0.2s ease',
              opacity: isLoggingIn ? 0.75 : 1,
            }}
          >
            {isLoggingIn ? (
              <LoadingOutlined style={{ fontSize: 18 }} />
            ) : (
              <GoogleOutlined style={{ fontSize: 18 }} />
            )}
            {isLoggingIn ? 'Redirecionando...' : 'Entrar com Google'}
          </button>
        </div>

        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          marginTop: 20, fontSize: 12, color: '#94a3b8',
          textAlign: 'left', cursor: 'pointer',
          lineHeight: 1.5
        }}>
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            style={{ marginTop: 2, accentColor: '#3b82f6', flexShrink: 0 }}
          />
          <span>
            Li e aceito os{' '}
            <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Termos de Uso</a>
            {' '}e a{' '}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Política de Privacidade</a>.
          </span>
        </label>

        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 12,
          color: '#64748b',
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <span>✦ Cartões & Faturas</span>
          <span>✦ Previsibilidade</span>
          <span>✦ WhatsApp Bot</span>
        </div>
      </div>
    </div>
  );
}
