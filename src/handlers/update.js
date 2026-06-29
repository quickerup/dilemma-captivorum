import { sendMessage } from '../utils/telegram.js';
import { GameKV } from '../services/kv.js';
import { GameService } from '../services/game.js';
import { GAME_STATES, CHOICES } from '../constants.js';

export async function handleUpdate(update, env) {
  const { message, callback_query } = update;
  
  // Handle callback queries (inline buttons) – optional, not used in this version
  if (callback_query) {
    // Could implement button interactions
    return;
  }

  if (!message) return;
  const chatId = message.chat.id;
  const text = message.text || '';
  const userId = message.from?.id?.toString() || '';

  // Ignore non-command messages
  if (!text.startsWith('/')) return;

  // Parse command
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();

  // Initialize services
  const kv = new GameKV(env.GAME_KV);
  const gameService = new GameService({
    kv,
    config: env._config, // We'll inject config in index.js
    botToken: env.TELEGRAM_BOT_TOKEN,
  });

  switch (command) {
    case '/start':
      await handleStart(chatId, userId, gameService);
      break;

    case '/newgame':
      await handleNewGame(chatId, userId, gameService);
      break;

    case '/join':
      const gameIdToJoin = parts[1];
      if (!gameIdToJoin) {
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Usage: /join <game_id>');
        return;
      }
      await handleJoin(chatId, userId, gameIdToJoin, gameService);
      break;

    case '/choose':
      const gameId = parts[1];
      const choice = parts[2];
      if (!gameId || !choice) {
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Usage: /choose <game_id> cooperate|defect');
        return;
      }
      if (!Object.values(CHOICES).includes(choice)) {
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Invalid choice. Use "cooperate" or "defect".');
        return;
      }
      await handleChoose(chatId, userId, gameId, choice, gameService);
      break;

    case '/status':
      const gameIdStatus = parts[1];
      if (!gameIdStatus) {
        await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, 'Usage: /status <game_id>');
        return;
      }
      await handleStatus(chatId, gameIdStatus, gameService);
      break;

    default:
      // Ignore other commands
      break;
  }
}

// ---- Handlers ----

async function handleStart(chatId, userId, gameService) {
  const msg = `🤖 Welcome to TON Prisoner's Dilemma Bot!\n\nCommands:\n/newgame – Create a new game\n/join <game_id> – Join an existing game\n/choose <game_id> cooperate|defect – Make your choice\n/status <game_id> – Check game status`;
  await sendMessage(gameService.botToken, chatId, msg);
}

async function handleNewGame(chatId, userId, gameService) {
  const game = await gameService.createGame(chatId, userId);
  const msg = `✅ New game created!\nGame ID: ${game.id}\nEntry fee: ${game.admissionFee / 1e9} TON\nShare this ID with another player: /join ${game.id}\n\nSend exact fee to: ${gameService.config.ton.walletAddress}`;
  await sendMessage(gameService.botToken, chatId, msg);
}

async function handleJoin(chatId, userId, gameId, gameService) {
  try {
    const game = await gameService.joinGame(gameId, userId);
    const msg = `✅ Joined game ${gameId}!\nNow send the entry fee of ${game.admissionFee / 1e9} TON to the bot wallet. We'll detect it automatically.`;
    await sendMessage(gameService.botToken, chatId, msg);
  } catch (err) {
    await sendMessage(gameService.botToken, chatId, `❌ ${err.message}`);
  }
}

async function handleChoose(chatId, userId, gameId, choice, gameService) {
  try {
    const game = await gameService.makeChoice(gameId, userId, choice);
    const msg = `✅ Choice recorded. Waiting for opponent...`;
    await sendMessage(gameService.botToken, chatId, msg);
  } catch (err) {
    await sendMessage(gameService.botToken, chatId, `❌ ${err.message}`);
  }
}

async function handleStatus(chatId, gameId, gameService) {
  try {
    const game = await gameService.kv.getGame(gameId);
    if (!game) {
      await sendMessage(gameService.botToken, chatId, 'Game not found.');
      return;
    }
    let msg = `📊 Game ${gameId}\nState: ${game.state}\nPlayers: ${game.players.join(', ')}\nPaid: ${game.players.map(pid => `${pid}: ${game.paid[pid] ? '✅' : '❌'}`).join(', ')}`;
    if (game.state === GAME_STATES.ACTIVE) {
      const choices = game.players.map(pid => `${pid}: ${game.choices[pid] || '⏳'}`).join(', ');
      msg += `\nChoices: ${choices}`;
    }
    if (game.state === GAME_STATES.RESOLVED && game.result) {
      const [p1, p2] = game.players;
      msg += `\nResult: ${p1} got ${game.result[p1].payout / 1e9} TON, ${p2} got ${game.result[p2].payout / 1e9} TON`;
    }
    await sendMessage(gameService.botToken, chatId, msg);
  } catch (err) {
    await sendMessage(gameService.botToken, chatId, `❌ ${err.message}`);
  }
}
