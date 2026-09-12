const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

const apiHeaders = {
  'Content-Type': 'application/json',
  'X-API-KEY': process.env.BOT_API_KEY || '',
};

export async function checkAlerts(sock, userId, phone) {
  try {
    const res = await fetch(`${BACKEND_URL}/bot/alertas/${userId}`, { headers: apiHeaders });
    if (!res.ok) return;
    const alertas = await res.json();
    if (!alertas || alertas.length === 0) return;

    let msg = '🔔 *Alertas do dia*\n\n';
    for (const a of alertas) {
      msg += `${a.mensagem}\n`;
    }

    const jid = phone + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: msg });
  } catch (err) {
    console.error('Erro ao verificar alertas:', err.message);
  }
}

export async function sendDailyAlerts(sock) {
  try {
    const res = await fetch(`${BACKEND_URL}/bot/users-with-whatsapp`, { headers: apiHeaders });
    if (!res.ok) return;
    const users = await res.json();

    for (const { id, whatsapp_number } of users) {
      try {
        await checkAlerts(sock, id, whatsapp_number);
      } catch (err) {
        console.error(`Erro ao enviar alerta para ${whatsapp_number}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar usuários para alertas:', err.message);
  }
}
