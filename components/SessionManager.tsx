import React, { useState, useEffect, useRef } from 'react';
import { BankrollConfig, Round, StrategyType } from '../types';
import { STRATEGIES } from '../constants';
import { SmartRecoveryModal } from './SmartRecoveryModal';
import { ExternalAnalysis, AnalysisMode } from './ExternalAnalysis';
import { TiagoLogo } from './TiagoLogo';
import { Play, Square, PlusCircle, Clock, TrendingUp, TrendingDown, AlertTriangle, Trophy, Target, Volume2, Lock, ShieldCheck, Ban, Timer, Hash, Check, Settings, Zap, Wallet, Shield, Crosshair, ArrowUpRight, Calculator, Map, Eye } from 'lucide-react';

interface Props {
  config: BankrollConfig;
  isActive: boolean;
  rounds: Round[];
  startTime: number | null;
  onStart: () => void;
  onEnd: () => void;
  onAddRound: (round: Round) => void;
  onUpdateConfig: (newConfig: BankrollConfig) => void;
  lockStatus?: 'WIN' | 'LOSS' | null;
  todayProfit?: number;
}

export const SessionManager: React.FC<Props> = ({
  config,
  isActive,
  rounds,
  startTime,
  onStart,
  onEnd,
  onAddRound,
  onUpdateConfig,
  lockStatus,
  todayProfit = 0
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  // Recommended Bet calculation
  const recommendedBet = (config.currentCapital * (config.betPercentage / 100)).toFixed(2);
  
  const [betInput, setBetInput] = useState<string>(recommendedBet);
  // UPDATED: Fallback to 2.00 instead of 1.20
  const [multInput, setMultInput] = useState<string>(config.defaultTargetMultiplier?.toString() || '2.00');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>(StrategyType.EARLY_CASHOUT);
  const [timeToUnlock, setTimeToUnlock] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [showStrategyConfig, setShowStrategyConfig] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  
  // REPLACED simple boolean with Mode State for Split View support
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('closed');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-open analysis in SPLIT MODE when session starts
  useEffect(() => {
      if (isActive && startTime) {
          // Apenas abre se for o início da sessão (tempo zerado ou muito baixo)
          if (elapsedTime < 2) {
              setAnalysisMode('split');
          }
      } else {
          // If session is not active, reset or keep based on user action.
          // Usually we want Recon Mode to be separate.
      }
  }, [isActive, startTime]);

  // Auto-update bet input when recommended bet changes (Compound Interest effect)
  useEffect(() => {
    setBetInput(recommendedBet);
  }, [recommendedBet]);

  // --- FIXED GOAL LOGIC ---
  // We need to calculate the daily goal based on the START of session capital, not current.
  // But `config.currentCapital` updates live.
  // We can reverse engineer the start capital of this specific session using `todayProfit` if we assume one session per day, 
  // but better is to use `config.currentCapital` minus `sessionProfit` (local session).
  // HOWEVER, to fix the "Moving Target Paradox", the goal needs to be calculated based on the capital BEFORE this session started.
  
  const sessionProfit = rounds.reduce((acc, r) => acc + r.profit, 0);
  
  // The capital before THIS session began.
  const sessionStartCapital = config.currentCapital - sessionProfit;
  
  // Fixed calculations based on Session Start Capital
  const stopLossValue = -(sessionStartCapital * (config.stopLossPercentage / 100));
  
  const dailyGoalPercent = config.dailyGoalPercentage || 5;
  const dailyGoalValue = (sessionStartCapital * (dailyGoalPercent / 100));
  
  // Remaining Goal = The fixed goal amount minus what we made so far
  const remainingGoal = Math.max(0, dailyGoalValue - sessionProfit);
  
  const hitStopLoss = sessionProfit <= stopLossValue;
  const hitDailyGoal = sessionProfit >= dailyGoalValue;

  const twoBetsTarget = config.strategyDefaults?.[StrategyType.TWO_BETS] || 2.00;
  const twoBetsCover = config.strategyDefaults?.[StrategyType.TWO_BETS + '_COVER'] || 1.20;

  // --- FLIGHT PLAN CALCULATOR (Quantas vitórias faltam?) ---
  const calculateRoundsNeeded = (targetMult: number, currentBet: number) => {
      if (targetMult <= 1 || currentBet <= 0) return 0;
      
      let profitPerRound = 0;
      
      // Lógica complexa para Duas Apostas vs Simples
      if (selectedStrategy === StrategyType.TWO_BETS) {
          const cover = config.strategyDefaults?.[StrategyType.TWO_BETS + '_COVER'] || 1.20;
          // Assumindo que o input multInput é o alvo principal
          const target = parseFloat(multInput) || 2.00; 
          
          // Lucro = (Bet*0.6 * Cover) + (Bet*0.4 * Target) - BetTotal
          const gainCover = (currentBet * 0.60) * cover;
          const gainTarget = (currentBet * 0.40) * target;
          profitPerRound = (gainCover + gainTarget) - currentBet;
      } else {
          profitPerRound = currentBet * (targetMult - 1);
      }

      if (profitPerRound <= 0) return 0;
      if (remainingGoal <= 0) return 0;
      
      return Math.ceil(remainingGoal / profitPerRound);
  };

  // Calcula dinamicamente baseado no input atual do usuário
  const activeRoundsNeeded = calculateRoundsNeeded(parseFloat(multInput) || 1.20, parseFloat(betInput) || 0);

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isActive && startTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(seconds);
        
        if (seconds === 1800) {
            playAlertSound();
        }
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  useEffect(() => {
      if (lockStatus) {
          const timer = setInterval(() => {
              const now = new Date();
              const tomorrow = new Date(now);
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 1, 0);
              
              const diff = tomorrow.getTime() - now.getTime();
              if (diff <= 0) {
                  window.location.reload(); 
              } else {
                  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                  const s = Math.floor((diff % (1000 * 60)) / 1000);
                  setTimeToUnlock(`${h}h ${m}m ${s}s`);
              }
          }, 1000);
          return () => clearInterval(timer);
      }
  }, [lockStatus]);


  useEffect(() => {
      if(isActive) {
         if (selectedStrategy === StrategyType.TWO_BETS) {
             const defaultForStrategy = config.strategyDefaults?.[StrategyType.TWO_BETS];
             if (defaultForStrategy) setMultInput(defaultForStrategy.toString());
         } else {
             const defaultForStrategy = config.strategyDefaults?.[selectedStrategy];
             if (defaultForStrategy && defaultForStrategy > 0) {
                 setMultInput(defaultForStrategy.toString());
             }
         }
      } else {
         setMultInput(config.defaultTargetMultiplier?.toString() || '2.00');
      }
  }, [selectedStrategy, config.strategyDefaults, isActive]);


  const handleStrategyDefaultChange = (strategyKey: string, value: string) => {
      const numValue = parseFloat(value);
      if (onUpdateConfig && !isNaN(numValue)) {
          const newDefaults = { ...config.strategyDefaults, [strategyKey]: numValue };
          onUpdateConfig({
              ...config,
              strategyDefaults: newDefaults
          });
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddRound = (win: boolean, overrideMult?: number, overrideStrategy?: StrategyType) => {
    const bet = parseFloat(betInput);
    const mult = overrideMult !== undefined ? overrideMult : (parseFloat(multInput) || 0);
    const strategy = overrideStrategy || selectedStrategy;
    
    if (isNaN(bet) || bet <= 0) return;

    let profit = 0;
    
    if (win) {
      if (strategy === StrategyType.TWO_BETS) {
          const cover = config.strategyDefaults?.[StrategyType.TWO_BETS + '_COVER'] || 1.20;
          const target = mult; 
          
          const gainCover = (bet * 0.60) * cover;
          const gainTarget = (bet * 0.40) * target;
          const totalReturn = gainCover + gainTarget;
          profit = totalReturn - bet;
      } else {
          profit = (bet * mult) - bet;
      }
    } else {
      profit = -bet;
    }

    const newRound: Round = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      betAmount: bet,
      multiplier: mult,
      win,
      profit,
      strategy: strategy
    };

    onAddRound(newRound);
  };

  const handleTwoBetsQuickWin = () => {
    const defaultTarget = config.strategyDefaults?.[StrategyType.TWO_BETS] || 2.00;
    setMultInput(defaultTarget.toString());
    setSelectedStrategy(StrategyType.TWO_BETS);
    handleAddRound(true, defaultTarget, StrategyType.TWO_BETS);
  };
  
  const handleRecoveryApply = (bet: number, mult: number) => {
      setBetInput(bet.toFixed(2));
      setMultInput(mult.toFixed(2));
  };

  const handleEndClick = () => {
    setShowSummary(true);
  };

  const confirmEndSession = () => {
    setShowSummary(false);
    setAnalysisMode('closed');
    onEnd();
  };

  const isOverTime = elapsedTime >= 1800; 
  const quickMultipliers = ['1.10', '1.20', '1.30', '1.50', '2.00'];

  // --- LOCKED SCREEN ---
  if (lockStatus && !isActive) {
      const isWin = lockStatus === 'WIN';
      return (
          <div className={`flex flex-col items-center justify-center py-12 px-4 rounded-xl border shadow-2xl relative overflow-hidden ${isWin ? 'bg-slate-900 border-emerald-800' : 'bg-slate-900 border-red-900'}`}>
              <div className="absolute inset-0 opacity-5 pointer-events-none" 
                  style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
              </div>
              <div className={`mb-6 p-6 rounded-full ${isWin ? 'bg-emerald-900/30' : 'bg-red-900/30'} animate-pulse`}>
                 {isWin ? <ShieldCheck className="w-16 h-16 text-emerald-400" /> : <Ban className="w-16 h-16 text-red-500" />}
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest text-center">SISTEMA BLOQUEADO</h3>
              <p className="font-mono text-3xl font-bold mb-6 text-slate-300 bg-slate-950 px-6 py-2 rounded-lg border border-slate-800">{timeToUnlock || "Calculando..."}</p>
              <div className="bg-slate-950/80 p-6 rounded-lg max-w-sm text-center border border-slate-800 shadow-inner">
                  {isWin ? (
                      <>
                        <p className="text-emerald-400 font-bold text-lg mb-2">META BATIDA! (+R$ {todayProfit.toFixed(2)})</p>
                        <p className="text-slate-400 text-sm italic">"A ganância é o túmulo do lucro. Saia com orgulho."</p>
                      </>
                  ) : (
                      <>
                        <p className="text-red-400 font-bold text-lg mb-2">STOP LOSS ATINGIDO ({todayProfit.toFixed(2)})</p>
                        <p className="text-slate-400 text-sm italic">"Não tente recuperar. Disciplina vale mais que dinheiro."</p>
                      </>
                  )}
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs text-slate-600 uppercase tracking-wider">
                  <Lock className="w-3 h-3" /> Liberação Automática: 00:01
              </div>
          </div>
      );
  }

  // --- START SCREEN ---
  if (!isActive) {
    const recBetVal = parseFloat(recommendedBet);
    // Calculate Flight Plan Scenarios
    const planConservative = Math.ceil(dailyGoalValue / (recBetVal * (1.20 - 1)));
    const planModerate = Math.ceil(dailyGoalValue / (recBetVal * (1.50 - 1)));
    const planAggressive = Math.ceil(dailyGoalValue / (recBetVal * (2.00 - 1)));

    return (
      <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-aviator-red/10 rounded-full blur-3xl"></div>

         {/* RECON MODE ANALYSIS */}
         <ExternalAnalysis 
             mode={analysisMode} 
             setMode={setAnalysisMode} 
             isSessionActive={false}
         />

         <div className="pt-8 pb-4 px-6 text-center border-b border-slate-800/50">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 mb-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sistema Pronto</span>
             </div>

             {/* LOGO TIAGO PRO */}
             <div className="flex justify-center mb-4">
                <TiagoLogo className="w-20 h-20 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
             </div>

             <h1 className="text-2xl font-black text-white tracking-tight">PAINEL DE CONTROLE</h1>
             <p className="text-slate-400 text-sm mt-1">Prepare-se para a operação de hoje.</p>
         </div>

         <div className="p-6 space-y-4">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-1 border border-emerald-500/30 shadow-lg">
                 <div className="bg-slate-950/50 rounded-lg p-4 flex items-center justify-between">
                     <div>
                         <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                             <Target className="w-4 h-4" /> Meta do Dia ({dailyGoalPercent}%)
                         </div>
                         <div className="text-3xl font-black text-white">
                             +R$ {dailyGoalValue.toFixed(2)}
                         </div>
                     </div>
                     <div className="bg-emerald-500/10 p-3 rounded-full">
                         <Trophy className="w-8 h-8 text-emerald-400" />
                     </div>
                 </div>
             </div>

             {/* FLIGHT PLAN / EFFORT CALCULATOR */}
             <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
                 <div className="flex items-center gap-2 text-slate-400 mb-3">
                     <Map className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase tracking-wider">Plano de Voo (Esforço Estimado)</span>
                 </div>
                 <div className="grid grid-cols-3 gap-2">
                     <div className="bg-slate-900 p-2 rounded border border-emerald-900/30 text-center">
                         <p className="text-[10px] text-slate-500">Seguro (1.20x)</p>
                         <p className="text-lg font-black text-emerald-400">{planConservative}</p>
                         <p className="text-[9px] text-slate-600">Wins Nec.</p>
                     </div>
                     <div className="bg-slate-900 p-2 rounded border border-yellow-900/30 text-center">
                         <p className="text-[10px] text-slate-500">Moderado (1.50x)</p>
                         <p className="text-lg font-black text-aviator-gold">{planModerate}</p>
                         <p className="text-[9px] text-slate-600">Wins Nec.</p>
                     </div>
                     <div className="bg-slate-900 p-2 rounded border border-red-900/30 text-center">
                         <p className="text-[10px] text-slate-500">Turbo (2.00x)</p>
                         <p className="text-lg font-black text-red-400">{planAggressive}</p>
                         <p className="text-[9px] text-slate-600">Wins Nec.</p>
                     </div>
                 </div>
                 <p className="text-[10px] text-center text-slate-500 mt-2">
                    <Timer className="w-3 h-3 inline mr-1"/>
                    Tempo Estimado: ~{(planConservative * 1.5).toFixed(0)} minutos
                 </p>
             </div>

             <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                     <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs">
                         <Wallet className="w-3 h-3" /> Banca Atual
                     </div>
                     <div className="text-lg font-bold text-white">R$ {config.currentCapital.toFixed(2)}</div>
                 </div>
                 <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                     <div className="flex items-center gap-2 mb-2 text-aviator-gold text-xs">
                         <Crosshair className="w-3 h-3" /> Entrada (1-2%)
                     </div>
                     <div className="text-lg font-bold text-white">R$ {recommendedBet}</div>
                 </div>
                 <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/30">
                     <div className="flex items-center gap-2 mb-2 text-red-400 text-xs">
                         <Shield className="w-3 h-3" /> Stop Loss
                     </div>
                     <div className="text-lg font-bold text-red-200">-R$ {Math.abs(stopLossValue).toFixed(2)}</div>
                 </div>
                 <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
                     <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs">
                         <ArrowUpRight className="w-3 h-3" /> Projeção
                     </div>
                     <div className="text-lg font-bold text-emerald-200">R$ {(config.currentCapital + dailyGoalValue).toFixed(2)}</div>
                 </div>
             </div>
         </div>

         <div className="p-6 pt-0 space-y-3">
             <button 
                onClick={() => setAnalysisMode('full')}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
             >
                 <Eye className="w-5 h-5" /> ANÁLISE DE MERCADO (RECONHECIMENTO)
             </button>

             <button
                onClick={onStart}
                className="group relative w-full bg-aviator-red hover:bg-pink-600 text-white font-black text-lg py-5 rounded-xl shadow-[0_0_25px_rgba(233,30,99,0.4)] transition-all active:scale-[0.98] overflow-hidden"
             >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-shimmer"></div>
                 <span className="relative flex items-center justify-center gap-3">
                     INICIAR OPERAÇÃO <Play className="w-5 h-5 fill-current" />
                 </span>
             </button>
         </div>
      </div>
    );
  }

  // --- ACTIVE SESSION SCREEN ---
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-6 relative overflow-hidden">
      
      {/* EXTERNAL ANALYSIS (TIPMINER) - SPLIT/FULL/MINIMIZED VIEW */}
      <ExternalAnalysis 
          mode={analysisMode} 
          setMode={setAnalysisMode}
          isSessionActive={true}
      />

      {/* SMART RECOVERY MODAL */}
      {showRecoveryModal && (
          <SmartRecoveryModal 
              onClose={() => setShowRecoveryModal(false)}
              onApply={handleRecoveryApply}
              currentBankroll={config.currentCapital}
          />
      )}

      {/* SUMMARY MODAL */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
             <h2 className="text-xl font-black text-white mb-6 text-center uppercase tracking-wider border-b border-slate-800 pb-4">Resumo da Sessão</h2>
             <div className="flex flex-col items-center mb-8">
                {sessionProfit >= 0 ? (
                  <div className="bg-emerald-500/10 p-4 rounded-full mb-2 ring-1 ring-emerald-500/50"><Trophy className="w-10 h-10 text-emerald-400" /></div>
                ) : (
                  <div className="bg-red-500/10 p-4 rounded-full mb-2 ring-1 ring-red-500/50"><TrendingDown className="w-10 h-10 text-red-500" /></div>
                )}
                <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Resultado Final</span>
                <span className={`text-4xl font-black ${sessionProfit >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                   {sessionProfit >= 0 ? '+' : ''}R$ {sessionProfit.toFixed(2)}
                </span>
             </div>
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800 p-3 rounded-xl flex flex-col items-center"><div className="flex items-center gap-1 text-slate-400 text-xs mb-1"><Timer className="w-3 h-3" /> Duração</div><span className="text-white font-mono font-bold">{formatTime(elapsedTime)}</span></div>
                <div className="bg-slate-800 p-3 rounded-xl flex flex-col items-center"><div className="flex items-center gap-1 text-slate-400 text-xs mb-1"><Hash className="w-3 h-3" /> Rodadas</div><span className="text-white font-mono font-bold">{rounds.length}</span></div>
             </div>
             <button onClick={confirmEndSession} className="w-full bg-aviator-gold hover:bg-yellow-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,215,0,0.3)]">
               <Check className="w-5 h-5" /> CONFIRMAR E SALVAR
             </button>
          </div>
        </div>
      )}

      {/* Header Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-800">
        <div className={`bg-slate-800 p-3 rounded-lg ${isOverTime ? 'border border-red-500 animate-pulse' : ''}`}>
          <span className="text-xs text-slate-400">Tempo (Max 30m)</span>
          <div className={`text-xl font-mono font-bold flex items-center gap-2 ${isOverTime ? 'text-red-500' : 'text-white'}`}>
            <Clock className="w-4 h-4" />{formatTime(elapsedTime)}
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg">
          <span className="text-xs text-slate-400">Lucro Sessão</span>
          <div className={`text-xl font-mono font-bold ${sessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {sessionProfit >= 0 ? '+' : ''}R$ {sessionProfit.toFixed(2)}
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg border border-aviator-gold/20">
          <div className="flex justify-between items-center">
             <span className="text-xs text-aviator-gold font-bold flex items-center gap-1"><Target className="w-3 h-3"/> Meta ({dailyGoalPercent}%)</span>
             {/* DYNAMIC COUNTER OF WINS NEEDED */}
             {activeRoundsNeeded > 0 && sessionProfit < dailyGoalValue && (
                 <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded font-bold">Faltam R$ {remainingGoal.toFixed(2)} (~{activeRoundsNeeded} wins)</span>
             )}
          </div>
          <div className="text-sm font-mono text-emerald-400/70">R$ {dailyGoalValue.toFixed(2)}</div>
          <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
             <div className="bg-aviator-gold h-full transition-all" style={{ width: `${Math.min(100, Math.max(0, (sessionProfit / dailyGoalValue) * 100))}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg">
          <span className="text-xs text-slate-400">Stop Loss</span>
          <div className="text-sm font-mono text-red-400/70">R$ {stopLossValue.toFixed(2)}</div>
          <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
             <div className="bg-red-500 h-full transition-all" style={{ width: `${Math.min(100, Math.max(0, (sessionProfit / Math.abs(stopLossValue)) * 100))}%` }}></div>
          </div>
        </div>
      </div>

      {/* Time Alert */}
      {isOverTime && (
        <div className="bg-red-600 text-white p-3 rounded-lg flex items-center justify-center gap-3 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <Volume2 className="w-5 h-5" />
            <span className="font-bold uppercase text-sm">Tempo Esgotado! Encerre agora.</span>
        </div>
      )}

      {/* Alerts */}
      {hitStopLoss && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6" />
          <div><strong>PARE IMEDIATAMENTE!</strong> Stop Loss atingido.</div>
        </div>
      )}
       {hitDailyGoal && (
        <div className="bg-emerald-900/30 border border-emerald-500 text-emerald-200 p-4 rounded-lg flex items-center gap-3 animate-bounce">
          <Trophy className="w-6 h-6 text-aviator-gold" />
          <div><strong>META BATIDA!</strong> Pare e garanta o lucro.</div>
        </div>
      )}

      {/* GAME CONTROLS */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Registrar Rodada
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Strategy & Config */}
          <div>
            <label className="text-xs text-slate-400 flex justify-between items-center mb-1">
                <span>Estratégia</span>
                <button onClick={() => setShowStrategyConfig(!showStrategyConfig)} className="text-aviator-gold hover:text-white">
                    <Settings className="w-3 h-3" />
                </button>
            </label>
            
            {showStrategyConfig && (
                <div className="absolute z-20 bg-slate-800 border border-slate-600 p-3 rounded-lg mt-1 shadow-xl w-72">
                    <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Settings className="w-3 h-3"/> Configurar Padrões</h5>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] text-slate-400">Alvo Principal</label>
                            <input 
                                type="number" step="0.1"
                                value={config.strategyDefaults?.[StrategyType.EARLY_CASHOUT] || 2.00}
                                onChange={(e) => handleStrategyDefaultChange(StrategyType.EARLY_CASHOUT, e.target.value)}
                                className="w-full bg-slate-900 text-xs border border-slate-700 rounded p-1 text-white"
                            />
                        </div>
                        <div className="bg-slate-700/50 p-2 rounded border border-slate-600">
                            <p className="text-[10px] font-bold text-slate-300 mb-1">Estratégia Duas Apostas</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400">Cobertura (x)</label>
                                <input 
                                    type="number" step="0.1"
                                    value={twoBetsCover}
                                    onChange={(e) => handleStrategyDefaultChange(StrategyType.TWO_BETS + '_COVER', e.target.value)}
                                    className="w-full bg-slate-900 text-xs border border-slate-700 rounded p-1 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Alvo (x)</label>
                                <input 
                                    type="number" step="0.1"
                                    value={twoBetsTarget}
                                    onChange={(e) => handleStrategyDefaultChange(StrategyType.TWO_BETS, e.target.value)}
                                    className="w-full bg-slate-900 text-xs border border-slate-700 rounded p-1 text-white"
                                />
                              </div>
                            </div>
                        </div>
                        <button onClick={() => setShowStrategyConfig(false)} className="w-full bg-aviator-gold text-black text-xs font-bold py-1 rounded mt-2">Salvar</button>
                    </div>
                </div>
            )}

            <select 
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value as StrategyType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-aviator-red outline-none"
            >
              {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Bet Amount & Smart Recovery */}
          <div>
            <label className="text-xs text-slate-400 relative flex justify-between items-center pr-2 mb-1">
                <span>Valor (Rec: {recommendedBet})</span>
                <button onClick={() => setShowRecoveryModal(true)} className="text-slate-500 hover:text-blue-400 flex items-center gap-1 text-[10px] uppercase font-bold border border-slate-700 px-1 rounded">
                    <Calculator className="w-3 h-3" /> Gale
                </button>
            </label>
            <input 
              type="number" placeholder={recommendedBet}
              value={betInput}
              onChange={(e) => setBetInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-1 focus:ring-aviator-red outline-none"
            />
          </div>

          {/* Multiplier & Quick Actions */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Multiplicador Alvo</label>
            <div className="flex flex-col gap-2">
                <input 
                  type="number" step="0.01"
                  value={multInput}
                  onChange={(e) => setMultInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-1 focus:ring-aviator-red outline-none font-bold text-center"
                />
                <div className="flex gap-1 justify-between">
                    {quickMultipliers.map(m => (
                        <button 
                            key={m} onClick={() => setMultInput(m)}
                            className={`text-[10px] py-1 px-2 rounded border border-slate-600 hover:bg-slate-700 hover:border-aviator-gold transition-colors ${multInput === m ? 'bg-slate-700 border-aviator-gold text-aviator-gold' : 'text-slate-400'}`}
                        >
                            {m}x
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleAddRound(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-lg active:scale-[0.98]"
          >
            <TrendingUp className="w-6 h-6" /> GREEN
          </button>
          <button 
             onClick={() => handleAddRound(false)}
            className="bg-slate-700 hover:bg-red-600 text-white font-bold py-4 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-lg active:scale-[0.98]"
          >
            <TrendingDown className="w-6 h-6" /> LOSS
          </button>
        </div>
        
        <button onClick={handleTwoBetsQuickWin} className="w-full mt-3 border border-slate-600 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition-all text-xs uppercase tracking-wider shadow-sm">
             <Zap className="w-4 h-4 text-aviator-gold" /> Win Rápido: Duas Apostas ({twoBetsCover}x & {twoBetsTarget}x)
        </button>
      </div>

      {/* HISTORY */}
      <div className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-slate-500">Últimas Rodadas</h4>
        {rounds.slice().reverse().slice(0, 5).map(r => (
          <div key={r.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border-l-4" style={{ borderColor: r.win ? '#10B981' : '#EF4444' }}>
            <div className="flex flex-col">
                 <span className="text-xs text-slate-400">{new Date(r.timestamp).toLocaleTimeString()}</span>
                 <span className="text-[10px] text-slate-500">{r.multiplier > 0 ? r.multiplier.toFixed(2) : '-'}x</span>
            </div>
            <span className="text-xs text-slate-300">{STRATEGIES.find(s => s.id === r.strategy)?.name.split(' ')[0]}</span>
            <span className={`font-mono font-bold ${r.win ? 'text-emerald-400' : 'text-red-400'}`}>
              {r.win ? `+R$ ${r.profit.toFixed(2)}` : `-R$ ${Math.abs(r.profit).toFixed(2)}`}
            </span>
          </div>
        ))}
        {rounds.length === 0 && <p className="text-center text-slate-600 text-sm py-2">Nenhuma rodada registrada.</p>}
      </div>

      <button onClick={handleEndClick} className="w-full border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-lg flex justify-center items-center gap-2 mt-4 transition-colors">
        <Square className="w-4 h-4 fill-current" /> ENCERRAR SESSÃO
      </button>
    </div>
  );
};