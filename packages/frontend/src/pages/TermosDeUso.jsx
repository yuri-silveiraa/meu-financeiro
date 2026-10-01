import { Link } from 'react-router-dom';

export default function TermosDeUso() {
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
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 16, marginBottom: 24 }}>📄 Termos de Uso</h1>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div style={{ fontSize: 14, lineHeight: 1.8, color: '#cbd5e1' }}>
          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar o aplicativo <strong>Meu Financeiro</strong>, você concorda com estes Termos de Uso. Caso não concorde com alguma condição, não utilize o serviço.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>2. Descrição do Serviço</h2>
          <p>O Meu Financeiro é uma plataforma de gestão financeira pessoal que permite o controle de receitas, despesas, cartões de crédito, metas e gastos fixos. O serviço é fornecido "como está" para uso pessoal.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>3. Cadastro e Conta</h2>
          <p>O acesso ao serviço é realizado exclusivamente via autenticação Google. Ao realizar login, você autoriza o acesso ao seu nome, e-mail e foto de perfil do Google. Você é responsável por manter a segurança da sua conta Google.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>4. Responsabilidades do Usuário</h2>
          <ul style={{ paddingLeft: 20 }}>
            <li>Fornecer informações verdadeiras e atualizadas.</li>
            <li>Não utilizar o serviço para fins ilícitos ou não autorizados.</li>
            <li>Não tentar acessar dados de outros usuários.</li>
            <li>Manter a confidencialidade de suas credenciais de acesso.</li>
          </ul>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>5. Propriedade Intelectual</h2>
          <p>Todo o conteúdo, design, código-fonte e funcionalidades do Meu Financeiro são de propriedade do desenvolvedor. É proibida a reprodução, distribuição ou modificação sem autorização prévia.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>6. Limitação de Responsabilidade</h2>
          <p>O Meu Financeiro não se responsabiliza por decisões financeiras tomadas com base nas informações apresentadas no aplicativo. Os dados inseridos são de responsabilidade exclusiva do usuário. Não garantimos disponibilidade ininterrupta do serviço.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>7. Alterações nos Termos</h2>
          <p>Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento. As alterações entram em vigor imediatamente após a publicação. O uso continuado do serviço após alterações implica na aceitação dos novos termos.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>8. Legislação Aplicável</h2>
          <p>Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca do desenvolvedor para dirimir quaisquer controvérsias.</p>

          <h2 style={{ fontSize: 18, color: '#f8fafc', marginTop: 24, marginBottom: 12 }}>9. Contato</h2>
          <p>Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail disponibilizado na plataforma.</p>
        </div>
      </div>
    </div>
  );
}
