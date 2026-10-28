import React, { useEffect, useState } from 'react';
import { Scan, CheckCircle2 } from 'lucide-react';
import { LanguageCode } from '../types';

interface AnalysisProgressProps {
  language: LanguageCode;
  aiProvider: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  language,
  aiProvider,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps =
    language === 'hi'
      ? [
          { title: 'साक्ष्य सत्यापन', desc: 'छवि मेटाडेटा और फाइल की अखंडता की जांच' },
          {
            title: 'मल्टीमॉडल AI स्कैनिंग',
            desc: `${aiProvider.toUpperCase()} द्वारा दृश्य साक्ष्य व क्षति का विश्लेषण`,
          },
          {
            title: 'गंभीरता एवं प्रभाव मूल्यांकन',
            desc: 'सार्वजनिक सुरक्षा, यातायात और स्वास्थ्य खतरों की गणना',
          },
          {
            title: 'शिकायत पत्र प्रारूप तैयार करना',
            desc: 'नगर निगम एवं वार्ड अधिकारियों हेतु औपचारिक आवेदन निर्माण',
          },
        ]
      : [
          { title: 'Validating Evidence', desc: 'Verifying image resolution, type, and file integrity' },
          {
            title: 'Multimodal Vision Scan',
            desc: `Detecting civic hazards with ${aiProvider.toUpperCase()}`,
          },
          {
            title: 'Severity & Impact Matrix',
            desc: 'Assessing public safety hazards, traffic impact, and urgency',
          },
          {
            title: 'Drafting Municipal Grievance',
            desc: 'Formulating structured letter for CPGRAMS & Nagar Nigam',
          },
        ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 800);
    const timer2 = setTimeout(() => setCurrentStep(2), 2200);
    const timer3 = setTimeout(() => setCurrentStep(3), 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
      {/* Top glowing scanning bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 animate-pulse" />

      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/30">
            <Scan className="w-8 h-8 animate-spin" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white tracking-wide">
          {language === 'hi' ? 'नागरिक साक्ष्य का विश्लेषण जारी है' : 'Analyzing Civic Evidence'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          {language === 'hi'
            ? 'कृपया प्रतीक्षा करें, AI मॉडल समस्या की पहचान कर रहा है...'
            : 'Please hold on, the AI vision model is evaluating civic damage and drafting your report...'}
        </p>
      </div>

      {/* Progress Steps list */}
      <div className="space-y-3 max-w-md mx-auto">
        {steps.map((step, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-cyan-500/60 bg-cyan-950/30 ring-1 ring-cyan-500/40'
                  : isDone
                  ? 'border-emerald-800/40 bg-emerald-950/20'
                  : 'border-slate-800/40 bg-slate-900/20 opacity-50'
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 bg-slate-800" />
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? 'text-cyan-300'
                      : isDone
                      ? 'text-emerald-300'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
