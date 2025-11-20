import React, { useState } from 'react';
import { CAREER_RANKS } from '../constants';
import { Medal, Crown, Zap, Shield, Target, Gem, ChevronRight, Lock, CheckCircle2, X, TrendingUp } from 'lucide-react';

interface Props {
  lifetimeProfit: number;
}

export const RankBadge: React.FC<Props> = ({ lifetimeProfit }) => {
  const [showModal, setShowModal] = useState(false);

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
  let profitNeeded = 0;

  if (nextRank) {
      const range = nextRank.minProfit - currentRank.minProfit;
      const current = lifetimeProfit - currentRank.minProfit;
      progress = Math.min(100, Math.max(0, (current / range) * 100));
      profitNeeded = nextRank.minProfit - lifetimeProfit;
  }

  const getIcon = (rankId: string, className = "w-6 h-6") => {
      switch(rankId) {
          case 'rookie': return <Shield className={className} />;
          case 'apprentice': return <Target className={className} />;
          case 'pro': return <Medal className={className} />;
          case 'elite': return <Zap className={className} />;
          case 'master': return <Gem className={className} />;
          case 'baron': return <Crown className={className} />;
          default: return <Shield className={className} />;
      }
  };

  return (
    <>
        {/* --- CARD PRINCIPAL (CLICÁVEL) --- */}
        <div 
            onClick={() => setShowModal(true)}
            className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-aviator-gold/50 rounded-xl p-4 relative overflow-hidden cursor-pointer transition-all group shadow-lg"
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-[10px] text-aviator-gold uppercase font-bold bg-slate-900/80 px-2 py-1 rounded-full border border-aviator-gold/30">
                    Ver Plano de Carreira <ChevronRight className="w-3 h-3" />
                </div>
            </div>

            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-900 border border-slate-600 ${currentRank.color} group-hover:scale-110 transition-transform duration-300`}>
                        {getIcon(currentRank.id)}
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            Patente Atual
                        </p>
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
                <div className="mt-3 relative">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                        <span className="flex items-center gap-1 font-bold text-emerald-500">{progress.toFixed(1)}% Concluído</span>
                        <span>Próximo: {nextRank.name}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                            className={`h-full transition-all duration-1000 ${currentRank.color.replace('text-', 'bg-')}`} 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-right text-slate-600 mt-1">
                        Faltam <span className="text-slate-400 font-mono">R$ {profitNeeded.toFixed(2)}</span> para subir de nível
                    </p>
                </div>
            ) : (
                <div className="mt-2 text-center text-xs text-aviator-gold font-bold uppercase tracking-widest animate-pulse">
                    Nível Máximo Alcançado! Você zerou o jogo.
                </div>
            )}
        </div>

        {/* --- MODAL DE PLANO DE CARREIRA --- */}
        {showModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                    
                    {/* Header Modal */}
                    <div className="p-5 border-b border-slate-800 bg-slate-900 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-aviator-gold" /> Plano de Carreira
                            </h2>
                            <p className="text-xs text-slate-400">Sua jornada rumo ao topo.</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body Scrollable */}
                    <div className="overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        
                        {/* Missão Atual */}
                        {nextRank && (
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-xl mb-6">
                                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Missão Atual</p>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-white font-bold">Alcançar {nextRank.name}</span>
                                    <span className="text-emerald-400 font-mono font-bold text-sm">Faltam R$ {profitNeeded.toFixed(2)}</span>
                                </div>
                                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                    <div 
                                        className={`h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000`} 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Lista de Patentes */}
                        <div className="space-y-3 relative">
                            {/* Linha conectora vertical */}
                            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-800 z-0"></div>

                            {CAREER_RANKS.map((rank, index) => {
                                const isUnlocked = lifetimeProfit >= rank.minProfit;
                                const isCurrent = rank.id === currentRank.id;
                                const isNext = rank.id === nextRank?.id;

                                return (
                                    <div 
                                        key={rank.id} 
                                        className={`relative z-10 flex items-center gap-4 p-3 rounded-xl border transition-all ${
                                            isCurrent 
                                                ? 'bg-slate-800 border-aviator-gold/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]' 
                                                : isUnlocked 
                                                    ? 'bg-slate-900 border-emerald-900/30 opacity-70' 
                                                    : 'bg-slate-950 border-slate-800 opacity-50 grayscale'
                                        }`}
                                    >
                                        {/* Ícone de Status */}
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                            isCurrent ? `bg-slate-900 ${rank.color} border-aviator-gold` :
                                            isUnlocked ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/50' :
                                            'bg-slate-900 text-slate-600 border-slate-700'
                                        }`}>
                                            {isUnlocked && !isCurrent ? <CheckCircle2 className="w-6 h-6" /> : 
                                             !isUnlocked ? <Lock className="w-5 h-5" /> :
                                             getIcon(rank.id, "w-6 h-6")}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <h4 className={`font-bold uppercase text-sm ${isCurrent ? 'text-white' : rank.color}`}>
                                                    {rank.name}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="text-[9px] bg-aviator-gold text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                                                        VOCÊ ESTÁ AQUI
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {rank.minProfit === 0 ? 'Nível Inicial' : `Lucro Acumulado: R$ ${rank.minProfit.toLocaleString('pt-BR')}`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};