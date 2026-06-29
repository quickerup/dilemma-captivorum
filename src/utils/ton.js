import { TonClient } from '@ton/ton';
import { Address, toNano, fromNano } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';

// Validate TON address format
export function isValidAddress(address) {
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
}

// Create a TonClient instance
export function createTonClient(config) {
  return new TonClient({
    endpoint: config.apiEndpoint,
    apiKey: config.apiKey,
  });
}

// Get bot wallet from mnemonic
export async function getBotWallet(config) {
  const keyPair = await mnemonicToPrivateKey(config.mnemonic);
  const address = Address.parse(config.walletAddress);
  return { keyPair, address };
}

// Verify that a payment of exactly the admission fee was sent to the bot's wallet
export async function verifyPayment(client, botAddress, expectedAmountNano, userAddress) {
  // Get recent transactions (simplified – you'd want to paginate/check timestamps)
  const transactions = await client.getTransactions(botAddress, { limit: 10 });
  
  for (const tx of transactions) {
    // Check if incoming, from user, and amount matches
    if (tx.inMessage?.info?.src && tx.inMessage.info.src.equals(userAddress)) {
      const value = tx.inMessage.info.value;
      if (value === expectedAmountNano) {
        return true;
      }
    }
  }
  return false;
}

// Check wallet balance
export async function getBalance(client, address) {
  const balance = await client.getBalance(address);
  return balance;
}

// Convert nanoTON to human-readable TON
export function nanoToTon(nano) {
  return fromNano(nano);
}

// Convert TON to nanoTON
export function tonToNano(ton) {
  return toNano(ton);
}
