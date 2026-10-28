import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Printer,
  BookmarkPlus,
  Edit3,
  Send,
} from 'lucide-react';
import { CivicAnalysisResponse, LanguageCode } from '../types';
import { UI_TEXT } from '../utils/translations';

interface ComplaintDraftEditorProps {
  report: CivicAnalysisResponse;
  language: LanguageCode;
  onSaveToHistory: (customBody: string, citizenName: string, location: string) => void;
  onSubmitDemo?: (complaintData: {
    customBody: string;
    citizenName: string;
    citizenContact: string;
    location: string;
  }) => void;
  isSubmittingDemo?: boolean;
}

export const ComplaintDraftEditor: React.FC<ComplaintDraftEditorProps> = ({
  report,
  language,
  onSaveToHistory,
  onSubmitDemo,
  isSubmittingDemo,
}) => {
  const t = UI_TEXT[language];

  // Citizen personal detail inputs
  const [citizenName, setCitizenName] = useState('');
  const [citizenContact, setCitizenContact] = useState('');
  const [citizenLocation, setCitizenLocation] = useState('');

  // Editable draft body
  const [draftBody, setDraftBody] = useState(report.complaint_draft.body);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Helper to replace placeholders dynamically
  const getProcessedDraft = () => {
    let text = draftBody;
    if (citizenName.trim()) {
      text = text.replace(/\[Citizen Name\]/gi, citizenName.trim());
      text = text.replace(/\[आपका नाम\]/gi, citizenName.trim());
    }
    if (citizenContact.trim()) {
      text = text.replace(/\[Contact Number\]/gi, citizenContact.trim());
      text = text.replace(/\[Phone \/ Email\]/gi, citizenContact.trim());
      text = text.replace(/\[सम्पर्क नंबर\]/gi, citizenContact.trim());
    }
    if (citizenLocation.trim()) {
      text = text.replace(/\[Exact Location \/ Landmark\]/gi, citizenLocation.trim());
      text = text.replace(/\[Location\]/gi, citizenLocation.trim());
      text = text.replace(/\[स्थान \/ लैंडमार्क\]/gi, citizenLocation.trim());
    }
    return text;
  };

  const handleCopy = () => {
    const fullText = `TO: ${report.complaint_draft.to_authority}\nSUBJECT: ${report.complaint_draft.subject}\n\n${getProcessedDraft()}\n\n[Generated via CivicLens AI]`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const fullText = `======================================================
CIVICLENS AI - FORMAL CIVIC GRIEVANCE REPORT
Report ID: ${report.analysis_id}
Date: ${new Date(report.timestamp).toLocaleString()}
Category: ${report.category}
Suggested Priority: ${report.suggested_priority}
Responsible Dept: ${report.responsible_department}
======================================================

EXECUTIVE SUMMARY:
${report.summary}

VISIBLE EVIDENCE DETECTED:
${report.visible_evidence.map((e) => `• ${e}`).join('\n')}

POTENTIAL PUBLIC HAZARDS:
${report.potential_impact.map((e) => `• ${e}`).join('\n')}

RECOMMENDED CITIZEN ACTIONS:
${report.next_steps.map((e) => `• ${e}`).join('\n')}

======================================================
FORMAL COMPLAINT LETTER DRAFT:
======================================================
TO:
${report.complaint_draft.to_authority}

SUBJECT:
${report.complaint_draft.subject}

${getProcessedDraft()}

DISCLAIMER:
${report.disclaimer}
`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CivicLens_Complaint_${report.analysis_id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    onSaveToHistory(getProcessedDraft(), citizenName, citizenLocation);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cyan-400" />
            <span>{t.complaintDraftTitle}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'hi'
              ? 'विवरण भरें, पत्र संपादित करें और संबंधित पोर्टल पर तुरंत भेजें।'
              : 'Fill your details below, customize the draft, and submit to municipal portals.'}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-cyan-600/90 hover:bg-cyan-500 text-white border-cyan-400/40 shadow-md shadow-cyan-600/20'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.letterCopied : t.copyLetter}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            title="Download formatted text report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t.downloadReport}</span>
            <span className="sm:hidden">.txt</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.printReport}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
              saved
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-purple-400" />
            <span>{saved ? t.savedToast : t.saveToHistory}</span>
          </button>
        </div>
      </div>

      {/* Citizen Details Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            {t.citizenNameLabel}
          </label>
          <input
            type="text"
            value={citizenName}
            onChange={(e) => setCitizenName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            {t.citizenContactLabel}
          </label>
          <input
            type="text"
            value={citizenContact}
            onChange={(e) => setCitizenContact(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">
            {t.locationLabel}
          </label>
          <input
            type="text"
            value={citizenLocation}
            onChange={(e) => setCitizenLocation(e.target.value)}
            placeholder="e.g. Main Market, Ward 14"
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Formal Complaint Letter Preview & Textarea */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div>
            <span className="font-semibold text-slate-400">TO: </span>
            <span className="text-white font-medium">
              {report.complaint_draft.to_authority}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-400">SUBJECT: </span>
            <span className="text-cyan-300 font-medium">
              {report.complaint_draft.subject}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1.5">
            {language === 'hi'
              ? 'शिकायत पत्र का मुख्य भाग (संपादन करें):'
              : 'Complaint Letter Body (Fully Editable):'}
          </label>
          <textarea
            rows={10}
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            className="w-full text-xs font-mono p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed shadow-inner"
          />
        </div>

        {/* Demo Complaint Submission Action */}
        {onSubmitDemo && (
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-teal-950/20 p-4 rounded-xl border border-teal-500/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Simulated Redressal Pipeline
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                  DEMO SUBMISSION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi'
                  ? 'यह शिकायत केवल CivicLens AI डेमो में दर्ज होगी। यह किसी वास्तविक सरकारी प्राधिकरण को नहीं भेजी जाएगी।'
                  : 'Submit this complaint into the CivicLens AI demonstration system to generate a simulated receipt and track grievance resolution.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onSubmitDemo({
                  customBody: getProcessedDraft(),
                  citizenName,
                  citizenContact,
                  location: citizenLocation,
                })
              }
              disabled={isSubmittingDemo}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 transition shadow-lg shadow-teal-500/20 flex items-center gap-2 flex-shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingDemo ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Submitting Demo...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Demo Complaint</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
