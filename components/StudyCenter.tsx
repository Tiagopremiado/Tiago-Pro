import React, { useState, useEffect } from 'react';
import { ExternalAnalysis, AnalysisMode } from './ExternalAnalysis';
import { BookOpen, Lightbulb, Youtube, TrendingUp, Brain, Target, RefreshCw, Search, ShieldCheck, PlayCircle, Microscope, Wallet, AlertTriangle, TrendingDown, Calculator } from 'lucide-react';

// Banco de Dados de Conhecimento (Simulando busca na internet)
const KNOWLEDGE_BASE = [
    {
        id: 1,
        category: 'Técnica',
        title: 'O Padrão de Recuperação em V',
        content: 'Após uma sequência de velas azuis (1.00x - 1.50x), o algoritmo tende a pagar uma vela rosa alta para equilibrar o RTP (Return to Player). Fique atento a sequências de 3 a 4 azuis.',
        icon: TrendingUp,
        color: 'text-emerald-400'
    },
    {
        id: 2,
        category: 'Mentalidade',
        title: 'O Efeito "Mão de Alface"',
        content: 'Sair muito cedo por medo (1.10x) drena sua banca a longo prazo porque você precisa de muitas vitórias para cobrir um único loss. Confie na sua estratégia de 2.00x.',
        icon: Brain,
        color: 'text-aviator-gold'
    },
    {
        id: 3,
        category: 'Gestão',
        title: 'A Regra dos 3 Stops',
        content: 'Se você tomou 3 stops seguidos em horários diferentes, não opere mais hoje. O mercado está em ciclo de recolhimento. Proteja o capital.',
        icon: ShieldCheck,
        color: 'text-blue-400'
    },
    {
        id: 4,
        category: 'Vídeo Recomendado',
        title: 'Como Ler o Gráfico de Candlestick no Aviator',
        content: 'Aprenda a identificar quando a "Vela Rosa" está carregando. (Procure no YouTube por: Padrões de Velas Crash Games)',
        icon: Youtube,
        color: 'text-red-500'
    },
    {
        id: 5,
        category: 'Técnica',
        title: 'Estratégia de Minutos Pagantes',
        content: 'Estatisticamente, os minutos finais da hora (50 a 59) e os iniciais (01 a 10) tendem a ter maior volatilidade. Use o TipMiner acima para confirmar.',
        icon: Target,
        color: 'text-purple-400'
    },
    {
        id: 6,
        category: 'Psicologia',
        title: 'Dopamina Detox',
        content: 'O jogo vicia porque libera dopamina aleatória. Para combater isso, torne seu processo chato e previsível. Se estiver emocionado, você está errado.',
        icon: Brain,
        color: 'text-pink-400'
    },
    {
        id: 7,
        category: 'Técnica',
        title: 'Aposta de Cobertura Inteligente',
        content: 'Use a primeira aposta para cobrir o custo da segunda. Ex: Aposta A sai em 1.50x (cobre tudo), Aposta B busca a vela rosa (lucro puro).',
        icon: TrendingUp,
        color: 'text-emerald-400'
    },
    {
        id: 8,
        category: 'Curiosidade',
        title: 'O que é o Provably Fair?',
        content: 'É o sistema criptográfico que garante que o resultado já estava definido antes da rodada começar. Não existe "timing do clique", existe entrar na rodada certa.',
        icon: Lightbulb,
        color: 'text-yellow-400'
    },
    {
        id: 9,
        category: 'Padrão Oculto',
        title: 'O Espelhamento Rosa',
        content: 'Muitas vezes, após uma vela de 10x+, o mercado paga uma sequência de baixas e depois "espelha" outra vela alta com valor similar. Anote os minutos exatos da primeira vela.',
        icon: Microscope,
        color: 'text-purple-500'
    },
    {
        id: 10,
        category: 'Iniciante',
        title: 'Gestão de Banca 101',
        content: 'Nunca coloque mais de 5% da banca em uma única rodada. Se você tem R$ 100, sua entrada máxima é R$ 5. Sobrevivência é a prioridade número 1.',
        icon: Wallet,
        color: 'text-emerald-400'
    },
    {
        id: 11,
        category: 'Psicologia',
        title: 'A Armadilha do FOMO',
        content: 'Viu uma vela de 100x e entrou na próxima achando que viria outra? Erro clássico. O FOMO (Medo de Ficar de Fora) é o maior causador de prejuízo em iniciantes.',
        icon: AlertTriangle,
        color: 'text-orange-500'
    },
    {
        id: 12,
        category: 'Técnica',
        title: 'O Perigo do 1.00x (Insta-Loss)',
        content: 'O algoritmo é programado para dar lucro à casa. As velas de 1.00x (que quebram na decolagem) servem para limpar a mesa. Se vier uma, espere pelo menos 3 rodadas antes de entrar.',
        icon: TrendingDown,
        color: 'text-red-500'
    },
    {
        id: 13,
        category: 'Matemática',
        title: 'A Probabilidade do 2.00x',
        content: 'Estatisticamente, o multiplicador 2.00x aparece em cerca de 48% das rodadas. Com uma gestão correta, é o ponto doce entre risco e retorno para bater metas.',
        icon: Calculator,
        color: 'text-blue-400'
    }
];

export const StudyCenter: React.FC = () => {
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('split');
    const [dailyFeed, setDailyFeed] = useState<typeof KNOWLEDGE_BASE>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Simula busca de conteúdo novo a cada acesso
    useEffect(() => {
        setIsLoading(true);
        // Shuffle array
        const shuffled = [...KNOWLEDGE_BASE].sort(() => 0.5 - Math.random());
        // Pick first 4 items
        setTimeout(() => {
            setDailyFeed(shuffled.slice(0, 4));
            setIsLoading(false);
        }, 800); // Fake loading delay for realism
    }, []);

    const refreshContent = () => {
        setIsLoading(true);
        const shuffled = [...KNOWLEDGE_BASE].sort(() => 0.5 - Math.random());
        setTimeout(() => {
            setDailyFeed(shuffled.slice(0, 4));
            setIsLoading(false);
        }, 600);
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-aviator-gold" />
                        ACADEMIA PRO
                    </h2>
                    <p className="text-xs text-slate-400">Estudo Técnico & Análise de Mercado</p>
                </div>
                <div className="bg-blue-900/20 px-3 py-1 rounded-full border border-blue-500/30 text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Search className="w-3 h-3" /> Fonte: Internet/Database
                </div>
            </div>

            {/* ÁREA DE ANÁLISE (TIPMINER) */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-1 shadow-lg">
                <div className="bg-slate-950/50 p-2 rounded-t-lg flex items-center gap-2 border-b border-slate-800 mb-1">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase">Ferramenta de Gráfico (Ao Vivo)</span>
                </div>
                <ExternalAnalysis mode={analysisMode} setMode={setAnalysisMode} isSessionActive={true} />
            </div>

            {/* FEED DE CONTEÚDO DINÂMICO */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        Feed de Inteligência do Dia
                    </h3>
                    <button 
                        onClick={refreshContent}
                        className="text-xs text-slate-500 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full transition-colors"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-900 h-32 rounded-xl animate-pulse border border-slate-800"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {dailyFeed.map((item) => (
                            <div key={item.id} className="bg-slate-900 border border-slate-800 hover:border-aviator-gold/30 p-5 rounded-xl transition-all hover:shadow-lg group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <item.icon className={`w-24 h-24 ${item.color}`} />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-3 border ${item.color.replace('text-', 'border-').replace('400', '500/30').replace('500', '500/30')} bg-slate-950/50 ${item.color}`}>
                                        <item.icon className="w-3 h-3" /> {item.category}
                                    </div>
                                    
                                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-aviator-gold transition-colors">
                                        {item.title}
                                    </h4>
                                    
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {item.content}
                                    </p>

                                    {item.category.includes('Vídeo') && (
                                        <button className="mt-4 w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                            <PlayCircle className="w-4 h-4" /> Buscar no YouTube
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg text-center border border-slate-800">
                <p className="text-xs text-slate-500">
                    "O conhecimento é o único multiplicador que ninguém pode tirar de você."
                </p>
            </div>
        </div>
    );
};