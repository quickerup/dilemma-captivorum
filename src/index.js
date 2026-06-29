import { getConfig } from './config.js';
import { handleUpdate } from './handlers/update.js';
import { GameKV } from './services/kv.js';
import { GameService } from './services/game.js';
import { verifyTelegramSignature, setWebhook, deleteWebhook } from './utils/telegram.js';
import { createTonClient } from './utils/ton.js';

// Cloudflare Worker entry point
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Inject config into env for handlers
      env._config = getConfig(env);

      // Handle webhook verification/management via GET
      if (request.method === 'GET' && path === '/webhook') {
        const action = url.searchParams.get('action');
        if (action === 'set') {
          const webhookUrl = url.searchParams.get('url');
          if (!webhookUrl) {
            return new Response('Missing url param', { status: 400 });
          }
          const result = await setWebhook(env.TELEGRAM_BOT_TOKEN, webhookUrl, env.TELEGRAM_WEBHOOK_SECRET);
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else if (action === 'delete') {
          const result = await deleteWebhook(env.TELEGRAM_BOT_TOKEN);
          return new Response(JSON.stringify({ ok: result }), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          return new Response('Use ?action=set&url=<webhook_url> or ?action=delete', { status: 400 });
        }
      }

      // Handle Telegram webhook POST
      if (request.method === 'POST' && path === '/webhook') {
        // Verify signature using secret token
        if (!verifyTelegramSignature(request, env.TELEGRAM_WEBHOOK_SECRET)) {
          return new Response('Unauthorized', { status: 403 });
        }

        const update = await request.json();
        // Process update asynchronously – respond quickly to Telegram
        // Fire-and-forget to avoid timeout; use waitUntil to keep it alive
        context.waitUntil(handleUpdate(update, env).catch(err => console.error('Update handler error:', err)));

        return new Response('OK', { status: 200 });
      }

      // Health check
      if (path === '/health') {
        return new Response('OK', { status: 200 });
      }

      return new Response('Not found', { status: 404 });
    } catch (err) {
      console.error('Worker error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  // Cron trigger – runs every 2 minutes as defined in wrangler.json
  async scheduled(event, env, context) {
    console.log('Cron: checking pending payments...');
    try {
      env._config = getConfig(env);
      const kv = new GameKV(env.GAME_KV);
      const gameService = new GameService({
        kv,
        config: env._config,
        botToken: env.TELEGRAM_BOT_TOKEN,
      });
      await gameService.checkPendingPayments();
      console.log('Cron: payment check completed.');
    } catch (err) {
      console.error('Cron error:', err);
    }
  },
};
