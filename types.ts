export enum StrategyType {
  EARLY_CASHOUT = 'SAQUE_PRECOCE',
  TWO_BETS = 'DUAS_APOSTAS',
  MANUAL = 'MANUAL'
}

export interface BankrollConfig {
  initialCapital: number;
  currentCapital: number;
  betPercentage: number; // 1-2%
  stopLossPercentage: number; // 10-20%
  stopWinPercentage: number; // 5-10%
  dailyGoalPercentage: number; // New: Meta de Juros Compostos
  defaultTargetMultiplier?: number; // New: Alvo padrão de saque
  strategyDefaults?: Record<string, number>; // New: Multiplicadores padrão por estratégia
}

export interface Round {
  id: string;
  timestamp: number;
  betAmount: number;
  multiplier: number;
  win: boolean;
  profit: number;
  strategy: StrategyType;
}

export interface DailySession {
  id: string;
  date: string;
  startBalance: number;
  endBalance: number;
  profit: number;
  durationSeconds: number;
  rounds: number;
  status: 'WIN' | 'LOSS' | 'BREAK_EVEN';
  roundsDetail?: Round[]; // Histórico detalhado das jogadas
}

export interface CareerRank {
  id: string;
  name: string;
  minProfit: number;
  color: string;
  icon: any; // Lucide Icon name context
}

export interface AppState {
  config: BankrollConfig;
  sessions: DailySession[];
  currentSessionRounds: Round[];
  isSessionActive: boolean;
  sessionStartTime: number | null;
  hasCompletedOnboarding: boolean; // Novo: Flag para controlar se o setup inicial foi feito
}