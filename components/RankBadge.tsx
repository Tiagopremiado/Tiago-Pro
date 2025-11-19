import React from 'react';
import { CAREER_RANKS } from '../constants';
import { Medal, Crown, Zap, Shield, Target, Gem } from 'lucide-react';

interface Props {
  lifetimeProfit: number;
}

export const RankBadge: React.FC<Props> = ({ lifetimeProfit }) => {
  // Encontrar rank atual
  let currentRankIndex = 0;
  for (let i = 0; i < CAREER_RANKS.length; i++) {
      if (lifetimeProfit >= CAREER_RANKS[i].minProfit) {
          currentRankIndex = i;
      } else {
          break;
      }
  }
  
  const currentRank = CAREER_RANKS[currentRankIndex];
  const nextRank = CAREER_RANKS[currentRankIndex + 1];
  
  // Calcular progresso
  let progress = 100;
  if (nextRank) {
      const range = nextRank.minProfit - currentRank.minProfit;
      const current = lifetimeProfit - currentRank.minProfit;
      progress = Math.min(100, Math.max(0, (current / range) * 100));
  }

  const getIcon = (rankId: string) => {
      switch(rankId) {
          case 'rookie': return <Shield className="w-6 h-6" />;
          case 'apprentice': return <Target className="w-6 h-6" />;
          case 'pro': return <Medal className="w-6 h-6" />;
          case 'elite': return <Zap className="w-6 h-6" />;
          case 'master': return <Gem className="w-6 h-6" />;
          case 'baron': return <Crown className="w-6 h-6" />;
          default: return <Shield className="w-6 h-6" />;
      }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-900 border border-slate-600 ${currentRank.color}`}>
                    {getIcon(currentRank.id)}
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Patente Atual</p>
                    <h3 className={`text-lg font-black uppercase ${currentRank.color} drop-shadow-sm`}>
                        {currentRank.name}
                    </h3>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Lucro Vitalício</p>
                <p className="text-white font-mono font-bold">R$ {lifetimeProfit.toFixed(2)}</p>
            </div>
        </div>

        {/* Barra de Progresso */}
        {nextRank ? (
            <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                    <span>Progresso</span>
                    <span>Próximo: {nextRank.name} (R$ {nextRank.minProfit})</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                        className={`h-full transition-all duration-1000 ${currentRank.color.replace('text-', 'bg-')}`} 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        ) : (
            <div className="mt-2 text-center text-xs text-aviator-gold font-bold uppercase tracking-widest animate-pulse">
                Nível Máximo Alcançado! Você zerou o jogo.
            </div>
        )}
    </div>
  );
};