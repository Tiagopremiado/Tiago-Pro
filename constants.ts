import { StrategyType, CareerRank } from './types';
import { Medal, Crown, Zap, Shield, Target, Gem } from 'lucide-react';

export const INITIAL_CONFIG = {
  initialCapital: 100, // Valor padrão inicial
  currentCapital: 100,
  betPercentage: 3.5, // UPDATED: Padrão solicitado de 3.5%
  stopLossPercentage: 15, // Média entre 10 e 20%
  stopWinPercentage: 7.5, // Média entre 5 e 10%
  dailyGoalPercentage: 5.0, // Meta conservadora padrão
  defaultTargetMultiplier: 2.00, // UPDATED: Padrão solicitado de 2.00x
  strategyDefaults: {
    [StrategyType.EARLY_CASHOUT]: 2.00, // UPDATED: Agora inicia em 2.00x
    [StrategyType.TWO_BETS]: 2.00,
    [StrategyType.TWO_BETS + '_COVER']: 1.20, // Alvo da aposta de cobertura
    [StrategyType.MANUAL]: 0
  }
};

export const INITIAL_STATE = {
    config: { ...INITIAL_CONFIG },
    sessions: [],
    currentSessionRounds: [],
    isSessionActive: false,
    sessionStartTime: null,
    hasCompletedOnboarding: false
};

export const STRATEGIES = [
  {
    id: StrategyType.EARLY_CASHOUT,
    name: 'Estratégia Principal (2.00x)', // Renamed to reflect new default
    description: 'Foco no alvo principal da gestão.',
    minMult: 1.50,
    maxMult: 2.50
  },
  {
    id: StrategyType.TWO_BETS,
    name: 'Duas Apostas (Cobertura)',
    description: '60% da aposta em 1.20x (cobertura) e 40% buscando 2.00x+.',
    minMult: 1.20,
    maxMult: 2.00
  },
  {
    id: StrategyType.MANUAL,
    name: 'Manual / Outra',
    description: 'Estratégia livre (Cuidado com a disciplina).',
    minMult: 0,
    maxMult: 0
  }
];

// Sistema de Patentes (Gamificação)
export const CAREER_RANKS: Omit<CareerRank, 'icon'>[] = [
    { id: 'rookie', name: 'Aspirante', minProfit: 0, color: 'text-slate-400' },
    { id: 'apprentice', name: 'Aprendiz', minProfit: 100, color: 'text-blue-400' },
    { id: 'pro', name: 'Profissional', minProfit: 500, color: 'text-emerald-400' },
    { id: 'elite', name: 'Elite Sniper', minProfit: 2000, color: 'text-purple-400' },
    { id: 'master', name: 'Mestre da Banca', minProfit: 5000, color: 'text-aviator-red' },
    { id: 'baron', name: 'Barão do Aviator', minProfit: 10000, color: 'text-aviator-gold' },
];

export const STORAGE_KEY = 'tiago_aviator_pro_v1';