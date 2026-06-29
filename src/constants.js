export const GAME_STATES = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  RESOLVED: 'resolved',
};

export const CHOICES = {
  COOPERATE: 'cooperate',
  DEFECT: 'defect',
};

// Payoff matrix – both players get points
export const PAYOFFS = {
  [CHOICES.COOPERATE]: {
    [CHOICES.COOPERATE]: { p1: 3, p2: 3 },
    [CHOICES.DEFECT]: { p1: 0, p2: 5 },
  },
  [CHOICES.DEFECT]: {
    [CHOICES.COOPERATE]: { p1: 5, p2: 0 },
    [CHOICES.DEFECT]: { p1: 1, p2: 1 },
  },
};
