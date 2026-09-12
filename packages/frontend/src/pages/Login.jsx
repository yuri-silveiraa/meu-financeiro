import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Typography } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

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
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: 'outline', size: 'large', width: '100%' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      await login(response.credential);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 400, textAlign: 'center', padding: '40px 20px' }}>
        <Title level={2} style={{ marginBottom: 8 }}>Meu Financeiro</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
          Gerencie suas finanças de forma simples e inteligente
        </Text>
        <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center' }}></div>
        <Button
          type="primary"
          icon={<GoogleOutlined />}
          size="large"
          block
          onClick={() => {
            if (window.google) {
              window.google.accounts.id.prompt();
            }
          }}
          style={{ marginTop: 16 }}
        >
          Entrar com Google
        </Button>
      </Card>
    </div>
  );
}
