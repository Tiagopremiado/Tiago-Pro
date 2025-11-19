import React, { useEffect, useState } from 'react';
import { loadState, saveState } from './utils/storage';
import { AppState, BankrollConfig, Round, DailySession } from './types';
import { SessionManager } from './components/SessionManager';
import { BankrollConfigCard } from './components/BankrollConfigCard';
import { Analytics } from './components/Analytics';
import { MindsetGuide } from './components/MindsetGuide';
import { OnboardingWizard } from './components/OnboardingWizard'; 
import { InstallPrompt } from './components/InstallPrompt'; 
import { TiagoLogo } from './components/TiagoLogo'; 
import { RankBadge } from './components/RankBadge'; 
import { LayoutDashboard, PlayCircle, LineChart, BrainCircuit } from 'lucide-react';
import { INITIAL_STATE } from './constants'; 

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const [activeTab, setActiveTab] = useState<'session' | 'config' | 'analytics' | 'mindset'>('session');
  const [lastSession, setLastSession] = useState<DailySession | undefined>(undefined);

  // Load initial state
  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
        setState(loaded);
        if (loaded.sessions && loaded.sessions.length > 0) {
            setLastSession(loaded.sessions[loaded.sessions.length - 1]);
        }
    }
  }, []);

  // Persist state on changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleConfigUpdate = (newConfig: BankrollConfig) => {
    setState(prev => ({ ...prev, config: newConfig }));
  };
  
  // Handle Onboarding Completion
  const handleOnboardingComplete = (initialConfig: BankrollConfig) => {
      setState(prev => ({
          ...prev,
          config: initialConfig,
          hasCompletedOnboarding: true
      }));
  };

  const startSession = () => {
    setState(prev => ({
        ...prev,
        isSessionActive: true,
        sessionStartTime: Date.now(),
        currentSessionRounds: []
    }));
  };

  const addRound = (round: Round) => {
      setState(prev => {
          const updatedRounds = [...prev.currentSessionRounds, round];
          // Update current capital in real-time for the session
          const newCapital = prev.config.currentCapital + round.profit;
          
          return {
              ...prev,
              currentSessionRounds: updatedRounds,
              config: {
                  ...prev.config,
                  currentCapital: newCapital
              }
          };
      });
  };

  const endSession = () => {
      setState(prev => {
          if (!prev.sessionStartTime) return prev;

          const sessionProfit = prev.currentSessionRounds.reduce((acc, r) => acc + r.profit, 0);
          const startBalance = prev.config.currentCapital - sessionProfit; // Reverse engineer start
          
          const newSession: DailySession = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              startBalance,
              endBalance: prev.config.currentCapital,
              profit: sessionProfit,
              durationSeconds: Math.floor((Date.now() - prev.sessionStartTime) / 1000),
              rounds: prev.currentSessionRounds.length,
              status: sessionProfit > 0 ? 'WIN' : sessionProfit < 0 ? 'LOSS' : 'BREAK_EVEN',
              roundsDetail: prev.currentSessionRounds // Salvando o histórico completo
          };

          // Atualiza o estado local da última sessão para o MindsetGuide
          setLastSession(newSession);

          return {
              ...prev,
              isSessionActive: false,
              sessionStartTime: null,
              currentSessionRounds: [],
              sessions: [...prev.sessions, newSession]
          };
      });
      
      // FORÇA O REDIRECIONAMENTO PARA O MINDSET COACH
      setActiveTab('mindset');
  };

  const clearHistory = () => {
      setState(prev => ({
          ...prev,
          sessions: [],
          // We optionally allow clearing onboarding here if you want to reset everything:
          // hasCompletedOnboarding: false
      }));
      setLastSession(undefined);
  };

  // --- DATA VAULT (BACKUP/RESTORE) ---
  const handleExportData = () => {
      try {
          const dataStr = JSON.stringify(state, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          const date = new Date().toISOString().split('T')[0];
          link.download = `tiagopro_backup_${date}.json`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (error) {
          console.error("Backup failed:", error);
          alert("Erro ao gerar backup.");
      }
  };

  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              if (!content) return;
              
              const parsed = JSON.parse(content);
              
              // Basic Validation
              if (parsed.config && Array.isArray(parsed.sessions)) {
                  if (window.confirm("ATENÇÃO: Isso substituirá todos os seus dados atuais pelos dados do arquivo. Deseja continuar?")) {
                      setState(parsed);
                      saveState(parsed);
                      // Restore last session reference if available
                      if (parsed.sessions && parsed.sessions.length > 0) {
                          setLastSession(parsed.sessions[parsed.sessions.length - 1]);
                      }
                      alert("Sucesso! Seu cofre de dados foi restaurado.");
                  }
              } else {
                  alert("Arquivo inválido. Certifique-se de usar um backup oficial do TiagoPro.");
              }
          } catch (err) {
              console.error("Restore failed:", err);
              alert("Erro ao ler o arquivo. O arquivo pode estar corrompido.");
          }
      };
      reader.readAsText(file);
  };


  // --- LOCKOUT LOGIC ---
  // Calculate total profit for TODAY across all sessions
  const today = new Date().toLocaleDateString();
  const todaySessions = state.sessions.filter(s => new Date(s.date).toLocaleDateString() === today);
  const todayTotalProfit = todaySessions.reduce((acc, s) => acc + s.profit, 0);
  
  // --- LIFETIME PROFIT FOR RANKING ---
  const lifetimeProfit = state.sessions.reduce((acc, s) => acc + s.profit, 0);

  const dailyGoalValue = state.config.currentCapital * ((state.config.dailyGoalPercentage || 5) / 100);
  const dailyStopLossValue = -(state.config.currentCapital * (state.config.stopLossPercentage / 100));

  // Determine Lock Status
  const isProfitGoalMet = todayTotalProfit >= dailyGoalValue;
  const isStopLossHit = todayTotalProfit <= dailyStopLossValue;
  
  const lockStatus = isProfitGoalMet ? 'WIN' : isStopLossHit ? 'LOSS' : null;

  // --- RENDER ONBOARDING IF NOT COMPLETE ---
  if (!state.hasCompletedOnboarding) {
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Prompt de Instalação */}
      <InstallPrompt />

      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-2xl mx-auto mb-4">
            <div className="flex items-center gap-3">
                <TiagoLogo className="w-10 h-10" />
                <div>
                    <h1 className="text-xl font-black tracking-tighter text-white leading-none">
                        TIAGO<span className="text-aviator-red">PRO</span>
                    </h1>
                    <p className="text-[10px] text-aviator-gold tracking-widest uppercase">Rumo a 2026</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-400">Banca Atual</div>
                <div className={`text-lg font-mono font-bold transition-all duration-500 ${
                    lockStatus === 'WIN' 
                        ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' 
                        : lockStatus === 'LOSS' 
                            ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' 
                            : 'text-emerald-400'
                }`}>
                    R$ {state.config.currentCapital.toFixed(2)}
                </div>
            </div>
        </div>
        
        {/* Rank Badge (Gamification) */}
        <div className="max-w-2xl mx-auto">
           <RankBadge lifetimeProfit={lifetimeProfit} />
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {activeTab === 'session' && (
            <SessionManager 
                config={state.config}
                isActive={state.isSessionActive}
                rounds={state.currentSessionRounds}
                startTime={state.sessionStartTime}
                onStart={startSession}
                onEnd={endSession}
                onAddRound={addRound}
                onUpdateConfig={handleConfigUpdate}
                lockStatus={lockStatus} // Passing the lock status
                todayProfit={todayTotalProfit}
            />
        )}
        {activeTab === 'config' && (
            <BankrollConfigCard 
                config={state.config}
                onUpdate={handleConfigUpdate}
                onExport={handleExportData}
                onImport={handleImportData}
            />
        )}
        {activeTab === 'analytics' && (
            <Analytics 
                sessions={state.sessions}
                initialBankroll={state.config.initialCapital}
                currentBankroll={state.config.currentCapital}
                dailyGoalPercent={state.config.dailyGoalPercentage}
                onClearHistory={clearHistory}
            />
        )}
        {activeTab === 'mindset' && (
            <MindsetGuide lastSession={lastSession} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-40">
        <div className="flex justify-around items-center max-w-2xl mx-auto h-16">
            <button 
                onClick={() => setActiveTab('session')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'session' ? 'text-aviator-red' : 'text-slate-500'}`}
            >
                <PlayCircle className="w-6 h-6" />
                <span className="text-[10px] font-bold">JOGAR</span>
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'analytics' ? 'text-aviator-red' : 'text-slate-500'}`}
            >
                <LineChart className="w-6 h-6" />
                <span className="text-[10px] font-bold">DADOS</span>
            </button>
            <button 
                onClick={() => setActiveTab('mindset')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'mindset' ? 'text-aviator-red' : 'text-slate-500'}`}
            >
                <BrainCircuit className="w-6 h-6" />
                <span className="text-[10px] font-bold">MENTAL</span>
            </button>
            <button 
                onClick={() => setActiveTab('config')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'config' ? 'text-aviator-red' : 'text-slate-500'}`}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-bold">CONFIG</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;