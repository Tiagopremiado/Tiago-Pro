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
              
              // Validate basic structure
              if (parsed.config && Array.isArray(parsed.sessions)) {
                  setState(parsed);
                  if (parsed.sessions.length > 0) {
                      setLastSession(parsed.sessions[parsed.sessions.length - 1]);
                  }
                  alert("Dados restaurados com sucesso!");
              } else {
                  throw new Error("Formato inválido");
              }
          } catch (error) {
              console.error("Restore failed:", error);
              alert("Erro ao restaurar: Arquivo inválido.");
          }
      };
      reader.readAsText(file);
  };

  // --- GAME LOCK LOGIC (GLOBAL) ---
  const today = new Date().toDateString();
  const sessionsToday = state.sessions.filter(s => new Date(s.date).toDateString() === today);
  const dailyProfit = sessionsToday.reduce((acc, s) => acc + s.profit, 0);
  
  // Calculate Daily Limits based on Start of Day Balance (approximate logic)
  // In a perfect world we track 'startOfDayCapital', but for now we use current - dailyProfit
  const startOfDayCapital = state.config.currentCapital - dailyProfit;
  const dailyStopLoss = -(startOfDayCapital * (state.config.stopLossPercentage / 100));
  const dailyGoal = (startOfDayCapital * ((state.config.dailyGoalPercentage || 5) / 100));

  let lockStatus: 'WIN' | 'LOSS' | null = null;
  if (dailyProfit <= dailyStopLoss) lockStatus = 'LOSS';
  if (dailyProfit >= dailyGoal) lockStatus = 'WIN';

  // Calculate Lifetime Profit for Rank
  const lifetimeProfit = state.sessions.reduce((acc, s) => acc + s.profit, 0);

  if (!state.hasCompletedOnboarding) {
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <InstallPrompt />

      {/* Top Navigation / Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
            <TiagoLogo className="w-10 h-10" />
            <div>
                <h1 className="font-black text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    TIAGO PRO
                </h1>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                    Sistema 2026
                </p>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <div className={`text-sm font-mono font-bold px-3 py-1 rounded-full border ${lockStatus === 'WIN' ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse' : lockStatus === 'LOSS' ? 'bg-red-900/20 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-slate-800 border-slate-700 text-white'}`}>
                R$ {state.config.currentCapital.toFixed(2)}
            </div>
        </div>
      </header>

      {/* Rank Badge Area */}
      <div className="px-4 pt-4">
          <RankBadge lifetimeProfit={lifetimeProfit} />
      </div>

      {/* Main Content Area */}
      <main className="p-4 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
        
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
            lockStatus={lockStatus}
            todayProfit={dailyProfit}
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
            dailyGoalPercent={state.config.dailyGoalPercentage}
            currentBankroll={state.config.currentCapital}
            onClearHistory={clearHistory}
          />
        )}

        {activeTab === 'mindset' && (
          <MindsetGuide 
             lastSession={lastSession} 
             sessions={state.sessions}
             currentBankroll={state.config.currentCapital}
          />
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe-area shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center p-2 max-w-3xl mx-auto">
          <button 
            onClick={() => setActiveTab('session')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${activeTab === 'session' ? 'text-emerald-400 bg-emerald-900/20 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <PlayCircle className={`w-6 h-6 ${activeTab === 'session' ? 'fill-emerald-500/20' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Operar</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${activeTab === 'analytics' ? 'text-blue-400 bg-blue-900/20 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LineChart className={`w-6 h-6 ${activeTab === 'analytics' ? 'fill-blue-500/20' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Dados</span>
          </button>

          <button 
            onClick={() => setActiveTab('mindset')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${activeTab === 'mindset' ? 'text-aviator-gold bg-yellow-900/20 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BrainCircuit className={`w-6 h-6 ${activeTab === 'mindset' ? 'fill-yellow-500/20' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Mental</span>
          </button>

          <button 
            onClick={() => setActiveTab('config')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${activeTab === 'config' ? 'text-purple-400 bg-purple-900/20 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutDashboard className={`w-6 h-6 ${activeTab === 'config' ? 'fill-purple-500/20' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Config</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;