import React, { useState } from 'react';
import {
  AlertTriangle,
  Eye,
  ShieldCheck,
  Building,
  ArrowRight,
  Sparkles,
  Info,
  Maximize2,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CivicAnalysisResponse, LanguageCode, PriorityLevel } from '../types';
import { UI_TEXT } from '../utils/translations';

interface AnalysisResultCardProps {
  report: CivicAnalysisResponse;
  language: LanguageCode;
  imagePreviewUrl?: string | null;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  report,
  language,
  imagePreviewUrl,
}) => {
  const t = UI_TEXT[language];
  const [isZoomed, setIsZoomed] = useState(false);

  const getPriorityStyle = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical':
        return {
          bg: 'bg-rose-950/90 border-rose-600/90 text-rose-200 ring-rose-500/40 shadow-rose-950/50',
          dot: 'bg-rose-500 animate-ping',
          label: t.priorityCritical,
          badgeBg: 'bg-rose-500',
        };
      case 'High':
        return {
          bg: 'bg-orange-950/90 border-orange-600/90 text-orange-200 ring-orange-500/40 shadow-orange-950/50',
          dot: 'bg-orange-500',
          label: t.priorityHigh,
          badgeBg: 'bg-orange-500',
        };
      case 'Medium':
        return {
          bg: 'bg-amber-950/90 border-amber-600/90 text-amber-200 ring-amber-500/40 shadow-amber-950/50',
          dot: 'bg-amber-400',
          label: t.priorityMedium,
          badgeBg: 'bg-amber-500',
        };
      case 'Low':
      default:
        return {
          bg: 'bg-emerald-950/90 border-emerald-600/90 text-emerald-200 ring-emerald-500/40 shadow-emerald-950/50',
          dot: 'bg-emerald-400',
          label: t.priorityLow,
          badgeBg: 'bg-emerald-500',
        };
    }
  };

  const priorityStyle = getPriorityStyle(report.suggested_priority);

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-2xl space-y-6">
      {/* Top Banner: Results Status & Model Information */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            {language === 'hi' ? 'एआई विश्लेषण परिणाम' : 'AI Analysis Results Panel'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">
            ID: <span className="font-mono text-slate-300">{report.analysis_id.slice(0, 8)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase font-semibold text-slate-300">{report.ai_provider}</span>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-300">{report.model_used}</span>
        </div>
      </div>

      {/* Main Analysis Section: Side-by-Side Original Image & Issue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Original Uploaded Image Preview */}
        {imagePreviewUrl ? (
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold flex items-center gap-1.5 text-slate-200">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                {language === 'hi' ? 'मूल साक्ष्य छवि' : 'Original Evidence Photo'}
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                title="Zoom image"
              >
                <Maximize2 className="w-3 h-3" />
                <span>{language === 'hi' ? 'बड़ा करें' : 'Zoom'}</span>
              </button>
            </div>

            <div
              onClick={() => setIsZoomed(true)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-cyan-800/40 bg-slate-950 aspect-video sm:aspect-square flex items-center justify-center shadow-lg transition-all hover:border-cyan-500/60"
            >
              <img
                src={imagePreviewUrl}
                alt="Submitted civic evidence"
                className="w-full h-full object-contain sm:object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-xs text-slate-200 flex items-center gap-1.5 font-medium">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                  {language === 'hi' ? 'पूरा दृश्य देखने के लिए क्लिक करें' : 'Click to view full photo'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{language === 'hi' ? 'साक्ष्य स्थिति:' : 'Evidence status:'}</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                {language === 'hi' ? 'विश्लेषण पूर्ण' : 'Analyzed by Gemma'}
              </span>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 p-6 rounded-xl border border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center text-center space-y-2 aspect-video">
            <Camera className="w-8 h-8 text-slate-600" />
            <span className="text-xs font-semibold text-slate-400">
              {language === 'hi' ? 'कोई छवि संलग्न नहीं' : 'No photo attached'}
            </span>
            <span className="text-[11px] text-slate-500">
              {language === 'hi'
                ? 'नागरिक विवरण और श्रेणी के आधार पर विश्लेषण किया गया'
                : 'Analyzed based on reported description and category'}
            </span>
          </div>
        )}

        {/* Right Column: Title, Priority, Rationale & Executive Summary */}
        <div className={`space-y-4 ${imagePreviewUrl ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  {report.category}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {report.issue_title}
              </h2>
            </div>

            {/* Severity Indicator Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ring-1 font-bold text-xs flex-shrink-0 self-start shadow-md ${priorityStyle.bg}`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${priorityStyle.dot}`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${priorityStyle.badgeBg}`}
                />
              </span>
              <span>{priorityStyle.label}</span>
            </div>
          </div>

          {/* Executive Summary */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
            {report.summary}
          </p>

          {/* Priority Reasoning Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-slate-200">
                {language === 'hi' ? 'प्राथमिकता का औचित्य: ' : 'Priority Rationale: '}
              </span>
              <span>{report.priority_reasoning}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Observable Evidence & Public Hazards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Observable Evidence Card */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {t.evidenceTitle}
            </h4>
          </div>
          <ul className="space-y-2">
            {report.visible_evidence.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Potential Public Impact Card */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {t.impactTitle}
            </h4>
          </div>
          <ul className="space-y-2">
            {report.potential_impact.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Grid: Responsible Department & Recommended Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Responsible Department */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-200">
            <Building className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {t.deptTitle}
            </h4>
          </div>
          <div className="text-sm font-bold text-white">
            {report.responsible_department}
          </div>
          <div className="text-xs text-slate-400">
            {language === 'hi'
              ? 'अनुशंसित निवारण पोर्टल: '
              : 'Recommended Grievance Portal: '}
            <span className="text-cyan-400 font-semibold">
              {report.complaint_draft.recommended_portal || 'CPGRAMS / Local Municipal Corporation'}
            </span>
          </div>
        </div>

        {/* Citizen Next Action Steps */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {t.nextStepsTitle}
            </h4>
          </div>
          <ul className="space-y-1.5">
            {report.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Suggestion Advisory Banner */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5 text-[11px] text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
        <span>
          {language === 'hi'
            ? 'नोट: सभी निष्कर्ष स्थानीय एआई (Gemma) द्वारा उत्पन्न प्राथमिक सुझाव हैं, आधिकारिक नगर निगम सत्यापन नहीं।'
            : 'Notice: All AI findings are preliminary suggestions to assist citizens, not verified facts or official determinations.'}
        </span>
      </div>

      {/* Modal Zoom View for Image Evidence */}
      {isZoomed && imagePreviewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imagePreviewUrl}
              alt="Zoomed civic evidence"
              className="max-h-[80vh] w-auto rounded-xl border border-slate-700 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-slate-300 mt-3 font-medium">
              {report.issue_title} ({report.category})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
