import React, { useMemo } from 'react';
import { Brain, MessageSquareWarning, ShieldAlert, ThumbsUp, Skull, Lock, Microscope, Activity, TrendingUp, CalendarCheck, AlertTriangle, Flame, Snowflake } from 'lucide-react';
import { DailySession } from '../types';
import { WIN_MESSAGES, LOSS_MESSAGES, NEUTRAL_MESSAGES } from '../mindset_content';

interface Props {
    lastSession?: DailySession;
    sessions?: DailySession[];
    currentBankroll?: number;
}

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

      {/* --- DEBRIEFING TÁTICO (NEW SECTION) --- */}
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