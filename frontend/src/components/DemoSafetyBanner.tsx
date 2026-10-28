import React from 'react';
import { ShieldAlert, UserCheck, Shield, RotateCcw, LogOut, ArrowRightLeft } from 'lucide-react';
import { DemoUser } from '../types/demo';

interface DemoSafetyBannerProps {
  currentUser: DemoUser | null;
  onSwitchRole: () => void;
  onLogout: () => void;
  onResetData: () => void;
}

export const DemoSafetyBanner: React.FC<DemoSafetyBannerProps> = ({
  currentUser,
  onSwitchRole,
  onLogout,
  onResetData,
}) => {
  const isOfficerOrAdmin = currentUser?.role === 'officer' || currentUser?.role === 'admin';

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30 text-amber-200 text-xs py-2 px-4 shadow-md backdrop-blur">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Safety Notice */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider text-[10px] border border-amber-500/40">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Demo Mode Active
          </span>
          <span className="text-amber-100 font-medium text-[11px] sm:text-xs">
            Simulated Environment — Complaints & updates are simulated and are not sent to any government authority.
          </span>
        </div>

        {/* Persona Display & Controls */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px]">
              {isOfficerOrAdmin ? (
                <Shield className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="text-slate-400 hidden sm:inline">Role:</span>
              <span className="font-semibold text-white">
                {currentUser.role === 'officer'
                  ? 'Department Officer'
                  : currentUser.role === 'admin'
                  ? 'Municipal Admin'
                  : 'Citizen'}
              </span>
              <span className="text-slate-400 hidden md:inline">({currentUser.display_name})</span>
            </div>

            <button
              onClick={onSwitchRole}
              className="px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              title="Switch between Citizen and Department Officer roles"
            >
              <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Switch Role</span>
            </button>

            <button
              onClick={onLogout}
              className="px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer text-[11px] bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60"
              title="Sign out of current demo session"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1 text-slate-400 hover:text-amber-300 transition rounded hover:bg-slate-800"
              title="Reset demo complaints to seed state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
