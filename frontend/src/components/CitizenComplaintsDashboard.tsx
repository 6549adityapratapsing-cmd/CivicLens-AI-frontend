import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Clock,
  AlertCircle,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Send,
  User,
  Shield,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { DemoComplaint, DemoStatus } from '../types/demo';
import { fetchDemoComplaints, postCitizenReply } from '../utils/demoApi';

interface CitizenComplaintsDashboardProps {
  onNewComplaintClick: () => void;
  onTrackReference?: (ref: string) => void;
}

export const CitizenComplaintsDashboard: React.FC<CitizenComplaintsDashboardProps> = ({
  onNewComplaintClick,
  onTrackReference: _onTrackReference,
}) => {
  const [complaints, setComplaints] = useState<DemoComplaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<DemoComplaint | null>(null);

  // Citizen reply form state
  const [replyText, setReplyText] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDemoComplaints();
      setComplaints(data);
      setSelectedComplaint((prev) => {
        if (!prev) return null;
        return data.find((c) => c.id === prev.id) || prev;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load your complaints');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyText.trim()) return;

    setIsReplying(true);
    setReplySuccess(null);
    setReplyError(null);
    try {
      const updated = await postCitizenReply(selectedComplaint.id, replyText.trim());
      setSelectedComplaint(updated);
      setComplaints((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setReplyText('');
      setReplySuccess('Your reply was recorded and sent to the department officer (Simulated).');
      setTimeout(() => setReplySuccess(null), 4000);
    } catch (err: any) {
      setReplyError(err.message || 'Failed to post reply. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadge = (status: DemoStatus) => {
    switch (status) {
      case 'Submitted (Demo)':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Submitted (Demo)
          </span>
        );
      case 'Under Review (Demo)':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Under Review (Demo)
          </span>
        );
      case 'Action Planned (Demo)':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Action Planned (Demo)
          </span>
        );
      case 'Resolved (Demo)':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Resolved (Demo)
          </span>
        );
      case 'Rejected (Demo)':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Rejected (Demo)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">
                Citizen Portal
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Private Vault
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              My Submitted Civic Complaints
            </h2>
            <p className="text-xs text-slate-400">
              Track status history, read officer replies, and supply additional information.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadComplaints}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Refresh complaint records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onNewComplaintClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 transition shadow-lg shadow-cyan-600/25 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: List of Complaints & Detail Modal/Drawer */}
      {isLoading && complaints.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/60 rounded-3xl border border-slate-800">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading your demo complaints...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-4 bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">
              No Civic Complaints Yet
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              You haven't submitted any complaints under this citizen account yet. Use the AI complaint generator to report a pothole, waste dump, or streetlight issue.
            </p>
          </div>
          <button
            onClick={onNewComplaintClick}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 transition shadow-lg shadow-cyan-600/25 cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Report a Civic Issue Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complaints.map((c) => {
            const isSelected = selectedComplaint?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-teal-300">
                      {c.reference_number}
                    </span>
                    {getStatusBadge(c.status)}
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                    {c.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {c.category}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                        c.priority === 'Critical'
                          ? 'bg-rose-950 text-rose-300'
                          : c.priority === 'High'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-teal-950 text-teal-300'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.department_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {new Date(c.updated_at || c.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>View Timeline ({c.status_history?.length || 1})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Complaint Detail & Chronological Timeline Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl text-left space-y-6 max-h-[90vh] overflow-y-auto my-auto animate-fadeIn">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-teal-300">
                    {selectedComplaint.reference_number}
                  </span>
                  {getStatusBadge(selectedComplaint.status)}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedComplaint.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {selectedComplaint.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>

            {/* Simulated SLA & Expected Completion Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400">Assigned Department (Demo):</span>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedComplaint.department_name}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400">Expected Resolution:</span>
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {selectedComplaint.expected_completion_date
                      ? `${selectedComplaint.expected_completion_date} (Target SLA)`
                      : `Within ~${selectedComplaint.receipt?.expected_sla_hours || 48} hours (Standard SLA)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Complaint Summary & Location */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Location / Landmark:
                </span>
                <p className="text-slate-200 font-medium mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>{selectedComplaint.location}</span>
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Complaint Details:
                </span>
                <div className="mt-1 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {selectedComplaint.complaint_body}
                </div>
              </div>

              {selectedComplaint.visible_evidence?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Visible Evidence Noted:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedComplaint.visible_evidence.map((ev, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]"
                      >
                        • {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chronological Timeline */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Chronological Status & Officer Update Timeline</span>
                </h4>
                <span className="text-[10px] text-teal-400 font-semibold">
                  {selectedComplaint.status_history?.length || 1} Event(s)
                </span>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {selectedComplaint.status_history?.map((rec, idx) => {
                  const isOfficer = rec.role === 'officer' || rec.updated_by.toLowerCase().includes('officer') || rec.updated_by.toLowerCase().includes('engineer');
                  const isCitizen = rec.role === 'citizen';

                  return (
                    <div key={idx} className="relative flex items-start gap-3 pl-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${
                          isOfficer
                            ? 'bg-purple-900 border border-purple-500 text-purple-300'
                            : isCitizen
                            ? 'bg-cyan-900 border border-cyan-500 text-cyan-300'
                            : 'bg-slate-800 border border-slate-700 text-slate-300'
                        }`}
                      >
                        {isOfficer ? (
                          <Shield className="w-3 h-3" />
                        ) : isCitizen ? (
                          <User className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                      </div>

                      <div className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">
                              {rec.updated_by}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                isOfficer
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : isCitizen
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isOfficer ? 'Officer Update (Demo)' : isCitizen ? 'Citizen Note' : 'System'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(rec.timestamp).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        {/* Status Change Tag if present */}
                        {rec.status && (
                          <div className="inline-block text-[11px] font-semibold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                            Status: {rec.status}
                          </div>
                        )}

                        <p className="text-slate-300 leading-relaxed">{rec.note}</p>

                        {/* Detailed structured officer fields */}
                        {(rec.work_done ||
                          rec.work_planned ||
                          rec.inspection_findings ||
                          rec.next_steps) && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg">
                            {rec.work_done && (
                              <div>
                                <span className="font-semibold text-purple-300">Work Done: </span>
                                <span>{rec.work_done}</span>
                              </div>
                            )}
                            {rec.inspection_findings && (
                              <div>
                                <span className="font-semibold text-amber-300">Inspection Findings: </span>
                                <span>{rec.inspection_findings}</span>
                              </div>
                            )}
                            {rec.work_planned && (
                              <div>
                                <span className="font-semibold text-cyan-300">Planned Work: </span>
                                <span>{rec.work_planned}</span>
                              </div>
                            )}
                            {rec.next_steps && (
                              <div>
                                <span className="font-semibold text-teal-300">Next Steps: </span>
                                <span>{rec.next_steps}</span>
                              </div>
                            )}
                            {rec.expected_completion_date && (
                              <div>
                                <span className="font-semibold text-amber-400">Target Resolution: </span>
                                <span>{rec.expected_completion_date}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Citizen Reply / Additional Information Form */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Reply or Provide Additional Information
                </h4>
              </div>

              {replySuccess && (
                <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-800 text-teal-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span>{replySuccess}</span>
                </div>
              )}

              {replyError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{replyError}</span>
                </div>
              )}

              <form onSubmit={handleSendReply} className="space-y-2.5">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="e.g., The contractor arrived this afternoon and set up warning cones. The pothole is still leaking water..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Updates will be visibly marked as simulated citizen notes.
                  </span>
                  <button
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
                  >
                    {isReplying ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Update (Demo)</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
