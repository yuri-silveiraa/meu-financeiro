import dotenv from 'dotenv';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { handleIncomingMessage } from './messageHandler.js';
import { sendDailyAlerts } from './alerts.js';
import cron from 'node-cron';

dotenv.config();

const logger = pino({ level: 'silent' });
const SESSION_DIR = process.env.SESSION_DIR || './whatsapp-session';
const PORT = process.env.BOT_PORT || 3002;

let sock = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: ['Meu Financeiro Bot', 'Chrome', '4.0.0'],
    markOnlineOnConnect: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Escaneie o QR Code abaixo com seu WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ Conexão fechada. Motivo: ${reason}`);

      if (reason !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconectando em 5 segundos...');
        setTimeout(startBot, 5000);
      } else {
        console.log('🚪 Sessão encerrada. Apague a pasta', SESSION_DIR, 'e reinicie.');
      }
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado ao WhatsApp!');
      scheduleAlerts();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        try {
          await handleIncomingMessage(sock, msg);
        } catch (err) {
          console.error('Erro ao processar mensagem:', err.message);
        }
      }
    }
  });

  sock.ev.on('messages.update', (messages) => {
    for (const msg of messages) {
      if (msg.update.status === 3) {
        console.log(`📩 Mensagem ${msg.key.id} foi lida`);
      }
    }
  });
}

let scheduledTask = null;

function scheduleAlerts() {
  if (scheduledTask) scheduledTask.stop();
  scheduledTask = cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Verificando alertas diários...');
    await sendDailyAlerts(sock);
  }, { timezone: 'America/Sao_Paulo' });
}

startBot().catch(console.error);

process.on('SIGINT', () => {
  console.log('🛑 Bot encerrando...');
  process.exit(0);
});
