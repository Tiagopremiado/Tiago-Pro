import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { TiagoLogo } from './TiagoLogo';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already installed (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // 2. Check if dismissed previously
    const dismissed = localStorage.getItem('tiago_install_dismissed');
    if (dismissed) return;

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphone = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIphone) {
        setIsIOS(true);
        // Show iOS prompt after a small delay
        setTimeout(() => setShowPrompt(true), 3000);
    } else {
        // 4. Listen for Android/Desktop 'beforeinstallprompt'
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        });
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('tiago_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-aviator-gold/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
         
         {/* Close Button */}
         <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-2 text-slate-500 hover:text-white"
         >
            <X className="w-5 h-5" />
         </button>

         <div className="flex flex-col items-center text-center">
            <div className="mb-4 relative">
                <div className="absolute inset-0 bg-aviator-gold/20 blur-xl rounded-full"></div>
                <TiagoLogo className="w-20 h-20 relative z-10" />
            </div>
            
            <h3 className="text-xl font-black text-white mb-2">INSTALAR SISTEMA</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
               Para máxima performance e acesso rápido sem barras de navegador, instale o <strong>TiagoPro</strong> no seu dispositivo agora.
            </p>

            {isIOS ? (
                <div className="bg-slate-800 p-4 rounded-xl w-full text-left space-y-3 border border-slate-700">
                    <p className="text-xs text-slate-300 font-bold uppercase text-center mb-2">Como instalar no iPhone:</p>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <Share className="w-5 h-5 text-blue-500" />
                        <span>1. Toque no botão <strong>Compartilhar</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <PlusSquare className="w-5 h-5 text-slate-200" />
                        <span>2. Selecione <strong>Adicionar à Tela de Início</strong></span>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleInstallClick}
                    className="w-full bg-aviator-gold hover:bg-yellow-400 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)] active:scale-95"
                >
                    <Download className="w-5 h-5" /> INSTALAR AGORA
                </button>
            )}
            
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
                <Smartphone className="w-3 h-3" /> App Seguro & Otimizado
            </div>
         </div>
      </div>
    </div>
  );
};