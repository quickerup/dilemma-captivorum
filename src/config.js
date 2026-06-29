// Environment configuration loader for Cloudflare Workers
// All values are injected via wrangler.json (vars) or secrets (via wrangler secret put)

export function getConfig(env) {
  const {
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET,
    TON_WALLET_ADDRESS,
    TON_WALLET_MNEMONIC,
    TON_API_KEY,
    NETWORK = 'testnet',
    TON_API_ENDPOINT = 'https://testnet.toncenter.com/api/v2',
    ADMISSION_FEE_NANO = '100000000',
  } = env;

  if (!TELEGRAM_BOT_TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN');
  if (!TELEGRAM_WEBHOOK_SECRET) throw new Error('Missing TELEGRAM_WEBHOOK_SECRET');
  if (!TON_WALLET_ADDRESS) throw new Error('Missing TON_WALLET_ADDRESS');
  if (!TON_WALLET_MNEMONIC) throw new Error('Missing TON_WALLET_MNEMONIC');
  if (!TON_API_KEY) throw new Error('Missing TON_API_KEY');

  return {
    telegram: {
      botToken: TELEGRAM_BOT_TOKEN,
      webhookSecret: TELEGRAM_WEBHOOK_SECRET,
    },
    ton: {
      walletAddress: TON_WALLET_ADDRESS,
      mnemonic: TON_WALLET_MNEMONIC.split(' '),
      apiKey: TON_API_KEY,
      apiEndpoint: TON_API_ENDPOINT,
      network: NETWORK,
    },
    game: {
      admissionFeeNano: BigInt(ADMISSION_FEE_NANO),
    },
  };
}
