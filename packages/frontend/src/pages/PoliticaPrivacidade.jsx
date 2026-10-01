import { Link } from 'react-router-dom';

export default function PoliticaPrivacidade() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 15%, rgba(59, 130, 246, 0.22) 0%, transparent 50%), #080d19',
      padding: '40px 20px',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        background: 'rgba(19, 31, 56, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 24,
        padding: '40px 32px',
      }}>
        <Link to="/login" style={{ color: '#60a5fa', fontSize: 14, textDecoration: 'none' }}>← Voltar</Link>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16, marginBottom: 24 }}>🔐 Política de Privacidade</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>Última atualização: {new Date().toLocaleDateString('pt-BR')} — Em conformidade com a LGPD (Lei 13.709/2018)</p>

        <div style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1' }}>
          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>1. Dados Coletados</h2>
          <p>Ao utilizar o Meu Financeiro, coletamos os seguintes dados pessoais:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Dados de identificação:</strong> nome, e-mail e foto de perfil (obtidos via Google OAuth).</li>
            <li><strong>Dados financeiros:</strong> transações, categorias, contas bancárias, cartões de crédito, metas e gastos fixos que você cadastrar voluntariamente.</li>
            <li><strong>Dados de uso:</strong> data de criação da conta, data de aceite dos termos e endereço IP no momento do consentimento.</li>
            <li><strong>Dados de comunicação:</strong> número de WhatsApp, caso você opte por vincular o bot.</li>
          </ul>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>2. Finalidade do Tratamento</h2>
          <p>Seus dados são utilizados exclusivamente para:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Autenticação e identificação do usuário.</li>
            <li>Funcionamento das funcionalidades do aplicativo (controle financeiro).</li>
            <li>Envio de notificações e alertas via WhatsApp (quando autorizado).</li>
            <li>Melhoria do serviço e correção de erros.</li>
          </ul>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>3. Base Legal (Art. 7º, LGPD)</h2>
          <p>O tratamento dos seus dados pessoais tem como base legal:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Consentimento (Art. 7º, I):</strong> fornecido ao aceitar estes termos durante o cadastro.</li>
            <li><strong>Execução de contrato (Art. 7º, V):</strong> necessário para a prestação do serviço contratado.</li>
          </ul>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>4. Compartilhamento de Dados</h2>
          <p><strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong> para fins comerciais. Os dados podem ser compartilhados apenas:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Com o Google, para fins de autenticação (Google OAuth).</li>
            <li>Por obrigação legal ou ordem judicial.</li>
          </ul>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>5. Seus Direitos (Art. 18, LGPD)</h2>
          <p>Como titular dos dados, você tem direito a:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Acesso:</strong> consultar quais dados pessoais possuímos sobre você.</li>
            <li><strong>Correção:</strong> solicitar a atualização de dados incompletos ou incorretos.</li>
            <li><strong>Eliminação:</strong> solicitar a exclusão dos seus dados pessoais e da sua conta.</li>
            <li><strong>Portabilidade:</strong> exportar seus dados em formato legível (JSON).</li>
            <li><strong>Revogação do consentimento:</strong> retirar seu consentimento a qualquer momento.</li>
          </ul>
          <p style={{ marginTop: 8 }}>Estes direitos podem ser exercidos diretamente na seção <strong>"Privacidade e Dados"</strong> dentro das Configurações do aplicativo.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>6. Retenção de Dados</h2>
          <p>Seus dados são armazenados enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, todos os dados são removidos permanentemente e de forma irreversível dos nossos servidores.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>7. Segurança</h2>
          <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo:</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>Criptografia em trânsito (HTTPS/TLS).</li>
            <li>Autenticação via tokens JWT com expiração.</li>
            <li>Isolamento de dados por usuário no banco de dados.</li>
            <li>Rate limiting para proteção contra ataques de força bruta.</li>
            <li>Headers de segurança HTTP via Helmet.</li>
          </ul>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>8. Cookies e Armazenamento Local</h2>
          <p>O Meu Financeiro utiliza <strong>localStorage</strong> do navegador para armazenar o token de autenticação (JWT). Não utilizamos cookies de rastreamento ou analytics de terceiros.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>9. Alterações nesta Política</h2>
          <p>Esta política pode ser atualizada periodicamente. Alterações significativas serão comunicadas por meio do aplicativo. O uso continuado após alterações implica na aceitação da nova política.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>10. Contato do Controlador</h2>
          <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato pelo e-mail disponibilizado na plataforma.</p>
        </div>
      </div>
    </div>
  );
}
