// KV storage abstraction for game data

import { KV_KEYS } from '../constants.js';

export class GameKV {
  constructor(kvNamespace) {
    this.kv = kvNamespace;
  }

  // ---- Game ----

  async getGame(gameId) {
    const key = `${KV_KEYS.GAME_PREFIX}${gameId}`;
    const data = await this.kv.get(key, 'json');
    return data || null;
  }

  async saveGame(gameId, gameData) {
    const key = `${KV_KEYS.GAME_PREFIX}${gameId}`;
    await this.kv.put(key, JSON.stringify(gameData));
  }

  async deleteGame(gameId) {
    const key = `${KV_KEYS.GAME_PREFIX}${gameId}`;
    await this.kv.delete(key);
  }

  // ---- Player ----

  async getPlayer(playerId) {
    const key = `${KV_KEYS.PLAYER_PREFIX}${playerId}`;
    const data = await this.kv.get(key, 'json');
    return data || null;
  }

  async savePlayer(playerId, playerData) {
    const key = `${KV_KEYS.PLAYER_PREFIX}${playerId}`;
    await this.kv.put(key, JSON.stringify(playerData));
  }

  // ---- Helpers ----

  // List all active games (by scanning keys) – use with caution, can be expensive
  async listActiveGames() {
    const list = await this.kv.list({ prefix: KV_KEYS.GAME_PREFIX });
    const keys = list.keys.map(k => k.name);
    const games = [];
    for (const key of keys) {
      const data = await this.kv.get(key, 'json');
      if (data && data.state !== 'resolved') {
        games.push({ id: key.replace(KV_KEYS.GAME_PREFIX, ''), ...data });
      }
    }
    return games;
  }
}
