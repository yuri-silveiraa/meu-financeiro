import { getUserByPhone, verificarCodigo, confirmarVinculacao } from './apiClient.js';
import { handleCommand } from './commandHandler.js';

export async function handleIncomingMessage(sock, message) {
  const from = message.key.remoteJid;
  const isGroup = from.endsWith('@g.us');
  if (isGroup) return;

  const phone = from.replace('@s.whatsapp.net', '');
  const text = getMessageText(message);
  if (!text || text.trim().length === 0) return;

  const user = await getUserByPhone(phone);

  // Fluxo de vinculação
  if (!user) {
    await handleUnlinked(sock, from, phone, text);
    return;
  }

  // Processar comando
  const reply = await handleCommand(text, user.id);
  if (reply) {
    await sock.sendMessage(from, { text: reply });
  }
}

async function handleUnlinked(sock, to, phone, text) {
  const lower = text.toLowerCase().trim();

  if (lower === 'ajuda' || lower === 'menu' || lower === 'help') {
    await sock.sendMessage(to, {
      text: `👋 Olá! Para usar este bot, você precisa vincular seu WhatsApp.

🔗 Como vincular:
1. Acesse o app Meu Financeiro
2. Vá em Configurações → WhatsApp
3. Clique em "Gerar Código"
4. Envie o código aqui

💬 Comando para iniciar: *vincular*`
    });
    return;
  }

  if (lower === 'vincular' || lower === 'link') {
    await sock.sendMessage(to, {
      text: `🔗 Para vincular:
1. Acesse o app Meu Financeiro
2. Vá em Configurações → WhatsApp
3. Clique em "Gerar Código"
4. Envie o código aqui

⚠️ O código expira em 15 minutos.`
    });
    return;
  }

  // Verificar se é um código de 6 dígitos
  const codeMatch = text.trim().match(/^(\d{6})$/);
  if (codeMatch) {
    await handleLinkCode(sock, to, phone, codeMatch[1]);
    return;
  }

  await sock.sendMessage(to, {
    text: `👋 Este WhatsApp não está vinculado.

Para usar o bot, acesse o app Meu Financeiro e vincule seu número.

💬 Digite *ajuda* para mais informações.`
  });
}

async function handleLinkCode(sock, to, phone, code) {
  try {
    const result = await verificarCodigo(phone, code);

    if (!result.valid) {
      await sock.sendMessage(to, {
        text: `❌ ${result.error || 'Código inválido'}.

Se você ainda não gerou um código, acesse o app Meu Financeiro em Configurações → WhatsApp.`
      });
      return;
    }

    // Código válido — confirmar vinculação automaticamente
    const userId = result.userId;
    if (!userId) {
      await sock.sendMessage(to, {
        text: `📩 Código ${code} recebido!

⚠️ Para completar a vinculação, acesse o app Meu Financeiro em Configurações → WhatsApp e clique em "Confirmar Vinculação".`
      });
      return;
    }

    await confirmarVinculacao(phone, code, userId);

    await sock.sendMessage(to, {
      text: `✅ WhatsApp vinculado com sucesso!

Agora você pode usar comandos como:
• *saldo* - Ver saldo do mês
• *gastei 50 mercado* - Registrar despesa
• *recebi 3000 salario* - Registrar receita
• *pendentes* - Ver despesas pendentes
• *ajuda* - Ver todos os comandos`
    });
  } catch (err) {
    console.error('Erro ao processar código:', err.message);
    await sock.sendMessage(to, {
      text: '❌ Erro ao processar código. Tente novamente.'
    });
  }
}

function getMessageText(message) {
  const msg = message.message;
  if (!msg) return '';
  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
  if (msg.buttonsResponseMessage?.selectedButtonId) return msg.buttonsResponseMessage.selectedButtonId;
  if (msg.listResponseMessage?.singleSelectReply?.selectedRowId) return msg.listResponseMessage.singleSelectReply.selectedRowId;
  return '';
}
