import React, { useState, useEffect } from 'react';
import { Minimize2, Maximize2, ExternalLink, X, BarChart2, WifiOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export const ExternalAnalysis: React.FC<Props> = ({ isOpen, onToggle }) => {
  const [iframeError, setIframeError] = useState(false);
  const ANALYSIS_URL = "https://www.tipminer.com/br/historico/sortenabet/aviator";

  // Reset error state when opening
  useEffect(() => {
    if (isOpen) setIframeError(false);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-24 right-4 z-40 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] border-2 border-blue-400 transition-all active:scale-95 animate-bounce-slow"
        title="Abrir Análise TipMiner"
      >
        <BarChart2 className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-10">
      {/* Header da Análise */}
      <div className="bg-slate-900 border-b border-blue-900 p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
                <BarChart2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Centro de Inteligência</h3>
                <p className="text-[10px] text-slate-400">TipMiner: SorteNaBet Aviator</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <a 
                href={ANALYSIS_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
                <ExternalLink className="w-4 h-4" /> <span className="hidden md:inline">Abrir no Navegador</span>
            </a>
            <button 
                onClick={onToggle}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
                <Minimize2 className="w-4 h-4" /> MINIMIZAR E JOGAR
            </button>
        </div>
      </div>

      {/* Área do Site (Iframe) */}
      <div className="flex-1 relative w-full h-full bg-white">
        {/* Loading / Fallback UI */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-900 z-0">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm font-bold text-slate-600">Carregando dados de mercado...</p>
            <p className="text-xs text-slate-500 mt-2 max-w-xs text-center">
                Se o site não aparecer em 5 segundos, ele pode estar bloqueando conexões externas.
            </p>
            <a 
                href={ANALYSIS_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-700 transition-colors"
            >
                Abrir Site Diretamente
            </a>
        </div>

        <iframe 
            src={ANALYSIS_URL}
            className="absolute inset-0 w-full h-full z-10"
            frameBorder="0"
            allowFullScreen
            onError={() => setIframeError(true)}
            title="TipMiner Analysis"
        />
      </div>

      {/* Footer / Dica Tática */}
      <div className="bg-slate-900 p-2 text-center border-t border-slate-800">
          <p className="text-xs text-yellow-500 font-medium animate-pulse">
              ⚠ Dica Tática: Analise o padrão das últimas 10 velas antes de realizar sua entrada.
          </p>
      </div>
    </div>
  );
};
