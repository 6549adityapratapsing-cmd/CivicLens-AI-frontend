import React, { useState } from 'react';
import { Building2, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { DemoDepartment, DepartmentMatchResult } from '../types/demo';

interface DepartmentMatchSelectorProps {
  matchResult: DepartmentMatchResult | null;
  departments: DemoDepartment[];
  selectedDepartmentId: string;
  onSelectDepartment: (deptId: string) => void;
}

export const DepartmentMatchSelector: React.FC<DepartmentMatchSelectorProps> = ({
  matchResult,
  departments,
  selectedDepartmentId,
  onSelectDepartment,
}) => {
  const [isChanging, setIsChanging] = useState(false);

  const currentDept = departments.find((d) => d.id === selectedDepartmentId) || departments[0];

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-sm text-left">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
              Demo Department Routing
            </div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              {currentDept?.name || 'Demo Municipal Department'}
              {matchResult && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-medium border border-teal-500/30">
                  {Math.round(matchResult.confidence_score * 100)}% Match
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsChanging(!isChanging)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700"
        >
          <span>{isChanging ? 'Done' : 'Change'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isChanging ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Ambiguity Alert Prompt if confirmation needed */}
      {matchResult?.requires_confirmation && (
        <div className="mb-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Confirmation Recommended: </span>
            <span>{matchResult.explanation}</span>
          </div>
        </div>
      )}

      {/* Explanation when match is decisive */}
      {!matchResult?.requires_confirmation && matchResult?.explanation && (
        <div className="text-xs text-slate-400 mb-2.5 flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
          <span>{matchResult.explanation}</span>
        </div>
      )}

      {/* Dropdown if changing */}
      {isChanging && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Select Demonstration Municipal Authority:
          </label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => onSelectDepartment(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} — ({dept.sample_service_area})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500 mt-1 italic">
            Routing rule: {currentDept?.routing_rules}
          </div>
        </div>
      )}
    </div>
  );
};
