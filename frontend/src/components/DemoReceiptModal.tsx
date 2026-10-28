import React, { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldAlert,
  Building,
  Calendar,
  Clock,
  X,
} from 'lucide-react';
import { DemoComplaint } from '../types/demo';

interface DemoReceiptModalProps {
  complaint: DemoComplaint;
  onClose: () => void;
  onTrack: (refNumber: string) => void;
}

export const DemoReceiptModal: React.FC<DemoReceiptModalProps> = ({
  complaint,
  onClose,
  onTrack,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(complaint.reference_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceipt = () => {
    const textContent = `================================================================================
CIVICLENS AI — SIMULATED GRIEVANCE SUBMISSION RECEIPT
DEMO MODE ONLY — NOT SENT TO REAL GOVERNMENT AUTHORITIES
================================================================================

Simulated Receipt ID : ${complaint.receipt.receipt_id}
Demo Reference Number: ${complaint.reference_number}
Submission Timestamp : ${complaint.created_at}
Simulated Status     : ${complaint.status}

CITIZEN DETAILS
Name                 : ${complaint.citizen_name}
Contact              : ${complaint.citizen_contact || 'N/A'}
Reported Location    : ${complaint.location}

ASSIGNED DEMO DEPARTMENT
Department Name      : ${complaint.department_name}
Expected Demo SLA    : ${complaint.receipt.expected_sla_hours} Hours

CIVIC ISSUE SUMMARY
Category             : ${complaint.category}
Title                : ${complaint.title}
Urgency / Priority   : ${complaint.priority}
Summary              : ${complaint.summary}

FORMAL COMPLAINT TEXT
--------------------------------------------------------------------------------
${complaint.complaint_body}
--------------------------------------------------------------------------------

MANDATORY DEMO DISCLAIMER:
${complaint.receipt.disclaimer}
All departments, routing rules, and ticket statuses exist strictly within this
educational demonstration software.
================================================================================
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${complaint.reference_number}_simulated_receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-teal-500/30 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Top Watermark Badge */}
        <div className="absolute top-0 right-0 bg-amber-500/20 border-b border-l border-amber-500/40 text-amber-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          SIMULATED SUBMISSION
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mt-3 mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-3 shadow-inner">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Simulated Grievance Filed</h3>
          <p className="text-xs text-amber-200/90 mt-1 max-w-sm mx-auto font-medium">
            This complaint exists only in the CivicLens AI demo. It has not been sent to any real government authority.
          </p>
        </div>

        {/* Reference Number Callout */}
        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Demo Tracking Reference #
            </div>
            <div className="text-base font-mono font-bold text-teal-300">
              {complaint.reference_number}
            </div>
          </div>
          <button
            onClick={handleCopyRef}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Meta Details */}
        <div className="space-y-2 text-xs bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 mb-5 text-slate-300">
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
            <span className="text-slate-400">Demo Department:</span>
            <span className="font-semibold text-slate-200">{complaint.department_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-400">Logged At:</span>
            <span className="text-slate-200">{new Date(complaint.created_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-slate-400">Simulated SLA:</span>
            <span className="text-slate-200">{complaint.receipt.expected_sla_hours} Hours Target</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => onTrack(complaint.reference_number)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-teal-500/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Track Simulated Progress</span>
          </button>

          <button
            onClick={handleDownloadReceipt}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs border border-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
