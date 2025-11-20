import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Brain, MessageSquareWarning, ShieldAlert, ThumbsUp, Skull, Lock, Microscope, Activity, TrendingUp, CalendarCheck, AlertTriangle, Flame, Snowflake, Wind, Zap, MousePointer2, RefreshCw, Timer, History, Trash2 } from 'lucide-react';
import { DailySession } from '../types';
import { WIN_MESSAGES, LOSS_MESSAGES, NEUTRAL_MESSAGES } from '../mindset_content';

interface Props {
    lastSession?: DailySession;
    sessions?: DailySession[];
    currentBankroll?: number;
}

// --- MINI-GAME: REACTION TRAINER ---
const ReactionGame = () => {
    const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'clicked'>('idle');
    const [startTime, setStartTime] = useState(0);
    const [reactionTime, setReactionTime] = useState<number | null>(null);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const [history, setHistory] = useState<number[]>([]);
    const timeoutRef = useRef<any>(null);

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('tiago_reflex_history');
        const savedBest = localStorage.getItem('tiago_reflex_best');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedBest) setBestTime(parseInt(savedBest));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const startGame = () => {
        setGameState('waiting');
        setReactionTime(null);
        const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            setGameState('ready');
            setStartTime(Date.now());
        }, randomDelay);
    };

    const handleClick = () => {
        if (gameState === 'idle' || gameState === 'clicked') {
            startGame();
        } else if (gameState === 'waiting') {
            clearTimeout(timeoutRef.current);
            setGameState('idle');
            alert("Muito cedo! Espere ficar verde.");
        } else if (gameState === 'ready') {
            const time = Date.now() - startTime;
            setReactionTime(time);
            setGameState('clicked');
            
            // Update Best Time
            if (!bestTime || time < bestTime) {
                setBestTime(time);
                localStorage.setItem('tiago_reflex_best', time.toString());
            }

            // Update History
            const newHistory = [time, ...history].slice(0, 10); // Keep last 10
            setHistory(newHistory);
            localStorage.setItem('tiago_reflex_history', JSON.stringify(newHistory));
        }
    };

    const clearHistory = (e: React.MouseEvent) => {
        e.stopPropagation();
        setHistory([]);
        setBestTime(null);
        localStorage.removeItem('tiago_reflex_history');
        localStorage.removeItem('tiago_reflex_best');
    };

    const getGrade = (ms: number) => {
        if (ms < 200) return { label: 'GOD', color: 'text-purple-400' };
        if (ms < 250) return { label: 'PRO', color: 'text-emerald-400' };
        if (ms < 350) return { label: 'OK', color: 'text-yellow-400' };
        return { label: 'LENTO', color: 'text-red-400' };
    };

    return (
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center select-none h-full">
            <div className="flex items-center justify-between w-full mb-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider">
                    <Zap className="w-4 h-4" /> Treinador de Reflexo
                </div>
                {history.length > 0 && (
                    <button onClick={clearHistory} className="text-[10px] text-slate-600 hover:text-red-400 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Limpar
                    </button>
                )}
            </div>
            
            <div 
                onMouseDown={handleClick}
                className={`w-full h-32 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg active:scale-[0.98] mb-4 ${
                    gameState === 'idle' || gameState === 'clicked' ? 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-600' :
                    gameState === 'waiting' ? 'bg-red-900 border-2 border-red-600' :
                    'bg-emerald-500 border-4 border-white shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                }`}
            >
                {gameState === 'idle' && <span className="text-slate-400 font-bold text-sm">Toque para Iniciar</span>}
                {gameState === 'waiting' && <span className="text-red-200 font-bold text-sm animate-pulse">Aguarde o Verde...</span>}
                {gameState === 'ready' && <span className="text-black font-black text-2xl uppercase">CLIQUE AGORA!</span>}
                {gameState === 'clicked' && (
                    <div>
                        <span className="text-white font-bold text-3xl block">{reactionTime}ms</span>
                        <span className="text-slate-400 text-xs">Clique para tentar de novo</span>
                    </div>
                )}
            </div>

            <div className="w-full flex-1 flex flex-col min-h-0">
                <div className="flex justify-between w-full px-2 text-xs text-slate-500 mb-2 border-b border-slate-800 pb-2">
                    <span>Recorde: {bestTime ? <span className="text-emerald-400 font-bold">{bestTime}ms</span> : '--'}</span>
                    <span>Meta: &lt; 250ms</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 max-h-[150px]">
                    {history.length === 0 && <p className="text-center text-[10px] text-slate-600 py-4">Sem histórico</p>}
                    {history.map((time, idx) => {
                        const grade = getGrade(time);
                        return (
                            <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-800/50 text-xs">
                                <span className="text-slate-400 font-mono">#{idx + 1}</span>
                                <span className="text-white font-bold">{time}ms</span>
                                <span className={`text-[10px] font-black ${grade.color}`}>{grade.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: TACTICAL BREATHING ---
const BreathingExercise = () => {
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'HoldEmpty'>('Inhale');
    const [text, setText] = useState('INSPIRE (4s)');

    useEffect(() => {
        const cycle = () => {
            setPhase('Inhale'); setText('INSPIRE...');
            setTimeout(() => {
                setPhase('Hold'); setText('SEGURE...');
                setTimeout(() => {
                    setPhase('Exhale'); setText('EXPIRE...');
                    setTimeout(() => {
                        setPhase('HoldEmpty'); setText('SEGURE...');
                    }, 4000);
                }, 4000);
            }, 4000);
        };

        cycle();
        const interval = setInterval(cycle, 16000); // 4+4+4+4 = 16s full cycle
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden h-full">
             <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs tracking-wider mb-8 z-10">
                <Wind className="w-4 h-4" /> Respirador Tático
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                {/* Animated Circles */}
                <div className={`absolute inset-0 bg-cyan-500/20 rounded-full transition-all duration-[4000ms] ease-in-out ${
                    phase === 'Inhale' ? 'scale-100 opacity-100' : 
                    phase === 'Hold' ? 'scale-100 opacity-80' : 
                    phase === 'Exhale' ? 'scale-50 opacity-50' : 'scale-50 opacity-30'
                }`}></div>
                <div className={`absolute inset-0 border-2 border-cyan-500 rounded-full transition-all duration-[4000ms] ease-in-out ${
                    phase === 'Inhale' ? 'scale-100' : 
                    phase === 'Hold' ? 'scale-110' : 
                    phase === 'Exhale' ? 'scale-50' : 'scale-50'
                }`}></div>
                
                <span className="relative z-10 text-white font-black text-sm tracking-widest animate-pulse">
                    {text}
                </span>
            </div>
            <p className="text-[10px] text-slate-500 max-w-[200px] z-10">
                Controle sua respiração para baixar o cortisol e retomar o foco.
            </p>
        </div>
    );
};


export const MindsetGuide: React.FC<Props> = ({ lastSession, sessions = [], currentBankroll = 0 }) => {
  
  // Memoize the message so it doesn't change on every re-render
  const coach = useMemo(() => {
      if (!lastSession) return {
          title: "MENTALIDADE DE AÇO",
          message: "A consistência é chata. A riqueza também. Se você quer emoção, vá pular de paraquedas. Aqui estamos para fazer dinheiro.",
          type: 'neutral'
      };

      const getRandomMessage = (array: string[]) => array[Math.floor(Math.random() * array.length)];

      if (lastSession.profit > 0) {
          return {
              title: "BAIXA A BOLA, TIAGO!",
              message: getRandomMessage(WIN_MESSAGES),
              type: 'win'
          };
      } else if (lastSession.profit < 0) {
          return {
              title: "PARE DE SANGRAR.",
              message: getRandomMessage(LOSS_MESSAGES),
              type: 'loss'
          };
      } else {
           return {
              title: "EMPATE É VITÓRIA",
              message: getRandomMessage(NEUTRAL_MESSAGES),
              type: 'neutral'
          };
      }
  }, [lastSession]);

  // --- TACTICAL DEBRIEFING CALCULATIONS ---
  const debrief = useMemo(() => {
      if (!lastSession || !lastSession.roundsDetail) return null;

      // 1. PROFIT FACTOR
      const grossWin = lastSession.roundsDetail.filter(r => r.profit > 0).reduce((acc, r) => acc + r.profit, 0);
      const grossLoss = Math.abs(lastSession.roundsDetail.filter(r => r.profit < 0).reduce((acc, r) => acc + r.profit, 0));
      const profitFactor = grossLoss === 0 ? grossWin : (grossWin / grossLoss);

      // 2. STREAKS
      let maxWinStreak = 0;
      let maxLossStreak = 0;
      let currentW = 0;
      let currentL = 0;
      
      lastSession.roundsDetail.forEach(r => {
          if (r.win) {
              currentW++;
              currentL = 0;
              if (currentW > maxWinStreak) maxWinStreak = currentW;
          } else {
              currentL++;
              currentW = 0;
              if (currentL > maxLossStreak) maxLossStreak = currentL;
          }
      });

      // 3. PERFORMANCE COMPARISON (VS LAST 7 DAYS)
      // Filter valid sessions (ignore current one for avg calc)
      const recentSessions = sessions
        .filter(s => s.id !== lastSession.id)
        .slice(-7); // Last 7
      
      const avgProfit = recentSessions.length > 0 
        ? recentSessions.reduce((acc, s) => acc + s.profit, 0) / recentSessions.length 
        : 0;
      
      // Status
      let performanceStatus: 'HOT' | 'COLD' | 'NORMAL' = 'NORMAL';
      if (recentSessions.length > 0) {
          if (lastSession.profit > avgProfit * 1.2 && lastSession.profit > 0) performanceStatus = 'HOT';
          else if (lastSession.profit < avgProfit && lastSession.profit < 0) performanceStatus = 'COLD';
      }

      // 4. REALISTIC PROJECTION
      // Calculate real Average Daily Growth Rate (%) from history
      const totalGrowthRates = sessions.map(s => {
          const start = s.startBalance > 0 ? s.startBalance : s.endBalance - s.profit;
          return start > 0 ? (s.profit / start) : 0;
      });
      // Average daily % yield
      const avgYield = totalGrowthRates.length > 0 
          ? (totalGrowthRates.reduce((a, b) => a + b, 0) / totalGrowthRates.length) 
          : 0;
      
      // Project 30 days
      const projected30Days = currentBankroll * Math.pow(1 + avgYield, 30);
      const projectedYieldPercent = avgYield * 100;

      return {
          profitFactor,
          maxWinStreak,
          maxLossStreak,
          avgProfit,
          performanceStatus,
          projected30Days,
          projectedYieldPercent,
          grossWin,
          grossLoss
      };

  }, [lastSession, sessions, currentBankroll]);


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      
      {/* --- ÁREA DO MENTOR --- */}
      <div className={`relative p-6 rounded-xl border-2 shadow-2xl overflow-hidden ${
          coach.type === 'win' ? 'bg-emerald-950/80 border-emerald-500' : 
          coach.type === 'loss' ? 'bg-red-950/80 border-red-600' : 
          'bg-slate-900 border-aviator-gold'
      }`}>
          {/* Ícone de Fundo */}
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
              {coach.type === 'win' ? <ShieldAlert className="w-40 h-40 text-emerald-500" /> : 
               coach.type === 'loss' ? <Skull className="w-40 h-40 text-red-500" /> : 
               <Brain className="w-40 h-40 text-aviator-gold" />}
          </div>

          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-full ${
                      coach.type === 'win' ? 'bg-emerald-500 text-black' : 
                      coach.type === 'loss' ? 'bg-red-600 text-white' : 
                      'bg-aviator-gold text-black'
                  }`}>
                      <MessageSquareWarning className="w-8 h-8" />
                  </div>
                  <div>
                      <p className="text-xs uppercase tracking-widest opacity-70 font-bold">Mensagem do Mentor</p>
                      <h2 className={`text-2xl font-black italic uppercase ${
                          coach.type === 'win' ? 'text-emerald-400' : 
                          coach.type === 'loss' ? 'text-red-500' : 
                          'text-white'
                      }`}>
                          {coach.title}
                      </h2>
                  </div>
              </div>
              
              <div className="bg-black/40 p-4 rounded-lg backdrop-blur-sm border border-white/5 shadow-inner min-h-[100px] flex items-center">
                  <p className="text-lg text-slate-200 font-medium leading-relaxed font-mono w-full text-center">
                      "{coach.message}"
                  </p>
              </div>
          </div>
      </div>

      {/* --- DOJO MENTAL (SALA DE DESCOMPRESSÃO) --- */}
      <div className="bg-gradient-to-b from-slate-900 to-black p-6 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden">
           <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
               <Brain className="w-5 h-5 text-purple-400" />
               <h3 className="font-bold text-white uppercase tracking-wider">Dojo Mental (Área de Espera)</h3>
           </div>
           <p className="text-xs text-slate-400 mb-6">
               O tédio quebra bancas. Use este tempo para afiar sua mente enquanto aguarda a próxima janela de oportunidade.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <BreathingExercise />
               <ReactionGame />
           </div>
      </div>

      {/* --- DEBRIEFING TÁTICO --- */}
      {lastSession && debrief && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="bg-slate-800 p-3 border-b border-slate-700 flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white uppercase tracking-wider text-sm">Debriefing Tático (Pós-Missão)</h3>
              </div>

              <div className="p-4 space-y-6">
                  {/* 1. PERFORMANCE & COMPARISON */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block mb-1">Status da Sessão</span>
                          <div className="flex items-center gap-2">
                               {debrief.performanceStatus === 'HOT' && <Flame className="w-5 h-5 text-orange-500" />}
                               {debrief.performanceStatus === 'COLD' && <Snowflake className="w-5 h-5 text-blue-400" />}
                               {debrief.performanceStatus === 'NORMAL' && <Activity className="w-5 h-5 text-slate-400" />}
                               
                               <span className={`font-black text-lg ${
                                   debrief.performanceStatus === 'HOT' ? 'text-orange-500' : 
                                   debrief.performanceStatus === 'COLD' ? 'text-blue-400' : 'text-slate-300'
                               }`}>
                                   {debrief.performanceStatus === 'HOT' ? 'SUPERANDO MÉDIA' : 
                                    debrief.performanceStatus === 'COLD' ? 'ABAIXO DO PADRÃO' : 'NA MÉDIA'}
                               </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                              Comparado aos últimos 7 dias
                          </p>
                      </div>
                      
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block mb-1">Fator de Lucro</span>
                          <div className="flex items-center gap-2">
                               <span className={`font-black text-xl ${debrief.profitFactor >= 1.5 ? 'text-emerald-400' : debrief.profitFactor < 1 ? 'text-red-500' : 'text-yellow-500'}`}>
                                   {debrief.profitFactor.toFixed(2)}
                               </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                              {debrief.profitFactor < 1 ? 'Atenção: Você perde mais do que ganha.' : 'Saudável: Ganhos superam perdas.'}
                          </p>
                      </div>
                  </div>

                  {/* 2. SEQUÊNCIAS (STREAKS) */}
                  <div className="flex gap-2 text-xs">
                      <div className="flex-1 bg-emerald-900/20 border border-emerald-900/50 p-2 rounded flex justify-between items-center">
                          <span className="text-emerald-500 font-bold">Maior Win Streak</span>
                          <span className="font-mono text-white font-bold text-lg">{debrief.maxWinStreak}</span>
                      </div>
                      <div className="flex-1 bg-red-900/20 border border-red-900/50 p-2 rounded flex justify-between items-center">
                          <span className="text-red-500 font-bold">Maior Loss Streak</span>
                          <span className="font-mono text-white font-bold text-lg">{debrief.maxLossStreak}</span>
                      </div>
                  </div>

                  {/* 3. PROJEÇÃO REALISTA (CHOQUE DE REALIDADE) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                          <TrendingUp className="w-12 h-12 text-white" />
                      </div>
                      
                      <h4 className="text-xs text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <CalendarCheck className="w-3 h-3" /> Projeção Real (Baseada na sua Média)
                      </h4>
                      
                      <div className="flex justify-between items-end">
                          <div>
                              <span className="text-3xl font-black text-white">R$ {debrief.projected30Days.toFixed(2)}</span>
                              <p className="text-[10px] text-slate-500">Saldo estimado em 30 dias</p>
                          </div>
                          <div className="text-right">
                              <span className={`text-sm font-bold ${debrief.projectedYieldPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {debrief.projectedYieldPercent > 0 ? '+' : ''}{debrief.projectedYieldPercent.toFixed(2)}% / dia
                              </span>
                              <p className="text-[10px] text-slate-500">Sua taxa real atual</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- OS 10 MANDAMENTOS DO PROFISSIONAL --- */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-bold text-aviator-gold mb-6 flex items-center gap-2 uppercase tracking-wider">
             <Lock className="w-5 h-5" /> Código de Honra 2026
        </h3>
        
        <div className="space-y-4">
            {[
                "Nunca persiga perdas. Aceitou o loss, você controla o jogo.",
                "Lucro no bolso vale mais que lucro na tela.",
                "A banca é sua empresa. Não a quebre.",
                "Se bateu a meta em 5 minutos, PARE. Não tente a sorte.",
                "Fadiga mental custa caro. 30 minutos é o limite.",
                "Não opere se estiver triste, bêbado ou eufórico.",
                "O mercado é soberano. Não tente adivinhar, siga a estratégia.",
                "Juros compostos são a oitava maravilha. Respeite o processo.",
                "Saque precoce enche o bolso. Ganância enche o ego.",
                "Você vai ser rico em 2026. Mas só se tiver disciplina HOJE."
            ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors border-l-2 border-slate-700 hover:border-aviator-red">
                    <span className="text-aviator-red font-black text-sm min-w-[20px]">#{idx + 1}</span>
                    <p className="text-sm text-slate-300 font-medium">{item}</p>
                </div>
            ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 text-center">
           <h4 className="text-white font-bold mb-2">Precisa de ajuda?</h4>
           <p className="text-sm text-slate-400 mb-4">
               Se sentir sintomas de vício, tremedeira ou ansiedade excessiva, pare imediatamente.
               Sua saúde mental vale mais que qualquer aposta.
           </p>
           <div className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900">
               <ThumbsUp className="w-3 h-3" /> Foco no Longo Prazo
           </div>
      </div>
    </div>
  );
};