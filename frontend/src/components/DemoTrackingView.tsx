import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  MapPin,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { DemoComplaint, DemoStatus } from '../types/demo';
import { fetchDemoComplaintDetail } from '../utils/demoApi';

interface DemoTrackingViewProps {
  initialRef?: string | null;
  onSelectComplaint?: (c: DemoComplaint) => void;
}

const STATUS_STEPS: DemoStatus[] = [
  'Submitted (Demo)',
  'Under Review (Demo)',
  'Action Planned (Demo)',
  'Resolved (Demo)',
];

export const DemoTrackingView: React.FC<DemoTrackingViewProps> = ({ initialRef }) => {
  const [searchQuery, setSearchQuery] = useState(initialRef || '');
  const [complaint, setComplaint] = useState<DemoComplaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (refToSearch?: string) => {
    const query = (refToSearch || searchQuery).trim();
    if (!query) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDemoComplaintDetail(query);
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || 'Demo complaint not found');
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (initialRef) {
      setSearchQuery(initialRef);
      handleSearch(initialRef);
    }
  }, [initialRef, handleSearch]);

  const getStepIndex = (status: DemoStatus) => {
    if (status === 'Rejected (Demo)') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  const currentStep = complaint ? getStepIndex(complaint.status) : -1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Search Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider text-[10px] border border-amber-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Simulated Tracker
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100">
            Track Civic Grievance Progress
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Enter any demo tracking reference number (e.g., <code className="text-teal-300 font-mono font-bold">DEMO-2026-000001</code>) to inspect live status updates and inspection logs.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter reference number (e.g. DEMO-2026-000001)..."
              className="w-full text-xs py-3 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Quick demo examples:</span>
          {['DEMO-2026-000001', 'DEMO-2026-000002', 'DEMO-2026-000003'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setSearchQuery(sample);
                handleSearch(sample);
              }}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaint Detail Card */}
      {complaint && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Header & Badges */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-sm font-bold text-teal-300">
                  {complaint.reference_number}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {complaint.category}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    complaint.priority === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : complaint.priority === 'High'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}
                >
                  {complaint.priority} Priority
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{complaint.title}</h3>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Simulated Status
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  complaint.status === 'Resolved (Demo)'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : complaint.status === 'Rejected (Demo)'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : complaint.status === 'Action Planned (Demo)'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : complaint.status === 'Under Review (Demo)'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {complaint.status}
              </span>
            </div>
          </div>

          {/* 4-Stage Visual Status Progression Timeline */}
          {complaint.status !== 'Rejected (Demo)' ? (
            <div className="py-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-4">
                Redressal Workflow Stage (Simulated)
              </div>
              <div className="grid grid-cols-4 gap-2">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition ${
                          isDone
                            ? 'bg-teal-500 text-slate-950 ring-4 ring-teal-500/20'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[11px] font-semibold leading-tight ${
                          isCurrent
                            ? 'text-teal-300'
                            : isDone
                            ? 'text-slate-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.replace(' (Demo)', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>
                This complaint was marked as <strong>Rejected (Demo)</strong>. See municipal notes below for justification.
              </span>
            </div>
          )}

          {/* Department, Location & Expected Resolution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <Building className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Assigned Demo Department
                </div>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {complaint.department_name}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Location Landmark
                </div>
                <div className="text-slate-200 font-semibold mt-0.5">
                  {complaint.location}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Target Resolution Date
                </div>
                <div className="text-amber-300 font-semibold mt-0.5">
                  {complaint.expected_completion_date || `~${complaint.receipt?.expected_sla_hours || 48} Hours (Standard SLA)`}
                </div>
              </div>
            </div>
          </div>

          {/* Status History Audit Log & Officer Notes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Simulated Status History & Officer Updates
            </h4>
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {complaint.status_history.map((hist, idx) => {
                const isOfficer = hist.role === 'officer' || hist.updated_by.toLowerCase().includes('officer') || hist.updated_by.toLowerCase().includes('engineer');
                const isCitizen = hist.role === 'citizen';

                return (
                  <div key={idx} className="relative pl-7 text-xs space-y-1">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-slate-900 ring-2 ring-teal-500/20" />
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-slate-200">{hist.status}</span>
                      <span className="text-[10px] text-slate-400">
                        • {new Date(hist.timestamp).toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isOfficer
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : isCitizen
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        By: {hist.updated_by}
                      </span>
                    </div>

                    <div className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      {hist.note}

                      {(hist.work_done || hist.work_planned || hist.inspection_findings || hist.next_steps) && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                          {hist.work_done && <div><span className="text-purple-300 font-semibold">Work Done:</span> {hist.work_done}</div>}
                          {hist.inspection_findings && <div><span className="text-amber-300 font-semibold">Inspection Findings:</span> {hist.inspection_findings}</div>}
                          {hist.work_planned && <div><span className="text-cyan-300 font-semibold">Planned Work:</span> {hist.work_planned}</div>}
                          {hist.next_steps && <div><span className="text-teal-300 font-semibold">Next Steps:</span> {hist.next_steps}</div>}
                          {hist.expected_completion_date && <div><span className="text-amber-400 font-semibold">Expected Completion:</span> {hist.expected_completion_date}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
