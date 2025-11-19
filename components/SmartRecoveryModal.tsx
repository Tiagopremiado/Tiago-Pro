import React, { useState } from 'react';
import { Calculator, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onApply: (bet: number, mult: number) => void;
  currentBankroll: number;
}

export const SmartRecoveryModal: React.FC<Props> = ({ onClose, onApply, currentBankroll }) => {
  const [lossAmount, setLossAmount] = useState<string>('');
  const [targetMult, setTargetMult] = useState<string>('1.50');

  const loss = parseFloat(lossAmount) || 0;
  const mult = parseFloat(targetMult) || 1.50;
  
  // Cálculo de Recuperação: Bet = Perda / (Mult - 1)
  const requiredBet = mult > 1 ? loss / (mult - 1) : 0;
  
  const riskPercentage = currentBankroll > 0 ? (requiredBet / currentBankroll) * 100 : 0;
  const isHighRisk = riskPercentage > 10;
  const isExtremeRisk = riskPercentage > 30;

  const handleApply = () => {
      if (requiredBet > 0) {
          onApply(parseFloat(requiredBet.toFixed(2)), mult);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl">
         <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50 rounded-t-xl">
             <h3 className="text-white font-bold flex items-center gap-2">
                 <Calculator className="w-4 h-4 text-blue-400" /> Smart Recovery
             </h3>
             <button onClick={onClose} className="text-slate-400 hover:text-white">
                 <X className="w-5 h-5" />
             </button>
         </div>

         <div className="p-5 space-y-4">
             <p className="text-xs text-slate-400 leading-relaxed">
                 Calcule o valor exato da entrada para recuperar um prejuízo anterior baseado no multiplicador que você confia.
             </p>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Valor Perdido (R$)</label>
                     <input 
                        type="number" 
                        autoFocus
                        value={lossAmount}
                        onChange={(e) => setLossAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                        placeholder="Ex: 20.00"
                     />
                 </div>
                 <div>
                     <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Mult. Alvo (x)</label>
                     <input 
                        type="number" step="0.10"
                        value={targetMult}
                        onChange={(e) => setTargetMult(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                     />
                 </div>
             </div>

             <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mt-2">
                 <div className="flex justify-between items-end mb-1">
                     <span className="text-xs text-slate-400">Aposta Necessária:</span>
                     <span className="text-xl font-black text-blue-400">R$ {requiredBet.toFixed(2)}</span>
                 </div>
                 
                 {requiredBet > 0 && (
                     <div className={`text-[10px] flex items-center gap-1 mt-2 p-2 rounded ${
                         isExtremeRisk ? 'bg-red-900/30 text-red-400 border border-red-900' : 
                         isHighRisk ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-900' : 
                         'bg-emerald-900/20 text-emerald-400 border border-emerald-900'
                     }`}>
                         <AlertTriangle className="w-3 h-3" />
                         {isExtremeRisk ? 'ALERTA: RISCO EXTREMO À BANCA' : 
                          isHighRisk ? 'CUIDADO: ARRISCADO' : 
                          'Risco Controlado'}
                         <span className="ml-auto font-bold">{riskPercentage.toFixed(1)}% da Banca</span>
                     </div>
                 )}
             </div>

             <button 
                onClick={handleApply}
                disabled={requiredBet <= 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
             >
                 APLICAR VALORES <ArrowRight className="w-4 h-4" />
             </button>
         </div>
      </div>
    </div>
  );
};