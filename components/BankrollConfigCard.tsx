import React, { useState, useRef } from 'react';
import { BankrollConfig } from '../types';
import { Settings, DollarSign, ShieldAlert, TrendingUp, Rocket, Wallet, Plus, ArrowRight, AlertCircle, Database, Download, Upload, FileJson } from 'lucide-react';

interface Props {
  config: BankrollConfig;
  onUpdate: (newConfig: BankrollConfig) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const BankrollConfigCard: React.FC<Props> = ({ config, onUpdate, onExport, onImport }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositInput, setShowDepositInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof BankrollConfig, value: number) => {
    onUpdate({ ...config, [field]: value });
  };

  const handleDeposit = () => {
    // Reset error state
    setError(null);

    const amount = parseFloat(depositAmount);
    
    // Validação estrita
    if (isNaN(amount) || amount <= 0) {
        setError("Digite um valor válido maior que zero.");
        return;
    }

    const newCapital = config.currentCapital + amount;
    
    // Atualiza o capital atual mantendo o resto
    onUpdate({
        ...config,
        currentCapital: newCapital
    });
    
    // Reset success state
    setDepositAmount('');
    setShowDepositInput(false);
  };

  const handleCancel = () => {
      setShowDepositInput(false);
      setDepositAmount('');
      setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          onImport(file);
      }
      // Reset input value to allow selecting the same file again if needed
      if (event.target) {
          event.target.value = '';
      }
  };

  const calculatedBet = (config.currentCapital * (config.betPercentage / 100));
  const calculatedStopLoss = (config.currentCapital * (config.stopLossPercentage / 100));
  const calculatedDailyGoal = (config.currentCapital * ((config.dailyGoalPercentage || 5) / 100));

  return (
    <div className="space-y-6 pb-8">
        {/* --- APORTE DE CAPITAL --- */}
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Wallet className="w-24 h-24 text-emerald-400" />
             </div>
             
             <div className="relative z-10">
                <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-2">
                    <Rocket className="w-5 h-5" /> Aporte de Aceleração
                </h2>
                <p className="text-sm text-slate-400 mb-4 max-w-sm">
                    Tem dinheiro sobrando? Injetar capital externo acelera drasticamente o efeito dos juros compostos. Trate sua banca como uma empresa.
                </p>

                {!showDepositInput ? (
                    <button 
                        onClick={() => setShowDepositInput(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" /> Fazer Aporte
                    </button>
                ) : (
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-emerald-500/30 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-emerald-400 font-bold mb-1 block">Valor do Aporte (R$)</label>
                                <input 
                                    type="number"
                                    autoFocus
                                    placeholder="Ex: 50.00"
                                    value={depositAmount}
                                    onChange={(e) => {
                                        setDepositAmount(e.target.value);
                                        if(error) setError(null); // Limpa erro ao digitar
                                    }}
                                    className={`w-full bg-slate-800 border rounded px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-colors ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-600'}`}
                                />
                            </div>
                            <button 
                                onClick={handleDeposit}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-4 rounded h-[42px] flex items-center gap-2 transition-colors"
                            >
                                Confirmar <ArrowRight className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={handleCancel}
                                className="text-slate-400 hover:text-white text-xs underline px-2 h-[42px]"
                            >
                                Cancelar
                            </button>
                        </div>
                        {error && (
                            <div className="mt-2 flex items-center gap-1 text-red-400 text-xs animate-pulse">
                                <AlertCircle className="w-3 h-3" /> {error}
                            </div>
                        )}
                    </div>
                )}
             </div>
        </div>

        {/* --- COFRE DE DADOS (BACKUP/RESTORE) --- */}
        <div className="bg-slate-900 border border-blue-900/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Database className="w-24 h-24 text-blue-400" />
             </div>

             <div className="flex items-center gap-2 mb-4">
                 <Database className="w-6 h-6 text-blue-400" />
                 <h2 className="text-xl font-bold text-white">Cofre de Dados</h2>
             </div>

             <p className="text-sm text-slate-400 mb-6 max-w-md">
                 Seus dados ficam salvos no navegador. Para garantir segurança total, faça backups regulares ou transfira seu progresso entre dispositivos.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* EXPORTAR */}
                 <button 
                    onClick={onExport}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group"
                 >
                     <div className="bg-blue-500/10 p-3 rounded-full group-hover:bg-blue-500/20 transition-colors">
                         <Download className="w-6 h-6 text-blue-400" />
                     </div>
                     <div className="text-center">
                         <span className="block font-bold text-sm">Baixar Backup</span>
                         <span className="block text-[10px] text-slate-500">Salvar arquivo .json seguro</span>
                     </div>
                 </button>

                 {/* IMPORTAR */}
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                 >
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                     />
                     <div className="bg-emerald-500/10 p-3 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                         <Upload className="w-6 h-6 text-emerald-400" />
                     </div>
                     <div className="text-center">
                         <span className="block font-bold text-sm">Restaurar Dados</span>
                         <span className="block text-[10px] text-slate-500">Carregar arquivo de backup</span>
                     </div>
                 </div>
             </div>
        </div>

        {/* --- CONFIGURAÇÃO PADRÃO --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <Settings className="w-6 h-6 text-aviator-red" />
            <h2 className="text-xl font-bold text-white">Configuração Fina</h2>
        </div>

        <div className="space-y-6">
            {/* Current Capital (Manual Edit) */}
            <div>
            <label className="block text-sm text-slate-400 mb-1">Banca Atual (Ajuste Manual)</label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                type="number"
                value={config.currentCapital}
                onChange={(e) => handleChange('currentCapital', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-aviator-red outline-none"
                />
            </div>
            </div>

            {/* Compound Interest Goal */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-lg border border-aviator-gold/30">
            <label className="block text-xs text-aviator-gold mb-2 flex justify-between font-bold">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Meta Diária (Juros Compostos)</span>
                <span className="text-white">{config.dailyGoalPercentage || 5}%</span>
            </label>
            <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={config.dailyGoalPercentage || 5}
                onChange={(e) => handleChange('dailyGoalPercentage', Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-aviator-gold"
            />
            <div className="mt-2 text-right text-slate-300 font-mono text-sm">
                Buscar Hoje: <span className="text-emerald-400 font-bold">+R$ {calculatedDailyGoal.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Quanto maior a %, maior o risco. Recomendado: 3% a 5%.</p>
            </div>

            {/* Target Multiplier (New) */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <label className="block text-xs text-slate-400 mb-2 flex justify-between">
                <span className="flex items-center gap-1"><Rocket className="w-3 h-3"/> Alvo Padrão (Multiplicador)</span>
                <span className="text-white font-bold">{config.defaultTargetMultiplier || 1.20}x</span>
                </label>
                <div className="flex gap-4 items-center">
                    <input
                    type="number"
                    step="0.10"
                    min="1.01"
                    value={config.defaultTargetMultiplier || 1.20}
                    onChange={(e) => handleChange('defaultTargetMultiplier', Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-white focus:ring-1 focus:ring-aviator-red outline-none"
                    />
                    <span className="text-xs text-slate-500 w-1/2">Esse valor será preenchido automaticamente na sessão.</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bet Percentage */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <label className="block text-xs text-slate-400 mb-2 flex justify-between">
                <span>% Aposta (1-2%)</span>
                <span className="text-white font-bold">{config.betPercentage}%</span>
                </label>
                <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={config.betPercentage}
                onChange={(e) => handleChange('betPercentage', Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-aviator-red"
                />
                <div className="mt-2 text-right text-aviator-gold font-mono text-sm">
                Aposta: R$ {calculatedBet.toFixed(2)}
                </div>
            </div>

            {/* Stop Loss */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-red-900/30">
                <label className="block text-xs text-slate-400 mb-2 flex justify-between">
                <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Stop Loss (10-20%)</span>
                <span className="text-red-400 font-bold">{config.stopLossPercentage}%</span>
                </label>
                <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={config.stopLossPercentage}
                onChange={(e) => handleChange('stopLossPercentage', Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="mt-2 text-right text-red-400 font-mono text-sm">
                Limite: -R$ {calculatedStopLoss.toFixed(2)}
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>
  );
};