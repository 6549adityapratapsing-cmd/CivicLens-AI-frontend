import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { LanguageCode } from '../types';
import { UI_TEXT } from '../utils/translations';

interface DisclaimerBannerProps {
  language: LanguageCode;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ language }) => {
  const t = UI_TEXT[language];

  return (
    <aside
      aria-label={language === 'hi' ? 'नागरिक अस्वीकरण' : 'Citizen Advisory Disclaimer'}
      className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs flex items-start gap-3 my-6"
    >
      <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <span className="font-semibold text-slate-300">
          {language === 'hi' ? 'महत्वपूर्ण सूचना: ' : 'Legal & Municipal Notice: '}
        </span>
        {t.disclaimerText}
      </div>
    </aside>
  );
};
