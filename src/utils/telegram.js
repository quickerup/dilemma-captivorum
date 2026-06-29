// Telegram Bot API client – lightweight wrapper using fetch

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export async function sendMessage(botToken, chatId, text, extra = {}) {
  const url = `${TELEGRAM_API_BASE}${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Telegram sendMessage failed: ${resp.status} ${errText}`);
  }
  return resp.json();
}

export async function setWebhook(botToken, webhookUrl, secretToken) {
  const url = `${TELEGRAM_API_BASE}${botToken}/setWebhook`;
  const payload = {
    url: webhookUrl,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`setWebhook failed: ${resp.status} ${errText}`);
  }
  return resp.json();
}

export async function deleteWebhook(botToken) {
  const url = `${TELEGRAM_API_BASE}${botToken}/deleteWebhook`;
  const resp = await fetch(url, { method: 'POST' });
  return resp.ok;
}

// Verify that the incoming request came from Telegram using the secret token
export function verifyTelegramSignature(request, secretToken) {
  const token = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  return token === secretToken;
}

// Parse update from request body
export async function parseUpdate(request) {
  const body = await request.json();
  return body; // Telegram Update object
}
