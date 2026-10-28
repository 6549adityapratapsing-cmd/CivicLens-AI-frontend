import React from 'react';
import {
  BookOpen,
  PhoneCall,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { LanguageCode } from '../types';

interface CivicGuideModalProps {
  language: LanguageCode;
}

export const CivicGuideModal: React.FC<CivicGuideModalProps> = ({ language }) => {
  const isHi = language === 'hi';

  const helplines = [
    { nameEn: 'National Emergency', nameHi: 'राष्ट्रीय आपातकालीन सेवा', number: '112', desc: 'Police, Fire, Ambulance' },
    { nameEn: 'Municipal Helpline', nameHi: 'नगर निगम नागरिक सेवा', number: '1913', desc: 'Civic amenities, road craters, waste' },
    { nameEn: 'Electricity Board (DISCOM)', nameHi: 'बिजली बोर्ड शिकायत', number: '1912', desc: 'Power cuts, exposed live wires' },
    { nameEn: 'Swachh Bharat Helpline', nameHi: 'स्वच्छ भारत शिकायत', number: '1969', desc: 'Sanitation, public toilets, dumping' },
    { nameEn: 'National Consumer Helpline', nameHi: 'राष्ट्रीय उपभोक्ता हेल्पलाइन', number: '1915', desc: 'Utility service deficiencies' },
  ];

  const portals = [
    {
      name: 'CPGRAMS Portal',
      descEn: 'Centralized Public Grievance Redress and Monitoring System (Government of India)',
      descHi: 'केंद्रीय लोक शिकायत निवारण और निगरानी प्रणाली (भारत सरकार)',
      url: 'https://pgportal.gov.in',
    },
    {
      name: 'Swachhata-MoHUA App',
      descEn: 'Official civic grievance redressal app by Ministry of Housing & Urban Affairs',
      descHi: 'आवासन और शहरी कार्य मंत्रालय का आधिकारिक नागरिक शिकायत निवारण ऐप',
      url: 'https://swachhata.co.in',
    },
    {
      name: 'RTI Online Portal',
      descEn: 'File Right to Information requests online for civic project accountability',
      descHi: 'नागरिक विकास कार्यों की जानकारी और जवाबदेही के लिए ऑनलाइन आरटीआई',
      url: 'https://rtionline.gov.in',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {isHi ? 'नागरिक अधिकार एवं शिकायत निवारण मार्गदर्शिका' : 'Citizen Grievance & Escalation Guide'}
          </h3>
          <p className="text-xs text-slate-400">
            {isHi
              ? 'नगर निगम, आरटीआई (RTI) और सरकारी शिकायत पोर्टल्स की संपूर्ण प्रक्रिया'
              : 'Complete manual for municipal redressal, official portals, and citizen escalation hierarchy'}
          </p>
        </div>
      </div>

      {/* Escalation Hierarchy Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>{isHi ? 'नगर निगम शिकायत निवारण सीढ़ी (Escalation Hierarchy)' : 'Municipal Escalation Hierarchy'}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              LEVEL 1 (Days 1–7)
            </span>
            <div className="text-xs font-bold text-white mt-2">
              {isHi ? 'कनिष्ठ अभियंता (JE) / वार्ड अधिकारी' : 'Junior Engineer (JE) / Ward Officer'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isHi
                ? 'स्थानीय वार्ड कार्यालय में फोटो सहित लिखित शिकायत जमा करें या ऐप पर दर्ज करें।'
                : 'Initial inspection, photographic documentation, and work estimate preparation.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              LEVEL 2 (Days 8–15)
            </span>
            <div className="text-xs font-bold text-white mt-2">
              {isHi ? 'सहायक / अधिशासी अभियंता (EE)' : 'Executive Engineer (PWD/Nagar Nigam)'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isHi
                ? 'यदि 7 दिनों में कार्रवाई न हो, तो शिकायत संख्या के साथ अधिशासी अभियंता को अग्रसारित करें।'
                : 'Budget allocation, contractor dispatch, and administrative enforcement.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-800">
              LEVEL 3 (Days 16–30)
            </span>
            <div className="text-xs font-bold text-white mt-2">
              {isHi ? 'नगर आयुक्त / क्षेत्रीय संयुक्त आयुक्त' : 'Municipal Commissioner / Zonal Joint Comm.'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isHi
                ? 'जनसुनवाई पोर्टल (CM Helpline / CPGRAMS) पर सीधे उच्चाधिकारी को अपील करें।'
                : 'Direct grievance escalation via Chief Minister Helpline or CPGRAMS apex desk.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
              LEVEL 4 (Post 30 Days)
            </span>
            <div className="text-xs font-bold text-white mt-2">
              {isHi ? 'सूचना का अधिकार (RTI) / लोकायुक्त' : 'Right to Information (RTI) / Lokayukta'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isHi
                ? 'RTI धारा 6(1) के तहत बजट, कार्य आदेश और देरी के कारणों की आधिकारिक मांग करें।'
                : 'Legal disclosure of contractor records, inspection logs, and non-action justification.'}
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Helpline Directory */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>{isHi ? 'महत्वपूर्ण नागरिक हेल्पलाइन नंबर' : 'Civic Emergency Helplines'}</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {helplines.map((h, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
              <div className="text-lg font-extrabold text-emerald-400 font-mono">{h.number}</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">
                {isHi ? h.nameHi : h.nameEn}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{h.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Government Portals */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-cyan-400" />
          <span>{isHi ? 'आधिकारिक सरकारी शिकायत पोर्टल' : 'Official Redressal Portals'}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {portals.map((p, i) => (
            <a
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-cyan-500/50 transition-all block group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-cyan-300">
                <span>{p.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {isHi ? p.descHi : p.descEn}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
