import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Building,
  Send,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import {
  DemoComplaint,
  DemoDepartment,
  DemoStats,
  DemoStatus,
  DemoUser,
} from '../types/demo';
import {
  fetchDemoComplaints,
  fetchDemoStats,
  fetchDemoDepartments,
  updateDemoDepartment,
  postOfficerProgressUpdate,
} from '../utils/demoApi';

interface DemoAdminDashboardProps {
  currentUser?: DemoUser | null;
  onSelectComplaint?: (c: DemoComplaint) => void;
}

const ALL_STATUSES: DemoStatus[] = [
  'Submitted (Demo)',
  'Under Review (Demo)',
  'Action Planned (Demo)',
  'Resolved (Demo)',
  'Rejected (Demo)',
];

export const DemoAdminDashboard: React.FC<DemoAdminDashboardProps> = ({
  currentUser,
}) => {
  const [complaints, setComplaints] = useState<DemoComplaint[]>([]);
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [departments, setDepartments] = useState<DemoDepartment[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<DemoComplaint | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>(currentUser?.department || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  // Structured Officer Update State
  const [targetStatus, setTargetStatus] = useState<DemoStatus>('Under Review (Demo)');
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [officerNote, setOfficerNote] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [workPlanned, setWorkPlanned] = useState('');
  const [inspectionFindings, setInspectionFindings] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cList, st, depts] = await Promise.all([
        fetchDemoComplaints(filterDept !== 'all' ? filterDept : undefined),
        fetchDemoStats(),
        fetchDemoDepartments(),
      ]);
      setComplaints(cList);
      setStats(st);
      setDepartments(depts);
      if (selectedComplaint) {
        const refreshed = cList.find((c) => c.id === selectedComplaint.id);
        if (refreshed) setSelectedComplaint(refreshed);
      }
    } catch (e: any) {
      console.error('Failed to load officer demo data', e);
    } finally {
      setIsLoading(false);
    }
  }, [filterDept, selectedComplaint]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenActionModal = (c: DemoComplaint) => {
    setSelectedComplaint(c);
    setTargetStatus(c.status);
    setTargetDeptId(c.department_id);
    setOfficerNote('');
    setWorkDone('');
    setWorkPlanned('');
    setInspectionFindings('');
    setNextSteps('');
    setExpectedDate(c.expected_completion_date || '');
    setActionSuccess(null);
    setActionError(null);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (!officerNote.trim()) {
      setActionError('Please provide an officer summary / progress note.');
      return;
    }

    setIsUpdating(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      let updated = selectedComplaint;

      // Reassign department if changed
      if (targetDeptId && targetDeptId !== selectedComplaint.department_id) {
        updated = await updateDemoDepartment(
          selectedComplaint.id,
          targetDeptId,
          officerNote || 'Department reassigned by Department Officer.'
        );
      }

      // Submit structured officer progress update
      updated = await postOfficerProgressUpdate(selectedComplaint.id, {
        newStatus: targetStatus,
        note: officerNote.trim(),
        work_done: workDone.trim() || undefined,
        work_planned: workPlanned.trim() || undefined,
        inspection_findings: inspectionFindings.trim() || undefined,
        next_steps: nextSteps.trim() || undefined,
        expected_completion_date: expectedDate || undefined,
      });

      setSelectedComplaint(updated);
      setComplaints((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setActionSuccess('Official progress update & simulated SLA recorded successfully.');
      setTimeout(() => setActionSuccess(null), 5000);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to record officer update.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      c.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.citizen_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Officer Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-purple-400 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                Department Officer Console
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50 font-bold uppercase">
                Authorized Role
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Municipal Grievance Command & Response Center
            </h2>
            <p className="text-xs text-slate-400">
              Logged in as <span className="text-purple-300 font-semibold">{currentUser?.display_name || 'Department Officer'}</span>
              {currentUser?.department_name && (
                <span> • {currentUser.department_name}</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Aggregate Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Managed
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
              {complaints.length}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Under Review (Demo)
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-1 font-mono">
              {complaints.filter((c) => c.status === 'Under Review (Demo)').length}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
              Action Planned (Demo)
            </div>
            <div className="text-2xl font-bold text-indigo-300 mt-1 font-mono">
              {complaints.filter((c) => c.status === 'Action Planned (Demo)').length}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Resolved (Demo)
            </div>
            <div className="text-2xl font-bold text-emerald-300 mt-1 font-mono">
              {complaints.filter((c) => c.status === 'Resolved (Demo)').length}
            </div>
          </div>
        </div>
      )}

      {/* Search & Multi-Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ref #, title, location, or citizen..."
            className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
          >
            <option value="all">All Municipal Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
          >
            <option value="all">All Demo Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ref #</th>
                <th className="py-3.5 px-4">Citizen & Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Target Resolution</th>
                <th className="py-3.5 px-4">Status (Demo)</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    No complaints matching your current department or status criteria.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-300">
                      {c.reference_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-100 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{c.citizen_name}</span>
                        <span>•</span>
                        <span>{c.category}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-[180px] truncate">
                      {c.department_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          c.priority === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : c.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {c.expected_completion_date ? (
                        <span className="text-amber-300 font-semibold">{c.expected_completion_date}</span>
                      ) : (
                        <span>~{c.receipt?.expected_sla_hours || 48}h SLA</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          c.status === 'Resolved (Demo)'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : c.status === 'Rejected (Demo)'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : c.status === 'Action Planned (Demo)'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : c.status === 'Under Review (Demo)'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenActionModal(c)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition text-xs font-semibold cursor-pointer shadow-sm"
                      >
                        Respond & Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officer Response & Progress Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 max-h-[90vh] overflow-y-auto my-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-teal-300">
                    {selectedComplaint.reference_number}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                    Officer Action Portal (Demo)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedComplaint.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  {selectedComplaint.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications */}
            {actionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Complaint Details Card */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Location:</span>
                  <div className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{selectedComplaint.location}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Reported By:</span>
                  <div className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{selectedComplaint.citizen_name}</span>
                    {selectedComplaint.citizen_contact && (
                      <span className="text-slate-500">({selectedComplaint.citizen_contact})</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Complaint Body:</span>
                <p className="text-slate-300 mt-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedComplaint.complaint_body}
                </p>
              </div>

              {selectedComplaint.visible_evidence?.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">AI Visible Evidence:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedComplaint.visible_evidence.map((ev, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        • {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Officer Response & Progress Update Form */}
            <form onSubmit={handleSaveAction} className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Post Officer Progress Update & Redressal Plan
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Update Simulated Status:
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as DemoStatus)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500 font-bold"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Completion Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Completion Date (Optional):
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Department Jurisdiction */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department Jurisdiction:
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Officer Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Progress Note / Citizen Reply (Required):
                </label>
                <textarea
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  required
                  placeholder="Explain current status, response to citizen messages, or resolution summary..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>

              {/* Structured Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    What has been done (Work Done):
                  </label>
                  <input
                    type="text"
                    value={workDone}
                    onChange={(e) => setWorkDone(e.target.value)}
                    placeholder="e.g., Junior engineer visited site; cones placed"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                    Inspection Findings:
                  </label>
                  <input
                    type="text"
                    value={inspectionFindings}
                    onChange={(e) => setInspectionFindings(e.target.value)}
                    placeholder="e.g., Road crater depth is 3.5 inches; drainage intact"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-cyan-300 mb-1">
                    What work is planned (Work Planned):
                  </label>
                  <input
                    type="text"
                    value={workPlanned}
                    onChange={(e) => setWorkPlanned(e.target.value)}
                    placeholder="e.g., Patching team scheduled with cold mix asphalt"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-teal-300 mb-1">
                    Next Steps:
                  </label>
                  <input
                    type="text"
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    placeholder="e.g., Compacting on Thursday; final sign-off inspection"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-600/25 cursor-pointer"
                >
                  {isUpdating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Post Official Update (Demo)</span>
                </button>
              </div>
            </form>

            {/* Chronological Audit Trail & Citizen Replies */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Chronological Timeline & Citizen Message History
                </span>
                <span className="text-[10px] text-purple-400 font-semibold">
                  {selectedComplaint.status_history?.length || 1} Record(s)
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedComplaint.status_history?.map((hist, idx) => {
                  const isOfficer = hist.role === 'officer' || hist.updated_by.toLowerCase().includes('officer') || hist.updated_by.toLowerCase().includes('engineer');
                  const isCitizen = hist.role === 'citizen';

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        isCitizen
                          ? 'bg-cyan-950/30 border-cyan-800/50'
                          : isOfficer
                          ? 'bg-purple-950/30 border-purple-800/50'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center text-slate-300 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{hist.updated_by}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isCitizen
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : isOfficer
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isCitizen ? 'Citizen Message' : isOfficer ? 'Officer Update (Demo)' : 'System'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(hist.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {hist.status && (
                        <div className="text-[11px] font-semibold text-teal-400">
                          Status: {hist.status}
                        </div>
                      )}

                      <div className="text-slate-300">{hist.note}</div>

                      {(hist.work_done || hist.work_planned || hist.inspection_findings || hist.next_steps) && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg">
                          {hist.work_done && <div><span className="text-purple-300 font-medium">Work Done:</span> {hist.work_done}</div>}
                          {hist.inspection_findings && <div><span className="text-amber-300 font-medium">Findings:</span> {hist.inspection_findings}</div>}
                          {hist.work_planned && <div><span className="text-cyan-300 font-medium">Planned:</span> {hist.work_planned}</div>}
                          {hist.next_steps && <div><span className="text-teal-300 font-medium">Next Steps:</span> {hist.next_steps}</div>}
                          {hist.expected_completion_date && <div><span className="text-amber-400 font-medium">Target:</span> {hist.expected_completion_date}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
