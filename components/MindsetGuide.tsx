import React from 'react';
import { Brain, CheckCircle, XCircle, MessageSquareWarning, ShieldAlert, ThumbsUp, Skull, Lock } from 'lucide-react';
import { DailySession } from '../types';

interface Props {
    lastSession?: DailySession;
}

export const MindsetGuide: React.FC<Props> = ({ lastSession }) => {
  
  // Lógica do "Psicólogo"
  const getCoachMessage = () => {
      if (!lastSession) return {
          title: "MENTALIDADE DE AÇO",
          message: "A consistência é chata. A riqueza também. Se você quer emoção, vá pular de paraquedas. Aqui estamos para fazer dinheiro.",
          type: 'neutral'
      };

      if (lastSession.profit > 0) {
          return {
              title: "BAIXA A BOLA, TIAGO!",
              message: "Você ganhou. E daí? O mercado está esperando você se sentir 'o invencível' para tomar tudo de volta na próxima sessão. A euforia é o veneno do apostador. Pegue esse lucro, tranque e suma daqui. Se você jogar de novo agora, vai entregar tudo.",
              type: 'win'
          };
      } else if (lastSession.profit < 0) {
          return {
              title: "PARE DE SANGRAR.",
              message: "Doeu? Ótimo. Use essa dor. O amador tenta recuperar agora e quebra a banca. O profissional aceita o prejuízo como custo operacional, fecha a tela e volta amanhã com a cabeça fria. Quem é você? Um viciado ou um futuro milionário?",
              type: 'loss'
          };
      } else {
           return {
              title: "EMPATE É VITÓRIA",
              message: "Você sobreviveu. Proteger o capital é a regra número 1. Melhor sair no zero a zero do que no vermelho. Paciência é a chave.",
              type: 'neutral'
          };
      }
  };

  const coach = getCoachMessage();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* --- ÁREA DO MENTOR (Destaque) --- */}
      <div className={`relative p-6 rounded-xl border-2 shadow-2xl overflow-hidden ${
          coach.type === 'win' ? 'bg-emerald-950/80 border-emerald-500' : 
          coach.type === 'loss' ? 'bg-red-950/80 border-red-600' : 
          'bg-slate-900 border-aviator-gold'
      }`}>
          {/* Ícone de Fundo */}
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12">
              {coach.type === 'win' ? <ShieldAlert className="w-40 h-40 text-emerald-500" /> : 
               coach.type === 'loss' ? <Skull className="w-40 h-40 text-red-500" /> : 
               <Brain className="w-40 h-40 text-aviator-gold" />}
          </div>

          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-full ${
                      coach.type === 'win' ? 'bg-emerald-500 text-black' : 
                      coach.type === 'loss' ? 'bg-red-600 text-white' : 
                      'bg-aviator-gold text-black'
                  }`}>
                      <MessageSquareWarning className="w-8 h-8" />
                  </div>
                  <div>
                      <p className="text-xs uppercase tracking-widest opacity-70 font-bold">Mensagem do Mentor</p>
                      <h2 className={`text-2xl font-black italic uppercase ${
                          coach.type === 'win' ? 'text-emerald-400' : 
                          coach.type === 'loss' ? 'text-red-500' : 
                          'text-white'
                      }`}>
                          {coach.title}
                      </h2>
                  </div>
              </div>
              
              <div className="bg-black/40 p-4 rounded-lg backdrop-blur-sm border border-white/5">
                  <p className="text-lg text-slate-200 font-medium leading-relaxed font-mono">
                      "{coach.message}"
                  </p>
              </div>

              {lastSession && (
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-2">
                      <span>Última Sessão: {new Date(lastSession.date).toLocaleTimeString()}</span>
                      <span className={`font-bold ${lastSession.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          Resultado: {lastSession.profit >= 0 ? '+' : ''}R$ {lastSession.profit.toFixed(2)}
                      </span>
                  </div>
              )}
          </div>
      </div>

      {/* --- OS 10 MANDAMENTOS DO PROFISSIONAL --- */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <h3 className="text-lg font-bold text-aviator-gold mb-6 flex items-center gap-2 uppercase tracking-wider">
             <Lock className="w-5 h-5" /> Código de Honra 2026
        </h3>
        
        <div className="space-y-4">
            {[
                "Nunca persiga perdas. Aceitou o loss, você controla o jogo.",
                "Lucro no bolso vale mais que lucro na tela.",
                "A banca é sua empresa. Não a quebre.",
                "Se bateu a meta em 5 minutos, PARE. Não tente a sorte.",
                "Fadiga mental custa caro. 30 minutos é o limite.",
                "Não opere se estiver triste, bêbado ou eufórico.",
                "O mercado é soberano. Não tente adivinhar, siga a estratégia.",
                "Juros compostos são a oitava maravilha. Respeite o processo.",
                "Saque precoce enche o bolso. Ganância enche o ego.",
                "Você vai ser rico em 2026. Mas só se tiver disciplina HOJE."
            ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors border-l-2 border-slate-700 hover:border-aviator-red">
                    <span className="text-aviator-red font-black text-sm min-w-[20px]">#{idx + 1}</span>
                    <p className="text-sm text-slate-300 font-medium">{item}</p>
                </div>
            ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 text-center">
           <h4 className="text-white font-bold mb-2">Precisa de ajuda?</h4>
           <p className="text-sm text-slate-400 mb-4">
               Se sentir sintomas de vício, tremedeira ou ansiedade excessiva, pare imediatamente.
               Sua saúde mental vale mais que qualquer aposta.
           </p>
           <div className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900">
               <ThumbsUp className="w-3 h-3" /> Foco no Longo Prazo
           </div>
      </div>
    </div>
  );
};