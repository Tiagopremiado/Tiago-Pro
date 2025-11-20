import React, { useState, useEffect } from 'react';
import { DailySession, Round } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar, Calculator, DollarSign, ChevronRight, CalendarDays, Clock, BarChart3, Percent, AlertTriangle, ChevronDown, ChevronUp, Search, Trash2, Zap, TrendingDown, Bomb, Wallet } from 'lucide-react';

interface Props {
  sessions: DailySession[];
  initialBankroll: number;
  dailyGoalPercent?: number;
  currentBankroll: number;
  onClearHistory: () => void;
}

export const Analytics: React.FC<Props> = ({ sessions, initialBankroll, dailyGoalPercent = 5, currentBankroll, onClearHistory }) => {
  // --- STATE FOR SIMULATOR ---
  const [simCapital, setSimCapital] = useState(currentBankroll);
  const [simPercent, setSimPercent] = useState(dailyGoalPercent);
  const [simDays, setSimDays] = useState(30);
  const [showSimTable, setShowSimTable] = useState(false);
  
  // --- STATE FOR HISTORY EXPANSION ---
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  
  // --- STATE FOR DELETE CONFIRMATION ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- STATE FOR TIME ANALYSIS METRIC ---
  const [timeMetric, setTimeMetric] = useState<'profit' | 'rate'>('profit');

  // Update simulator defaults if props change (only on mount or major update)
  useEffect(() => {
    setSimCapital(currentBankroll);
    setSimPercent(dailyGoalPercent);
  }, [currentBankroll, dailyGoalPercent]);

  // --- CALCULATIONS FOR SIMULATOR ---
  const calculateProjection = () => {
    let balance = simCapital;
    const data = [];
    for (let i = 1; i <= simDays; i++) {
      const profit = balance * (simPercent / 100);
      balance += profit;
      data.push({
        day: i,
        start: balance - profit,
        profit: profit,
        total: balance
      });
    }
    return { finalBalance: balance, totalProfit: balance - simCapital, data };
  };

  // Helper for fixed milestones based on SIMULATOR settings
  const calculateFutureValue = (days: number) => {
      return simCapital * Math.pow(1 + (simPercent / 100), days);
  };

  const simulation = calculateProjection();
  const finalDate = new Date();
  finalDate.setDate(finalDate.getDate() + simDays);

  // --- REAL DATA & CHART GENERATION ---
  const chartData = [];
  let currentSimulatedBalance = simCapital;
  const maxChartDays = Math.max(sessions.length, simDays); 

  // Helper to sort sessions by date just in case
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (let i = 0; i <= maxChartDays; i++) {
      let realValue = null;
      let depositAmount = 0;

      if (i === 0) {
        realValue = initialBankroll;
      } else {
        const currentSession = sortedSessions[i-1];
        if (currentSession) {
            realValue = currentSession.endBalance;

            // DETECT DEPOSIT (Aporte de Aceleração)
            // Logic: If (Current Session Start Balance) > (Previous Session End Balance), the difference is a deposit/adjustment.
            const prevSession = sortedSessions[i-2];
            const prevBalance = prevSession ? prevSession.endBalance : initialBankroll;
            
            // We use a small threshold (e.g., 1.00) to avoid detecting tiny floating point rounding errors as deposits
            const gap = currentSession.startBalance - prevBalance;
            if (gap > 1) { 
                depositAmount = gap;
            }
        }
      }

      let idealValue = null;
      if (i <= simDays) {
          idealValue = Math.round(currentSimulatedBalance);
      }

      chartData.push({
          day: i,
          ideal: idealValue,
          real: realValue,
          deposit: depositAmount > 0 ? depositAmount : null // Store for Tooltip/Visualization
      });

      if (i < simDays) {
          currentSimulatedBalance = currentSimulatedBalance * (1 + (simPercent / 100));
      }
  }

  // --- TEMPORAL PATTERN ANALYSIS ---
  const processTimeData = () => {
    // Initialize 24h buckets
    const hours = Array.from({ length: 24 }, (_, i) => ({
        name: `${i}h`,
        hour: i,
        profit: 0,
        wins: 0,
        total: 0,
        rate: 0
    }));

    // Initialize Weekday buckets
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => ({
        name: d,
        dayIndex: i,
        profit: 0,
        wins: 0,
        total: 0,
        rate: 0
    }));

    // Initialize Month Day buckets (1-31)
    const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({
        name: `${i + 1}`, // Day 1, 2, ... 31
        dayIndex: i,
        profit: 0,
        wins: 0,
        total: 0,
        rate: 0
    }));

    // Flatten all rounds from all sessions
    const allRounds: Round[] = sessions.flatMap(s => s.roundsDetail || []);

    allRounds.forEach(r => {
        const date = new Date(r.timestamp);
        const h = date.getHours();
        const d = date.getDay(); // 0-6
        const dom = date.getDate() - 1; // 1-31 -> 0-30 index

        // Update Hourly
        if(hours[h]) {
            hours[h].profit += r.profit;
            hours[h].total += 1;
            if (r.win) hours[h].wins += 1;
        }

        // Update Daily (Week)
        if(daysOfWeek[d]) {
            daysOfWeek[d].profit += r.profit;
            daysOfWeek[d].total += 1;
            if (r.win) daysOfWeek[d].wins += 1;
        }

        // Update Month Day
        if(daysOfMonth[dom]) {
            daysOfMonth[dom].profit += r.profit;
            daysOfMonth[dom].total += 1;
            if (r.win) daysOfMonth[dom].wins += 1;
        }
    });

    // Calculate Rates
    const calcRate = (item: any) => ({
        ...item,
        rate: item.total > 0 ? (item.wins / item.total) * 100 : 0
    });

    const hoursWithStats = hours.map(calcRate);
    const daysWithStats = daysOfWeek.map(calcRate);
    const monthDaysWithStats = daysOfMonth.map(calcRate);

    // Sort for Best (Highest Profit)
    const bestHourProfit = [...hoursWithStats].sort((a, b) => b.profit - a.profit)[0];
    
    // Sort for Best (Highest Win Rate) - min 2 rounds to be significant
    const bestHourRate = [...hoursWithStats].filter(h => h.total >= 2).sort((a, b) => b.rate - a.rate)[0] || hoursWithStats[0];
    
    // Sort for Worst (Lowest Profit / Highest Loss)
    const worstHourProfit = [...hoursWithStats].sort((a, b) => a.profit - b.profit)[0];
    const worstHourRate = [...hoursWithStats].filter(h => h.total >= 2).sort((a, b) => a.rate - b.rate)[0];

    return { 
        hours: hoursWithStats, 
        daysOfWeek: daysWithStats, 
        daysOfMonth: monthDaysWithStats,
        bestHourProfit, 
        bestHourRate,
        worstHourProfit,
        worstHourRate,
        totalRounds: allRounds.length 
    };
  };

  const timeStats = processTimeData();

  const toggleSessionExpand = (id: string) => {
      setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const handleConfirmDelete = () => {
      onClearHistory();
      setShowDeleteConfirm(false);
  };

  // CUSTOM TOOLTIP COMPONENTS
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-2xl min-w-[150px]">
          <p className="text-slate-400 text-xs mb-2">Dia {label}</p>
          
          {/* Exibe Aporte se houver */}
          {data.deposit && (
              <div className="mb-2 pb-2 border-b border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-emerald-400" /> Aporte Realizado
                  </p>
                  <p className="text-emerald-400 font-black text-sm">+ R$ {data.deposit.toFixed(2)}</p>
              </div>
          )}

          {data.real !== null && (
            <div className="mb-1">
                <span className="text-emerald-500 font-bold text-sm">Real: </span>
                <span className="text-white font-mono text-sm">R$ {Number(data.real).toFixed(2)}</span>
            </div>
          )}
          {data.ideal !== null && (
             <div>
                <span className="text-aviator-gold font-bold text-sm">Meta: </span>
                <span className="text-white font-mono text-sm">R$ {Number(data.ideal).toFixed(2)}</span>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
              <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg shadow-2xl min-w-[180px]">
                  <p className="text-white font-black text-lg mb-3 border-b border-slate-800 pb-2">{data.name}</p>
                  <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center gap-4 text-slate-400">
                          <span className="font-bold">Volume:</span> 
                          <span className="text-white font-mono">{data.total} entradas</span>
                      </div>
                      <div className="flex justify-between items-center gap-4 text-slate-400">
                          <span className="font-bold">Assertividade:</span> 
                          <span className={`font-mono font-bold ${data.rate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                              {data.rate.toFixed(0)}%
                          </span>
                      </div>
                      <div className="flex justify-between items-center gap-4 text-slate-400">
                          <span className="font-bold">Resultado:</span> 
                          <span className={`font-mono font-bold text-sm ${data.profit >= 0 ? "text-emerald-400" : "text-red-500"}`}>
                              {data.profit >= 0 ? '+' : ''}R$ {data.profit.toFixed(2)}
                          </span>
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

  // CUSTOM DOT FOR APORTE
  const CustomDot = (props: any) => {
      const { cx, cy, payload } = props;
      if (payload && payload.deposit) {
          return (
              <g transform={`translate(${cx},${cy})`}>
                  <circle r={6} fill="#10B981" stroke="#fff" strokeWidth={2} />
                  <circle r={12} fill="#10B981" opacity={0.3} className="animate-pulse" />
              </g>
          );
      }
      return null;
  };

  return (
    <div className="space-y-8 pb-8 relative">
      
      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-red-900 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="bg-red-900/20 p-4 rounded-full mb-4">
                          <AlertTriangle className="w-10 h-10 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Tem certeza?</h3>
                      <p className="text-slate-400 text-sm">
                          Você perderá todo o registro da sua jornada até aqui. Essa ação não pode ser desfeita.
                      </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleConfirmDelete}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-red-900/20"
                      >
                          Sim, limpar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SIMULADOR DE FUTURO --- */}
      <div className="bg-slate-900 rounded-xl border border-aviator-gold/50 overflow-hidden shadow-xl shadow-black/50">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-aviator-gold" />
            <h2 className="text-lg font-bold text-white">Simulador de Riqueza 2026</h2>
        </div>

        <div className="p-4 space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">Capital Inicial Simulado (R$)</label>
                    <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                        <input 
                            type="number" 
                            value={simCapital}
                            onChange={(e) => setSimCapital(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 text-white focus:ring-1 focus:ring-aviator-gold outline-none transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                        <span>Meta Diária</span>
                        <span className="text-aviator-gold font-bold">{simPercent}%</span>
                    </label>
                    <input 
                        type="range" min="1" max="20" step="0.5"
                        value={simPercent}
                        onChange={(e) => setSimPercent(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-aviator-gold"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                        <span>Período</span>
                        <span className="text-white font-bold">{simDays} dias</span>
                    </label>
                    <input 
                        type="range" min="5" max="365" step="5"
                        value={simDays}
                        onChange={(e) => setSimDays(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>
            </div>

            {/* Results Big Numbers */}
            <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Em {simDays} dias ({finalDate.toLocaleDateString()})</p>
                    <p className="text-2xl md:text-3xl font-black text-emerald-400 truncate">
                        R$ {simulation.finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Banca Final Projetada</p>
                </div>
                <div className="border-l border-slate-700 pl-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Lucro Líquido</p>
                    <p className="text-xl md:text-2xl font-bold text-aviator-gold truncate">
                        + R$ {simulation.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">O que você lucrou</p>
                </div>
            </div>

            {/* Fixed Milestones Projection */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-700"></div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                         <CalendarDays className="w-3 h-3" /> 7 Dias
                    </p>
                    <p className="text-sm md:text-base font-bold text-white">R$ {calculateFutureValue(7).toFixed(2)}</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-aviator-gold"></div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                         <CalendarDays className="w-3 h-3" /> 15 Dias
                    </p>
                    <p className="text-sm md:text-base font-bold text-white">R$ {calculateFutureValue(15).toFixed(2)}</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                         <CalendarDays className="w-3 h-3" /> 30 Dias
                    </p>
                    <p className="text-sm md:text-base font-bold text-emerald-400">R$ {calculateFutureValue(30).toFixed(2)}</p>
                </div>
            </div>

            <button 
                onClick={() => setShowSimTable(!showSimTable)}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
                {showSimTable ? 'Ocultar Tabela Detalhada' : 'Ver Evolução Dia a Dia'}
                <ChevronRight className={`w-4 h-4 transition-transform ${showSimTable ? 'rotate-90' : ''}`} />
            </button>

            {showSimTable && (
                <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-700">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-800 text-slate-300">
                            <tr>
                                <th className="p-2">Dia</th>
                                <th className="p-2">Banca Inicial</th>
                                <th className="p-2 text-right">Lucro do Dia</th>
                                <th className="p-2 text-right">Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 bg-slate-900">
                            {simulation.data.map((row) => (
                                <tr key={row.day} className="hover:bg-slate-800/50">
                                    <td className="p-2 text-slate-500">#{row.day}</td>
                                    <td className="p-2 text-slate-400">R$ {row.start.toFixed(2)}</td>
                                    <td className="p-2 text-right text-emerald-400 font-mono">+ {row.profit.toFixed(2)}</td>
                                    <td className="p-2 text-right text-white font-bold font-mono">R$ {row.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* --- RADAR DE PERFORMANCE TEMPORAL (TRIPLE CHARTS) --- */}
      {timeStats.totalRounds > 0 && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-8 shadow-lg relative overflow-hidden">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">RADAR DE PADRÕES</h2>
                        <p className="text-xs text-slate-400 font-medium">Inteligência Temporal: Onde o dinheiro está.</p>
                    </div>
                 </div>
                 
                 {/* Toggle */}
                 <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex self-start">
                     <button 
                        onClick={() => setTimeMetric('profit')}
                        className={`px-4 py-2 text-xs font-bold rounded transition-all ${timeMetric === 'profit' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                        LUCRO (R$)
                     </button>
                     <button 
                        onClick={() => setTimeMetric('rate')}
                        className={`px-4 py-2 text-xs font-bold rounded transition-all ${timeMetric === 'rate' ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                        ASSERTIVIDADE (%)
                     </button>
                 </div>
             </div>

             {/* Highlights Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Best Hour Card */}
                 <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/30 p-5 rounded-xl relative group overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Zap className="w-24 h-24 text-emerald-400" />
                     </div>
                     <div className="relative z-10">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Melhor Horário</span>
                                 </div>
                                 <span className="text-4xl font-black text-white block mt-2">
                                     {timeMetric === 'profit' ? timeStats.bestHourProfit?.name : timeStats.bestHourRate?.name}
                                 </span>
                             </div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-between items-end">
                             <div>
                                <p className="text-[10px] text-slate-400 uppercase">Resultado</p>
                                <p className="text-lg font-bold text-white">
                                    {timeMetric === 'profit' 
                                        ? `+ R$ ${timeStats.bestHourProfit?.profit.toFixed(2)}`
                                        : `${timeStats.bestHourRate?.rate.toFixed(0)}% Win Rate`
                                     }
                                </p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] text-slate-400 uppercase">Volume</p>
                                 <p className="text-sm font-bold text-white">{timeMetric === 'profit' ? timeStats.bestHourProfit?.total : timeStats.bestHourRate?.total} Entradas</p>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Worst Hour Card (Danger Zone) */}
                 <div className="bg-gradient-to-br from-red-900/20 to-slate-900 border border-red-500/30 p-5 rounded-xl relative group overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                         <AlertTriangle className="w-24 h-24 text-red-500" />
                     </div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Zona de Perigo (Evitar)</span>
                                 </div>
                                 <span className="text-4xl font-black text-white block mt-2">
                                     {timeMetric === 'profit' 
                                        ? (timeStats.worstHourProfit?.profit < 0 ? timeStats.worstHourProfit?.name : '--')
                                        : (timeStats.worstHourRate ? timeStats.worstHourRate?.name : '--')
                                     }
                                 </span>
                             </div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-red-500/20 flex justify-between items-end">
                             <div>
                                <p className="text-[10px] text-slate-400 uppercase">Prejuízo / Pior Taxa</p>
                                <p className="text-lg font-bold text-red-400">
                                    {timeMetric === 'profit' 
                                        ? (timeStats.worstHourProfit?.profit < 0 ? `R$ ${timeStats.worstHourProfit?.profit.toFixed(2)}` : 'Sem prejuízos')
                                        : (timeStats.worstHourRate ? `${timeStats.worstHourRate?.rate.toFixed(0)}% Win Rate` : 'N/A')
                                     }
                                </p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] text-slate-400 uppercase">Volume</p>
                                 <p className="text-sm font-bold text-white">
                                    {timeMetric === 'profit' ? timeStats.worstHourProfit?.total : timeStats.worstHourRate?.total} Entradas
                                 </p>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             {/* COMPARATIVE CHARTS CONTAINER */}
             <div className="space-y-6">
                 
                 {/* TOP ROW: HOURLY & WEEKLY */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* CHART 1: HOURLY PERFORMANCE */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" /> Performance por Horário (24h)
                            </h3>
                        </div>

                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeStats.hours} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} 
                                        interval={3}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10}}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                    <Bar dataKey={timeMetric} radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {timeStats.hours.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={
                                                    timeMetric === 'rate' 
                                                        ? (entry.rate >= 50 ? '#10B981' : '#EF4444')
                                                        : (entry.profit >= 0 ? '#10B981' : '#EF4444')
                                                }
                                                fillOpacity={timeMetric === 'rate' ? (entry.total > 0 ? 1 : 0.1) : 1}
                                            />
                                        ))}
                                    </Bar>
                                    <ReferenceLine y={0} stroke="#334155" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CHART 2: WEEKLY PERFORMANCE */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-500" /> Performance Semanal (7 Dias)
                            </h3>
                        </div>

                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeStats.daysOfWeek} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10}}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                    <Bar dataKey={timeMetric} radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {timeStats.daysOfWeek.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={
                                                    timeMetric === 'rate' 
                                                        ? (entry.rate >= 50 ? '#10B981' : '#EF4444')
                                                        : (entry.profit >= 0 ? '#10B981' : '#EF4444')
                                                }
                                                fillOpacity={timeMetric === 'rate' ? (entry.total > 0 ? 1 : 0.1) : 1}
                                            />
                                        ))}
                                    </Bar>
                                    <ReferenceLine y={0} stroke="#334155" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 </div>

                 {/* CHART 3: MONTHLY PERFORMANCE (30 DAYS) */}
                 <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-slate-500" /> Ciclo Mensal (Dia 1 ao 31)
                            </h3>
                        </div>

                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeStats.daysOfMonth} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}} 
                                        interval={2}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10}}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                    <Bar dataKey={timeMetric} radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {timeStats.daysOfMonth.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={
                                                    timeMetric === 'rate' 
                                                        ? (entry.rate >= 50 ? '#10B981' : '#EF4444')
                                                        : (entry.profit >= 0 ? '#10B981' : '#EF4444')
                                                }
                                                fillOpacity={timeMetric === 'rate' ? (entry.total > 0 ? 1 : 0.1) : 1}
                                            />
                                        ))}
                                    </Bar>
                                    <ReferenceLine y={0} stroke="#334155" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
             </div>
          </div>
      )}

      {/* --- GRÁFICO DE EVOLUÇÃO (PROJECTION VS REALITY) --- */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl p-4 md:p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
            <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">
                    <TrendingUp className="w-4 h-4" /> Evolução Patrimonial
                </div>
                <h2 className="text-2xl font-black text-white">Projeção vs. Realidade</h2>
            </div>
            <div className="flex gap-4 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2"><span className="w-3 h-1 bg-emerald-500 rounded-full"></span> Real</div>
                <div className="flex items-center gap-2"><span className="w-3 h-1 bg-aviator-gold rounded-full"></span> Meta</div>
            </div>
        </div>

        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFD700" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}} 
                        tickFormatter={(val) => `${val/1000}k`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    
                    {/* Linha de Meta (Ideal) */}
                    <Area 
                        type="monotone" 
                        dataKey="ideal" 
                        stroke="#FFD700" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fillOpacity={1} 
                        fill="url(#colorIdeal)" 
                    />
                    
                    {/* Linha Real */}
                    <Area 
                        type="monotone" 
                        dataKey="real" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorReal)" 
                        dot={<CustomDot />}
                    />

                    {/* Linhas de Referência para Aportes */}
                    {chartData.map((entry, idx) => (
                        entry.deposit ? (
                            <ReferenceLine 
                                key={`ref-${idx}`} 
                                x={entry.day} 
                                stroke="#10B981" 
                                strokeDasharray="3 3" 
                                label={{ 
                                    value: 'APORTE', 
                                    position: 'top', 
                                    fill: '#10B981', 
                                    fontSize: 10, 
                                    fontWeight: 'bold' 
                                }} 
                            />
                        ) : null
                    ))}

                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* --- HISTÓRICO DE SESSÕES (TABLE) --- */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" /> Histórico de Operações
              </h3>
              <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1 rounded border border-red-900/30 hover:bg-red-900/20 transition-colors"
              >
                  <Trash2 className="w-3 h-3" /> Limpar Histórico
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                          <th className="p-4 font-medium">Data</th>
                          <th className="p-4 font-medium text-center">Status</th>
                          <th className="p-4 font-medium text-right">Lucro</th>
                          <th className="p-4 font-medium text-right">Banca Final</th>
                          <th className="p-4 font-medium text-center">Detalhes</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                      {sessions.slice().reverse().map(session => (
                          <React.Fragment key={session.id}>
                              <tr 
                                  onClick={() => toggleSessionExpand(session.id)}
                                  className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${expandedSessionId === session.id ? 'bg-slate-800/30' : ''}`}
                              >
                                  <td className="p-4 text-slate-300">
                                      <div className="font-bold">{new Date(session.date).toLocaleDateString()}</div>
                                      <div className="text-xs text-slate-500">{new Date(session.date).toLocaleTimeString()}</div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                                          session.status === 'WIN' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50' :
                                          session.status === 'LOSS' ? 'bg-red-900/30 text-red-400 border border-red-900/50' :
                                          'bg-slate-700 text-slate-300'
                                      }`}>
                                          {session.status}
                                      </span>
                                  </td>
                                  <td className={`p-4 text-right font-mono font-bold ${session.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {session.profit >= 0 ? '+' : ''}{session.profit.toFixed(2)}
                                  </td>
                                  <td className="p-4 text-right font-mono text-white">
                                      R$ {session.endBalance.toFixed(2)}
                                  </td>
                                  <td className="p-4 text-center">
                                      {expandedSessionId === session.id ? <ChevronUp className="w-4 h-4 inline text-slate-500" /> : <ChevronDown className="w-4 h-4 inline text-slate-500" />}
                                  </td>
                              </tr>
                              {/* EXPANDED ROW DETAILS */}
                              {expandedSessionId === session.id && (
                                  <tr>
                                      <td colSpan={5} className="bg-slate-950/50 p-0">
                                          <div className="p-4 border-t border-b border-slate-800 animate-in slide-in-from-top-2">
                                              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
                                                  <Search className="w-3 h-3" /> Raio-X da Sessão
                                              </p>
                                              
                                              {session.roundsDetail && session.roundsDetail.length > 0 ? (
                                                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                      {session.roundsDetail.map((round, idx) => {
                                                          // Lógica para detectar All-In (Aposta >= 99% do saldo anterior estimado)
                                                          // Como não temos o saldo exato pré-round salvo, estimamos.
                                                          // Mas para o visual simples, vamos destacar apostas muito altas (> 20% da banca final)
                                                          const isHighStakes = round.betAmount > (session.endBalance * 0.2); 
                                                          
                                                          return (
                                                              <div key={round.id} className={`flex justify-between items-center p-2 rounded border-l-2 ${
                                                                  isHighStakes ? 'bg-purple-900/10 border-purple-500' : 
                                                                  round.win ? 'bg-emerald-900/10 border-emerald-500' : 'bg-red-900/10 border-red-500'
                                                              }`}>
                                                                  <div className="flex items-center gap-3">
                                                                      <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                                                                      <div>
                                                                          <span className={`text-xs font-bold block ${round.win ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                              {round.win ? 'GREEN' : 'LOSS'}
                                                                          </span>
                                                                          <span className="text-[10px] text-slate-400">
                                                                              {new Date(round.timestamp).toLocaleTimeString()}
                                                                          </span>
                                                                      </div>
                                                                  </div>
                                                                  
                                                                  {isHighStakes && (
                                                                      <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded text-[9px] text-purple-300 font-bold border border-purple-500/30">
                                                                          <Bomb className="w-3 h-3" /> HIGH STAKES
                                                                      </div>
                                                                  )}

                                                                  <div className="text-right">
                                                                      <span className="text-xs text-slate-400 mr-3">
                                                                          Bet: R$ {round.betAmount.toFixed(2)}
                                                                          {round.multiplier > 0 && ` @ ${round.multiplier.toFixed(2)}x`}
                                                                      </span>
                                                                      <span className={`font-mono font-bold text-sm ${round.win ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                          {round.win ? '+' : ''}{round.profit.toFixed(2)}
                                                                      </span>
                                                                  </div>
                                                              </div>
                                                          );
                                                      })}
                                                  </div>
                                              ) : (
                                                  <p className="text-sm text-slate-500 italic py-2">Detalhes jogada a jogada não disponíveis para esta sessão antiga.</p>
                                              )}
                                          </div>
                                      </td>
                                  </tr>
                              )}
                          </React.Fragment>
                      ))}
                      {sessions.length === 0 && (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-500">
                                  Nenhuma operação registrada. Comece a operar para gerar dados.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};