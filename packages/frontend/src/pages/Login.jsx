import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleOutlined, LoadingOutlined } from '@ant-design/icons';


export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Carregar o script do Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme: 'outline',
              size: 'large',
              width: 350,
            }
          );
        }

        // Tentar One Tap se disponível
        window.google.accounts.id.prompt();
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      setIsLoggingIn(true);
      await login(response.credential);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setIsLoggingIn(false);
    }
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
          marginBottom: 32
        }}>
          Gerencie suas finanças, faturas de cartão e metas de forma moderna e inteligente.
        </p>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 48,
            marginTop: 16,
          }}
          onMouseEnter={() => !isLoggingIn && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Botão azul estilizado visível */}
          <button
            type="button"
            disabled={isLoggingIn}
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
              pointerEvents: 'none',
            }}
          >
            {isLoggingIn ? (
              <LoadingOutlined style={{ fontSize: 18 }} />
            ) : (
              <GoogleOutlined style={{ fontSize: 18 }} />
            )}
            {isLoggingIn ? 'Entrando...' : 'Entrar com Google'}
          </button>

          {/* Overlay invisível do botão oficial do Google (aciona popup real no clique) */}
          <div
            ref={googleButtonRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.001,
              zIndex: 10,
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'scale(1.05)',
              transformOrigin: 'center center',
            }}
          />
        </div>

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
