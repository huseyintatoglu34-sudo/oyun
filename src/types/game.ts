export type GameId = 'geometry-dash' | 'fifa-soccer' | 'tower-royale';

export interface GameMetadata {
  id: GameId;
  title: string;
  subtitle: string;
  genre: string;
  badge: string;
  icon: string;
  description: string;
}

export interface PlayerStats {
  geometryDash: {
    bestPercentage: number;
    totalAttempts: number;
    jumps: number;
    completed: boolean;
  };
  fifa: {
    cupsWon: number;
    goalsScored: number;
    matchesPlayed: number;
    penaltiesSaved: number;
  };
  towerRoyale: {
    trophies: number;
    battlesWon: number;
    crownsWon: number;
    towersDestroyed: number;
  };
  totalPoints: number;
  level: number;
  levelXp: number;
}

export interface DailyQuest {
  id: string;
  gameId: GameId;
  title: string;
  rewardPoints: number;
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}
