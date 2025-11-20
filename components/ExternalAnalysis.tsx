import React from 'react';
import { Minimize2, Maximize2, ExternalLink, BarChart2, Eye, ArrowLeft, LayoutTemplate, X, ArrowDownLeft } from 'lucide-react';

export type AnalysisMode = 'closed' | 'minimized' | 'split' | 'full';

interface Props {
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  isSessionActive?: boolean;
}

export const ExternalAnalysis: React.FC<Props> = ({ mode, setMode, isSessionActive = true }) => {
  const ANALYSIS_URL = "https://www.tipminer.com/br/historico/sortenabet/aviator";

  // Se estiver fechado, não renderiza nada (para o Recon Mode que pode ser fechado totalmente)
  if (mode === 'closed') return null;

  // --- MODO MINIMIZADO (FAB) ---
  if (mode === 'minimized') {
    return (
      <button
        onClick={() => setMode(isSessionActive ? 'split' : 'full')}
        className="fixed bottom-24 right-4 z-40 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] border-2 border-blue-400 transition-all active:scale-95 animate-bounce-slow"
        title="Abrir Análise"
      >
        <BarChart2 className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
        </span>
      </button>
    );
  }

  // --- MODOS VISÍVEIS (SPLIT OU FULL) ---
  // Determinamos as classes de layout baseadas no modo
  const containerClasses = mode === 'full' 
    ? "fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200"
    : "relative w-full h-[300px] md:h-[400px] mb-6 rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col bg-slate-900 animate-in slide-in-from-top-4 duration-300";

  return (
    <div className={containerClasses}>
      {/* Header da Análise */}
      <div className="bg-slate-900 border-b border-blue-900/50 p-2 md:p-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0">
                {isSessionActive ? <BarChart2 className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="min-w-0">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider truncate">
                    {isSessionActive ? 'C.I.T. (Ao Vivo)' : 'Reconhecimento'}
                </h3>
            </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2">
            {/* Botões de Controle de View */}
            {mode === 'full' ? (
                <button 
                    onClick={() => setMode('split')}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors hidden md:block"
                    title="Dividir Tela"
                >
                    <ArrowDownLeft className="w-4 h-4" />
                </button>
            ) : (
                <button 
                    onClick={() => setMode('full')}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title="Tela Cheia"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            )}

            <a 
                href={ANALYSIS_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden md:flex bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded text-[10px] items-center gap-1 transition-colors"
            >
                <ExternalLink className="w-3 h-3" /> Web
            </a>

            <button 
                onClick={() => setMode('minimized')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Minimizar"
            >
                <Minimize2 className="w-4 h-4" />
            </button>

            {!isSessionActive && (
                 <button 
                    onClick={() => setMode('closed')}
                    className="p-2 text-red-400 hover:text-white hover:bg-red-900/50 rounded transition-colors"
                    title="Fechar"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {/* Iframe Area */}
      <div className="flex-1 relative bg-slate-950 w-full h-full">
          <iframe 
            src={ANALYSIS_URL}
            className="absolute inset-0 w-full h-full border-0"
            title="Aviator Analysis"
            allow="fullscreen"
          />
          
          {/* Loading Fallback */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
              <div className="text-slate-500 text-xs animate-pulse flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" /> Carregando TipMiner...
              </div>
          </div>
      </div>
    </div>
  );
};