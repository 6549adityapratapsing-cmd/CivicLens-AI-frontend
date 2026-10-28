import React from 'react';
import {
  ShieldAlert,
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LogOut,
  Shield,
  FileText,
} from 'lucide-react';
import { LanguageCode, AIHealthResponse } from '../types';
import { DemoUser } from '../types/demo';
import { UI_TEXT } from '../utils/translations';

export type ActiveTab = 'report' | 'complaints' | 'track' | 'admin' | 'history' | 'chat' | 'guide';

interface HeaderProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  aiHealth: AIHealthResponse | null;
  historyCount?: number;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  currentUser?: DemoUser | null;
  onLogout?: () => void;
  onSwitchRole?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  aiHealth,
  historyCount: _historyCount,
  selectedModel,
  onModelChange,
  currentUser,
  onLogout,
  onSwitchRole: _onSwitchRole,
}) => {
  const t = UI_TEXT[language];
  const isOfficerOrAdmin = currentUser?.role === 'officer' || currentUser?.role === 'admin';

  const getStatusBadge = () => {
    if (!aiHealth) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-800/80 rounded-full border border-slate-700">
          <Server className="w-3.5 h-3.5 animate-pulse text-slate-400" />
          <span>Connecting...</span>
        </span>
      );
    }

    if (aiHealth.status === 'healthy') {
      return (
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/60 rounded-full border border-emerald-800/60"
          title={`Provider: ${aiHealth.provider.toUpperCase()} (${aiHealth.model})`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">AI:</span>
          <span className="uppercase font-mono text-[11px]">{aiHealth.provider}</span>
        </span>
      );
    }

    if (aiHealth.status === 'degraded') {
      return (
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/60 rounded-full border border-amber-800/60"
          title={aiHealth.details}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Setup:</span>
          <span className="uppercase font-mono text-[11px]">{aiHealth.provider}</span>
        </span>
      );
    }

    return (
      <span
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-950/60 rounded-full border border-rose-800/60"
        title={aiHealth.details}
      >
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>Offline</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 shadow-lg shadow-cyan-500/20 text-white">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  CivicLens AI
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                  Demo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block">
                {language === 'hi'
                  ? 'नागरिक समस्या पहचान एवं स्वचालित शिकायत प्रारूप'
                  : 'AI Civic Issue Detection & Municipal Redressal'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs based on Role */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
              {/* Citizen specific tabs */}
              {!isOfficerOrAdmin && (
                <>
                  <button
                    onClick={() => onTabChange('report')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      activeTab === 'report'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.tabReport}
                  </button>
                  <button
                    onClick={() => onTabChange('complaints')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'complaints'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>My Complaints</span>
                  </button>
                </>
              )}

              {/* Officer / Admin specific tabs */}
              {isOfficerOrAdmin && (
                <button
                  onClick={() => onTabChange('admin')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Officer Console</span>
                </button>
              )}

              {/* Shared utility tabs */}
              <button
                onClick={() => onTabChange('track')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.tabTrack}
              </button>

              <button
                onClick={() => onTabChange('chat')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.tabChat}
              </button>

              <button
                onClick={() => onTabChange('guide')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.tabGuide}
              </button>
            </nav>
          )}

          {/* Right Controls: AI Status, Model Selector, Language & User / Logout */}
          <div className="flex items-center gap-2">
            {getStatusBadge()}

            {/* Model Selector (configurable) */}
            {onModelChange && (
              <div className="hidden xl:flex items-center">
                <select
                  value={selectedModel || aiHealth?.model || 'gemma3:1b'}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
                  title="Configure active AI model"
                >
                  <option value="gemma3:1b">gemma3:1b (Default)</option>
                  {aiHealth?.available_models
                    ?.filter((m) => m !== 'gemma3:1b' && m !== 'gemma3')
                    .map((m) => (
                      <option key={m} value={m}>
                        {m} (Installed)
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Header User Badge & Log Out */}
            {currentUser && onLogout && (
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition cursor-pointer"
                title="Log out of demo session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {currentUser && (
          <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto gap-1">
            {!isOfficerOrAdmin && (
              <>
                <button
                  onClick={() => onTabChange('report')}
                  className={`text-xs py-1 px-1.5 font-medium whitespace-nowrap ${
                    activeTab === 'report' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
                  }`}
                >
                  {t.tabReport}
                </button>
                <button
                  onClick={() => onTabChange('complaints')}
                  className={`text-xs py-1 px-1.5 font-medium whitespace-nowrap ${
                    activeTab === 'complaints' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'
                  }`}
                >
                  My Complaints
                </button>
              </>
            )}

            {isOfficerOrAdmin && (
              <button
                onClick={() => onTabChange('admin')}
                className={`text-xs py-1 px-1.5 font-medium whitespace-nowrap ${
                  activeTab === 'admin' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400'
                }`}
              >
                Officer Console
              </button>
            )}

            <button
              onClick={() => onTabChange('track')}
              className={`text-xs py-1 px-1.5 font-medium whitespace-nowrap ${
                activeTab === 'track' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'
              }`}
            >
              {t.tabTrack}
            </button>
            <button
              onClick={() => onTabChange('chat')}
              className={`text-xs py-1 px-1.5 font-medium whitespace-nowrap ${
                activeTab === 'chat' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
              }`}
            >
              {t.tabChat}
            </button>
            <button
              onClick={() => onTabChange('guide')}
              className={`text-xs py-1 px-1.5 font-medium whitespace-nowrap ${
                activeTab === 'guide' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'
              }`}
            >
              {t.tabGuide}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
