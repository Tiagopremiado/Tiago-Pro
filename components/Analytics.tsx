import React, { useState, useEffect } from 'react';
import { DailySession, Round } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar, Calculator, DollarSign, ChevronRight, CalendarDays, Clock, BarChart3, Percent, AlertTriangle, ChevronDown, ChevronUp, Search, Trash2, Zap, Target, TrendingDown, Bomb } from 'lucide-react';

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

  // --- REAL DATA ---
  const totalProfit = sessions.reduce((acc, s) => acc + s.profit, 0);

  // --- CHART DATA (DYNAMIC REACTIVE) ---
  const chartData = [];
  let currentSimulatedBalance = simCapital;
  const maxChartDays = Math.max(sessions.length, simDays); 

  for (let i = 0; i <= maxChartDays; i++) {
      let realValue = null;
      if (i === 0) {
        realValue = initialBankroll;
      } else {
        realValue = sessions[i-1] ? sessions[i-1].endBalance : null;
      }

      let idealValue = null;
      if (i <= simDays) {
          idealValue = Math.round(currentSimulatedBalance);
      }

      chartData.push({
          day: i,
          ideal: idealValue,
          real: realValue
      });

      if (i < simDays) {
          currentSimulatedBalance = currentSimulatedBalance * (1 + (simPercent / 100));
      }
  }

  // --- TEMPORAL PATTERN ANALYSIS (NEW) ---
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

    // Flatten all rounds from all sessions
    const allRounds: Round[] = sessions.flatMap(s => s.roundsDetail || []);

    allRounds.forEach(r => {
        const date = new Date(r.timestamp);
        const h = date.getHours();
        const d = date.getDay();

        // Update Hourly
        hours[h].profit += r.profit;
        hours[h].total += 1;
        if (r.win) hours[h].wins += 1;

        // Update Daily
        daysOfWeek[d].profit += r.profit;
        daysOfWeek[d].total += 1;
        if (r.win) daysOfWeek[d].wins += 1;
    });

    // Calculate Rates
    const hoursWithStats = hours.map(h => ({
        ...h,
        rate: h.total > 0 ? (h.wins / h.total) * 100 : 0
    }));

    const daysWithStats = daysOfWeek.map(d => ({
        ...d,
        rate: d.total > 0 ? (d.wins / d.total) * 100 : 0
    }));

    // Find best metrics (Profit)
    const bestHourProfit = [...hoursWithStats].sort((a, b) => b.profit - a.profit)[0];
    const bestDayProfit = [...daysWithStats].sort((a, b) => b.profit - a.profit)[0];

    // Find best metrics (Win Rate) - min 2 rounds to be significant
    const bestHourRate = [...hoursWithStats].filter(h => h.total >= 2).sort((a, b) => b.rate - a.rate)[0] || hoursWithStats[0];
    const bestDayRate = [...daysWithStats].filter(d => d.total >= 2).sort((a, b) => b.rate - a.rate)[0] || daysWithStats[0];

    return { 
        hours: hoursWithStats, 
        daysOfWeek: daysWithStats, 
        bestHourProfit, 
        bestDayProfit,
        bestHourRate,
        bestDayRate,
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

      {/* --- RADAR DE PERFORMANCE TEMPORAL (NEW) --- */}
      {timeStats.totalRounds > 0 && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-6 shadow-lg">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <div>
                        <h2 className="text-lg font-bold text-white">Radar de Padrões</h2>
                        <p className="text-xs text-slate-400">Descubra quando você ganha mais.</p>
                    </div>
                 </div>
                 <div className="flex bg-slate-800 p-1 rounded-lg">
                     <button 
                        onClick={() => setTimeMetric('profit')}
                        className={`px-3 py-1 text-xs rounded font-bold transition-all ${timeMetric === 'profit' ? 'bg-aviator-gold text-black shadow' : 'text-slate-400 hover:text-white'}`}
                     >
                        Lucro (R$)
                     </button>
                     <button 
                        onClick={() => setTimeMetric('rate')}
                        className={`px-3 py-1 text-xs rounded font-bold transition-all ${timeMetric === 'rate' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                     >
                        Assertividade (%)
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Best Hour Card */}
                 <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                     <div>
                         <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                             <Clock className="w-3 h-3" /> Horário de Ouro
                         </span>
                         <span className="text-2xl font-bold text-white">
                             {timeMetric === 'profit' ? timeStats.bestHourProfit?.name : timeStats.bestHourRate?.name}
                         </span>
                         <p className="text-[10px] text-emerald-400">
                             {timeMetric === 'profit' 
                                ? `+ R$ ${timeStats.bestHourProfit?.profit.toFixed(2)} de lucro total`
                                : `${timeStats.bestHourRate?.rate.toFixed(0)}% de taxa de acerto`
                             }
                         </p>
                     </div>
                     <Zap className="w-8 h-8 text-aviator-gold opacity-20" />
                 </div>

                 {/* Best Day Card */}
                 <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                     <div>
                         <span className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                             <Calendar className="w-3 h-3" /> Dia da Vitória
                         </span>
                         <span className="text-2xl font-bold text-white">
                             {timeMetric === 'profit' ? timeStats.bestDayProfit?.name : timeStats.bestDayRate?.name}
                         </span>
                         <p className="text-[10px] text-emerald-400">
                             {timeMetric === 'profit'
                                ? `+ R$ ${timeStats.bestDayProfit?.profit.toFixed(2)} de lucro total`
                                : `${timeStats.bestDayRate?.rate.toFixed(0)}% de taxa de acerto`
                             }
                         </p>
                     </div>
                     <Target className="w-8 h-8 text-emerald-500 opacity-20" />
                 </div>
             </div>

             {/* Hourly Chart */}
             <div className="h-48 w-full">
                 <p className="text-xs text-slate-500 mb-2 text-center">Desempenho por Hora (00h - 23h)</p>
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={timeStats.hours}>
                        <XAxis dataKey="name" hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8' }}
                            formatter={(value: number) => timeMetric === 'profit' ? `R$ ${value.toFixed(2)}` : `${value.toFixed(0)}%`}
                        />
                        <Bar dataKey={timeMetric} radius={[2, 2, 0, 0]}>
                            {timeStats.hours.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={
                                        timeMetric === 'rate' 
                                            ? `rgba(16, 185, 129, ${Math.max(0.2, entry.rate / 100)})`
                                            : entry.profit > 0 ? '#10B981' : '#EF4444'
                                    } 
                                />
                            ))}
                        </Bar>
                     </BarChart>
                 </ResponsiveContainer>
             </div>
          </div>
      )}


      {/* --- GRÁFICO DE EVOLUÇÃO --- */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" /> Evolução: Real vs Projetado
        </h2>
        <div className="h-72 w-full bg-slate-950/50 rounded-lg p-2 border border-slate-800/50 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#475569" 
                fontSize={10} 
                tickFormatter={(val) => `D${val}`} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
              />
              <Area 
                type="monotone" 
                dataKey="ideal" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#colorIdeal)" 
                name="Meta Ideal" 
              />
              <Area 
                type="monotone" 
                dataKey="real" 
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorReal)" 
                name="Banca Real" 
                activeDot={{ r: 6, fill: '#10B981', stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- HISTÓRICO DE SESSÕES --- */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" /> Histórico de Sessões
        </h2>
        
        {sessions.length === 0 ? (
            <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center text-slate-500">
                Nenhuma sessão registrada. Comece a operar para gerar dados.
            </div>
        ) : (
            <div className="space-y-3">
                {sessions.slice().reverse().map((session) => {
                    const isExpanded = expandedSessionId === session.id;
                    return (
                        <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md transition-all">
                            {/* Header (Clickable) */}
                            <div 
                                onClick={() => toggleSessionExpand(session.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${session.profit >= 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                                        {session.profit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">
                                            {new Date(session.date).toLocaleDateString()} <span className="text-slate-500 font-normal text-xs">• {new Date(session.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {session.rounds} rodadas • {Math.floor(session.durationSeconds / 60)} min
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`text-right font-mono font-bold ${session.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {session.profit >= 0 ? '+' : ''}R$ {session.profit.toFixed(2)}
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="bg-slate-950/50 border-t border-slate-800 p-4 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Raio-X da Sessão</h4>
                                    <div className="space-y-2">
                                        {session.roundsDetail && session.roundsDetail.length > 0 ? (
                                            (() => {
                                                let runningBalance = session.startBalance;
                                                return session.roundsDetail.map((round) => {
                                                    // Determine All-in status: bet is within 1% of the current running balance
                                                    const isAllIn = Math.abs(round.betAmount - runningBalance) < 0.5 || round.betAmount >= runningBalance * 0.99;
                                                    
                                                    // Element definition
                                                    const el = (
                                                        <div key={round.id} className={`flex justify-between items-center text-sm p-2 rounded border-l-2 ${isAllIn ? 'bg-purple-900/20 border-purple-500 animate-pulse' : 'hover:bg-slate-800/50'}`} style={{ borderColor: isAllIn ? '#A855F7' : round.win ? '#10B981' : '#EF4444' }}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-400 text-xs font-mono">{new Date(round.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                                                <div className="flex items-center gap-1">
                                                                    {isAllIn && <Bomb className="w-4 h-4 text-purple-500" />}
                                                                    <span className="text-slate-300 font-bold">{round.multiplier > 0 ? `${round.multiplier.toFixed(2)}x` : 'LOSS'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isAllIn && (
                                                                    <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">ALL-IN</span>
                                                                )}
                                                                <span className="text-[10px] text-slate-500 uppercase bg-slate-800 px-1 rounded hidden md:inline-block">{round.strategy}</span>
                                                                <span className={`font-mono ${round.win ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                    {round.win ? '+' : ''}{round.profit.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                    
                                                    // Update running balance for next iteration
                                                    runningBalance += round.profit;
                                                    return el;
                                                });
                                            })()
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">Detalhes não disponíveis para sessões antigas.</p>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                                        <span>Banca Inicial: R$ {session.startBalance?.toFixed(2)}</span>
                                        <span>Banca Final: R$ {session.endBalance.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <div className="pt-8 border-t border-slate-800 flex justify-center">
          <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs text-red-900 hover:text-red-500 transition-colors uppercase tracking-widest font-bold py-2 px-4 rounded hover:bg-red-900/10"
          >
              <Trash2 className="w-4 h-4" /> Limpar todo histórico
          </button>
      </div>
    </div>
  );
};