import { GAME_STATES, CHOICES, PAYOFFS } from '../constants.js';

export class GameService {
  constructor(kv) {
    this.kv = kv;
  }

  async createGame(creatorId) {
    const id = this._generateId();
    const game = {
      id,
      creatorId,
      joinerId: null,
      paid: {},
      choices: {},
      state: GAME_STATES.WAITING,
      createdAt: Date.now(),
    };
    await this.kv.saveGame(id, game);
    return game;
  }

  async joinGame(gameId, joinerId) {
    const game = await this.kv.getGame(gameId);
    if (!game) throw new Error('Game not found');
    if (game.state !== GAME_STATES.WAITING) throw new Error('Game already started');
    if (game.joinerId) throw new Error('Game already has a second player');
    if (game.creatorId === joinerId) throw new Error('You are the creator, wait for another player');

    game.joinerId = joinerId;
    // Initialize paid flags
    game.paid[game.creatorId] = false;
    game.paid[joinerId] = false;
    // Do NOT transition to ACTIVE until both paid
    await this.kv.saveGame(gameId, game);
    return game;
  }

  async markPaid(gameId, playerId) {
    const game = await this.kv.getGame(gameId);
    if (!game) throw new Error('Game not found');
    if (game.state === GAME_STATES.RESOLVED) throw new Error('Game already resolved');
    if (game.state === GAME_STATES.ACTIVE) throw new Error('Game already active');
    if (game.creatorId !== playerId && game.joinerId !== playerId) throw new Error('You are not in this game');
    if (game.paid[playerId]) throw new Error('You already paid');

    game.paid[playerId] = true;
    await this.kv.saveGame(gameId, game);

    // Check if both have paid
    const players = [game.creatorId, game.joinerId];
    if (players.every(id => game.paid[id])) {
      game.state = GAME_STATES.ACTIVE;
      await this.kv.saveGame(gameId, game);
    }
    return game;
  }

  async makeChoice(gameId, playerId, choice) {
    const game = await this.kv.getGame(gameId);
    if (!game) throw new Error('Game not found');
    if (game.state !== GAME_STATES.ACTIVE) throw new Error('Game not active');
    if (game.creatorId !== playerId && game.joinerId !== playerId) throw new Error('You are not in this game');
    if (game.choices[playerId]) throw new Error('You already chose');
    if (!Object.values(CHOICES).includes(choice)) throw new Error('Invalid choice');

    game.choices[playerId] = choice;
    await this.kv.saveGame(gameId, game);

    const players = [game.creatorId, game.joinerId];
    if (players.every(id => game.choices[id])) {
      await this.resolveGame(gameId);
    }
    return game;
  }

  async resolveGame(gameId) {
    const game = await this.kv.getGame(gameId);
    if (!game || game.state === GAME_STATES.RESOLVED) return;

    const choice1 = game.choices[game.creatorId];
    const choice2 = game.choices[game.joinerId];
    const payoff = PAYOFFS[choice1][choice2];

    game.result = {
      [game.creatorId]: { choice: choice1, points: payoff.p1 },
      [game.joinerId]: { choice: choice2, points: payoff.p2 },
    };
    game.state = GAME_STATES.RESOLVED;
    await this.kv.saveGame(gameId, game);
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  }
}
