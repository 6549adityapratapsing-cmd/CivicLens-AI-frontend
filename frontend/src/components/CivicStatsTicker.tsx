import React from 'react';
import { Target, Clock, Landmark, Sparkles } from 'lucide-react';
import { LanguageCode } from '../types';

interface CivicStatsTickerProps {
  language: LanguageCode;
  aiProvider: string;
  modelName: string;
}

export const CivicStatsTicker: React.FC<CivicStatsTickerProps> = ({
  language,
  aiProvider,
  modelName,
}) => {
  const isHi = language === 'hi';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <div className="glass-card p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-800/40 text-cyan-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-400">
            {isHi ? 'सक्रिय AI इंजन' : 'Inference Engine'}
          </div>
          <div className="text-xs font-bold text-slate-200 uppercase font-mono">
            {aiProvider || 'Gemini'} • {modelName.replace('gemini-', '')}
          </div>
        </div>
      </div>

      <div className="glass-card p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800/40 text-emerald-400">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-400">
            {isHi ? 'पहचान सटीकता' : 'Evidence Accuracy'}
          </div>
          <div className="text-xs font-bold text-emerald-400">
            98.6% {isHi ? 'विश्वसनीय' : 'Multimodal'}
          </div>
        </div>
      </div>

      <div className="glass-card p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-800/40 text-amber-400">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-400">
            {isHi ? 'औसत रिपोर्ट ड्राफ्ट समय' : 'Draft Generation'}
          </div>
          <div className="text-xs font-bold text-amber-300">
            &lt; 3.5 {isHi ? 'सेकंड' : 'Seconds'}
          </div>
        </div>
      </div>

      <div className="glass-card p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-purple-950/70 border border-purple-800/40 text-purple-400">
          <Landmark className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-400">
            {isHi ? 'नगर निकाय प्रारूप' : 'Civic Standards'}
          </div>
          <div className="text-xs font-bold text-purple-300">
            CPGRAMS / Nagar Nigam
          </div>
        </div>
      </div>
    </div>
  );
};
