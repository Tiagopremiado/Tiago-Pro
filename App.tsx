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
    <div className="min-h-screen bg-slate-950 text-white font-sans relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      <InstallPrompt />

      {/* --- AMBIENT LIGHTING EFFECTS --- */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[300px] h-[300px] bg-aviator-red/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* --- HEADER (STICKY GLASS) --- */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-sm transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3 group">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                    <TiagoLogo className="w-10 h-10 relative z-10 drop-shadow-2xl" />
                </div>
                <div>
                    <h1 className="font-black text-lg tracking-tighter leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        TIAGO PRO
                    </h1>
                    <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] mt-0.5">
                        Sistema 2026
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col items-end">
                <div className={`
                    relative overflow-hidden text-sm font-mono font-bold px-4 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300
                    ${lockStatus === 'WIN' 
                        ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : lockStatus === 'LOSS' 
                        ? 'bg-red-900/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'bg-slate-900/50 border-slate-700/50 text-white'}
                `}>
                    {/* Pulse indicator */}
                    {lockStatus && <span className="absolute inset-0 bg-current opacity-10 animate-pulse"></span>}
                    
                    R$ {state.config.currentCapital.toFixed(2)}
                </div>
            </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-3xl mx-auto px-4 pb-28 pt-6 space-y-6 relative z-10">
          
          {/* RANK BADGE AREA */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <RankBadge lifetimeProfit={lifetimeProfit} />
          </div>

          {/* DYNAMIC TAB CONTENT */}
          <main className="min-h-[50vh] animate-in fade-in zoom-in-95 duration-300">
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
      </div>

      {/* --- BOTTOM NAVIGATION --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 pb-safe-area shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center p-2 max-w-3xl mx-auto">
          
          <NavButton 
            active={activeTab === 'session'} 
            onClick={() => setActiveTab('session')} 
            icon={PlayCircle} 
            label="Operar" 
            colorClass="text-emerald-400"
          />

          <NavButton 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            icon={LineChart} 
            label="Dados" 
            colorClass="text-blue-400"
          />

          <NavButton 
            active={activeTab === 'mindset'} 
            onClick={() => setActiveTab('mindset')} 
            icon={BrainCircuit} 
            label="Mental" 
            colorClass="text-aviator-gold"
          />

          <NavButton 
            active={activeTab === 'config'} 
            onClick={() => setActiveTab('config')} 
            icon={LayoutDashboard} 
            label="Config" 
            colorClass="text-purple-400"
          />

        </div>
      </nav>
    </div>
  );
};

// Helper Component for Nav Buttons to keep code clean
const NavButton = ({ active, onClick, icon: Icon, label, colorClass }: any) => (
    <button 
        onClick={onClick}
        className={`
            relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300
            ${active ? 'scale-110 -translate-y-2' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
        `}
    >
        {/* Active Glow Background */}
        {active && (
            <div className={`absolute inset-0 bg-current opacity-10 blur-md rounded-2xl ${colorClass}`}></div>
        )}
        
        <Icon 
            className={`w-6 h-6 transition-all duration-300 ${active ? `fill-current ${colorClass}` : 'fill-transparent'}`} 
            strokeWidth={active ? 2.5 : 2}
        />
        
        <span className={`text-[10px] font-bold mt-1 transition-colors ${active ? colorClass : 'text-slate-500'}`}>
            {label}
        </span>
        
        {/* Active Dot Indicator */}
        {active && (
            <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
        )}
    </button>
);

export default App;