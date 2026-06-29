# TON Prisoner's Dilemma Telegram Bot

A Telegram bot for playing the Prisoner's Dilemma game on the TON blockchain, deployed as a Cloudflare Worker.

## Features

- Create games with a fixed entry fee (default 0.1 TON)
- Join games by sending the fee to the bot's wallet
- Choose cooperate or defect
- Automatic payment verification via TON Center API
- Cron job to check for pending payments
- Automatic game resolution and payout distribution
- Stores game state in Cloudflare KV

## Architecture

- **Cloudflare Workers** – serverless execution environment
- **KV Store** – persistent game state
- **TON Blockchain** – payment processing and payouts
- **Telegram Bot API** – user interaction via commands
- **Cron Triggers** – periodic payment checks

## Prerequisites

- Node.js (v18+) and npm
- Cloudflare account with Workers & KV enabled
- TON wallet with testnet/mainnet funds
- Telegram Bot token (from [@BotFather](https://t.me/BotFather))

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd ton-prisoners-dilemma-bot
npm install
```

2. Configure Wrangler

Copy wrangler.json and replace the KV namespace IDs:

```bash
# Create KV namespace
npx wrangler kv namespace create GAME_KV
# Copy the ID and preview_id into wrangler.json
```

3. Set Secrets

Use wrangler secret put for sensitive values (never commit them):

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put TON_WALLET_ADDRESS
npx wrangler secret put TON_WALLET_MNEMONIC
npx wrangler secret put TON_API_KEY
```

4. Deploy

```bash
# Deploy to testnet (default)
npm run deploy

# Deploy to production (mainnet)
npm run deploy:prod
```

5. Set Webhook

After deployment, set the Telegram webhook:

```bash
curl "https://your-worker.dev/webhook?action=set&url=https://your-worker.dev/webhook"
```

Commands

· /start – Show help
· /newgame – Create a new game
· /join <game_id> – Join an existing game
· /choose <game_id> cooperate|defect – Make your choice
· /status <game_id> – Check game status

Game Flow

1. Player A creates a game with /newgame
2. Player B joins with /join <game_id>
3. Both players send exactly the admission fee (0.1 TON) to the bot's wallet
4. The bot detects the payments (via cron or on-demand verification)
5. Once both have paid, the game becomes active
6. Each player chooses cooperate or defect via /choose
7. Once both have chosen, the game resolves automatically
8. Payouts are distributed based on the Prisoner's Dilemma matrix:
   · Both cooperate: each gets 1.5x fee (mutual benefit)
   · One defects, one cooperates: defector gets 2x fee, cooperator gets 0 (exploitation)
   · Both defect: each gets 0.5x fee (mutual loss)

Development

Run locally:

```bash
npm run dev
```

This starts a local dev server with a webhook simulation.

License

MIT

# dilemma-captivorum
# dilemma-captivorum
