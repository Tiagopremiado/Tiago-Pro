import React, { useState } from 'react';
import { BankrollConfig } from '../types';
import { ArrowRight, Check, Shield, TrendingUp, Wallet, Target, Rocket } from 'lucide-react';

interface Props {
  onComplete: (config: BankrollConfig) => void;
}

export const OnboardingWizard: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<BankrollConfig>({
    initialCapital: 100,
    currentCapital: 100,
    betPercentage: 3.5, // UPDATED: Padrão 3.5%
    stopLossPercentage: 15,
    stopWinPercentage: 5,
    dailyGoalPercentage: 5,
    defaultTargetMultiplier: 2.00, // UPDATED: Padrão 2.00x
    strategyDefaults: {
        'SAQUE_PRECOCE': 2.00, // UPDATED: Default 2.00x
        'DUAS_APOSTAS': 2.00,
        'DUAS_APOSTAS_COVER': 1.20,
        'MANUAL': 0
    }
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete(config);
    }
  };

  const calculatedBet = (config.initialCapital * (config.betPercentage / 100)).toFixed(2);
  const calculatedStopLoss = (config.initialCapital * (config.stopLossPercentage / 100)).toFixed(2);
  const calculatedGoal = (config.initialCapital * (config.dailyGoalPercentage / 100)).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-aviator-red transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="p-8">
          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-full bg-slate-800 mb-4 ring-1 ring-slate-700">
               {step === 1 && <Wallet className="w-8 h-8 text-emerald-400" />}
               {step === 2 && <Shield className="w-8 h-8 text-red-400" />}
               {step === 3 && <Target className="w-8 h-8 text-aviator-gold" />}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              {step === 1 && "Defina seu Combustível"}
              {step === 2 && "Protocolo de Segurança"}
              {step === 3 && "Plano de Voo 2026"}
            </h2>
            <p className="text-slate-400 text-sm">
              {step === 1 && "Qual será o valor inicial da sua banca?"}
              {step === 2 && "Vamos definir seus limites de risco."}
              {step === 3 && "Qual sua meta de crescimento diário?"}
            </p>
          </div>

          {/* STEP 1: BANKROLL */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <label className="block text-xs text-emerald-500 font-bold mb-2 uppercase tracking-wider">Banca Inicial (R$)</label>
                <input
                  type="number"
                  autoFocus
                  value={config.initialCapital}
                  onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setConfig({...config, initialCapital: val, currentCapital: val});
                  }}
                  className="w-full bg-transparent text-4xl font-bold text-white outline-none placeholder-slate-700"
                  placeholder="100.00"
                />
              </div>
              <p className="text-xs text-slate-500 italic text-center">
                "Trate esse valor como o capital social da sua empresa. Não misture com o dinheiro do aluguel."
              </p>
            </div>
          )}

          {/* STEP 2: RISK MANAGEMENT */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              
              {/* Stop Loss */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-red-900/30">
                 <div className="flex justify-between mb-2">
                    <label className="text-xs text-red-400 font-bold uppercase">Stop Loss (Diário)</label>
                    <span className="text-xs font-mono text-white font-bold">{config.stopLossPercentage}% (-R$ {calculatedStopLoss})</span>
                 </div>
                 <input
                    type="range" min="5" max="30" step="1"
                    value={config.stopLossPercentage}
                    onChange={(e) => setConfig({...config, stopLossPercentage: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                 />
              </div>

              {/* Bet Size */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                 <div className="flex justify-between mb-2">
                    <label className="text-xs text-slate-400 font-bold uppercase">Valor da Entrada (Por Rodada)</label>
                    <span className="text-xs font-mono text-white font-bold">{config.betPercentage}% (R$ {calculatedBet})</span>
                 </div>
                 <input
                    type="range" min="0.5" max="10" step="0.1"
                    value={config.betPercentage}
                    onChange={(e) => setConfig({...config, betPercentage: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                 />
                 <p className="text-[10px] text-slate-500 mt-2 text-right">Padrão Configurado: 3.5% da banca.</p>
              </div>
            </div>
          )}

           {/* STEP 3: GOALS */}
           {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl border border-aviator-gold/30 text-center shadow-lg">
                 <div className="mb-4">
                    <span className="text-5xl font-black text-aviator-gold">{config.dailyGoalPercentage}%</span>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Meta de Juros Compostos</p>
                 </div>
                 
                 <input
                    type="range" min="1" max="15" step="0.5"
                    value={config.dailyGoalPercentage}
                    onChange={(e) => setConfig({...config, dailyGoalPercentage: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-aviator-gold mb-4"
                 />

                 <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 inline-block w-full">
                     <p className="text-xs text-slate-500 mb-1">Meta de Amanhã:</p>
                     <p className="text-xl font-bold text-emerald-400">+ R$ {calculatedGoal}</p>
                 </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800 p-3 rounded border border-slate-700">
                 <Rocket className="w-5 h-5 text-slate-400 mt-1" />
                 <p className="text-xs text-slate-400 leading-relaxed">
                     Com <strong>{config.dailyGoalPercentage}%</strong> ao dia, sua banca de <strong>R$ {config.initialCapital}</strong> pode virar <strong>R$ {(config.initialCapital * Math.pow(1 + (config.dailyGoalPercentage/100), 30)).toFixed(2)}</strong> em 30 dias se você tiver disciplina perfeita.
                 </p>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleNext}
              className="group bg-white hover:bg-slate-200 text-slate-900 font-black py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-white/10 active:scale-95"
            >
              {step === 3 ? 'ASSINAR PLANO & INICIAR' : 'PRÓXIMO'}
              {step === 3 ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};