import React, { useState } from 'react';
import {
  Users,
  Shield,
  ArrowRight,
  ShieldAlert,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  KeyRound,
} from 'lucide-react';
import { DemoUser } from '../types/demo';
import { loginDemoUser } from '../utils/demoApi';

interface TwoRoleLoginLandingProps {
  onLoginSuccess: (user: DemoUser, token: string) => void;
  language?: 'en' | 'hi';
}

export const TwoRoleLoginLanding: React.FC<TwoRoleLoginLandingProps> = ({
  onLoginSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'officer' | null>(null);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenLogin = (role: 'citizen' | 'officer') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'citizen') {
      setUsername('citizen');
      setPassword('demo123');
    } else {
      setUsername('officer');
      setPassword('officer123');
    }
  };

  const handleQuickFill = (role: 'citizen' | 'officer') => {
    if (role === 'citizen') {
      setUsername('citizen');
      setPassword('demo123');
    } else {
      setUsername('officer');
      setPassword('officer123');
    }
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both demo username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginDemoUser(username.trim(), password.trim());
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Login failed. Please verify the demo credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 max-w-5xl mx-auto w-full">
      {/* Prominent Mandatory Safety Demo Notice */}
      <div className="w-full mb-8 p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 shadow-xl backdrop-blur text-left">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Simulated Sandbox
              </span>
              <span className="text-xs font-bold text-amber-200">
                Notice & Safety Barrier
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-amber-100/90 leading-relaxed">
              Demo environment only. Complaints and department updates are simulated and are not sent to any government authority.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              No real municipal portals, government SMS, emails, or webhooks are connected.
            </p>
          </div>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3 shadow-inner">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Role-Based Municipal Access</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          CivicLens AI Gateway
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Select your portal role to access dedicated citizen tools or department grievance management consoles.
        </p>
      </div>

      {/* Two Prominent Login Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* CARD A: CITIZEN LOGIN */}
        <div
          onClick={() => handleOpenLogin('citizen')}
          className={`relative group rounded-3xl p-7 border transition-all duration-300 text-left cursor-pointer flex flex-col justify-between ${
            selectedRole === 'citizen'
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-500 shadow-2xl shadow-cyan-500/20 ring-2 ring-cyan-500/30'
              : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/50 shadow-xl hover:shadow-cyan-500/10'
          }`}
        >
          {/* Top highlight pill */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-105 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
              Role A
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              CITIZEN LOGIN
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
              Report a Civic Issue
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload civic hazard photos, generate AI-validated municipal complaint drafts, track simulated resolution progress, and exchange direct replies with department officers.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulated Reference Number & Receipt</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Strict Ownership: View Only Your Complaints</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reply to Officer Progress Updates</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenLogin('citizen');
              }}
              className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 transition shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue as Citizen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CARD B: DEPARTMENT OFFICER LOGIN */}
        <div
          onClick={() => handleOpenLogin('officer')}
          className={`relative group rounded-3xl p-7 border transition-all duration-300 text-left cursor-pointer flex flex-col justify-between ${
            selectedRole === 'officer'
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500 shadow-2xl shadow-purple-500/20 ring-2 ring-purple-500/30'
              : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-purple-500/50 shadow-xl hover:shadow-purple-500/10'
          }`}
        >
          {/* Top highlight pill */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-105 transition-transform">
              <Shield className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/50">
              Role B
            </span>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-xs font-bold tracking-wider uppercase text-purple-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              DEPARTMENT OFFICER LOGIN
            </div>
            <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              Manage and Respond to Complaints
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review assigned department complaints, post structured progress notes with inspection findings, set expected completion timelines, and update resolution statuses.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Department Triage & Permitted Queue</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Inspection Findings, Work Planned & SLA</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Status Governance & Citizen Communication</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenLogin('officer');
              }}
              className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue as Department Officer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Modal / Form for Selected Role */}
      {selectedRole && (
        <div className="mt-8 w-full max-w-xl animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedRole === 'citizen'
                      ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                      : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                  }`}
                >
                  {selectedRole === 'citizen' ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedRole === 'citizen'
                      ? 'Citizen Demo Authentication'
                      : 'Department Officer Demo Authentication'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedRole === 'citizen'
                      ? 'Access citizen grievance filing and tracking'
                      : 'Access department complaint management console'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>

            {/* Quick Demo Credentials Helper */}
            <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="text-slate-300">
                <span className="text-slate-400">Demo Account: </span>
                <code className="text-cyan-300 font-mono font-bold">
                  {selectedRole === 'citizen' ? 'citizen' : 'officer'}
                </code>
                <span className="text-slate-400"> / </span>
                <code className="text-teal-300 font-mono">
                  {selectedRole === 'citizen' ? 'demo123' : 'officer123'}
                </code>
              </div>
              <button
                type="button"
                onClick={() => handleQuickFill(selectedRole)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
              >
                Auto-fill
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Demo Username
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="e.g. citizen or officer"
                    className="w-full text-xs py-2.5 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Demo Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter demo password"
                    className="w-full text-xs py-2.5 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    selectedRole === 'citizen'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-600/25'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to {selectedRole === 'citizen' ? 'Citizen Portal' : 'Officer Console'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
