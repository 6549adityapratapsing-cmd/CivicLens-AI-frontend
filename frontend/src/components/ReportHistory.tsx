import React, { useState } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  Search,
  Download,
  Calendar,
  Building,
  AlertCircle,
  FileCheck,
  Cloud,
  HardDrive,
} from 'lucide-react';
import { SavedReport, LanguageCode, PriorityLevel } from '../types';
import { UI_TEXT, CIVIC_CATEGORIES } from '../utils/translations';

interface ReportHistoryProps {
  reports: SavedReport[];
  language: LanguageCode;
  onSelectReport: (report: SavedReport) => void;
  onDeleteReport: (id: string) => void;
  onClearAll: () => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reports,
  language,
  onSelectReport,
  onDeleteReport,
  onClearAll,
}) => {
  const t = UI_TEXT[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.issue_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.responsible_department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || r.category === selectedCategory;

    const matchesPriority =
      selectedPriority === 'all' || r.suggested_priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getPriorityBadgeClass = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'High':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      case 'Medium':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Low':
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
  };

  const handleDownload = (report: SavedReport, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = `CIVICLENS REPORT - ${report.issue_title}\nID: ${report.id}\nCategory: ${report.category}\nPriority: ${report.suggested_priority}\nDept: ${report.responsible_department}\n\n${report.complaint_draft.body}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CivicReport_${report.id.slice(0, 6)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/40 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t.historyTitle}</h3>
            <p className="text-xs text-slate-400">
              {reports.length}{' '}
              {language === 'hi'
                ? 'रिपोर्ट आपके ब्राउज़र के लोकल स्टोरेज में सुरक्षित हैं'
                : 'reports stored locally in your browser'}
            </p>
          </div>
        </div>

        {reports.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t.deleteConfirm)) {
                onClearAll();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 rounded-xl transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearAllHistory}</span>
          </button>
        )}
      </div>

      {reports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{t.filterAll}</option>
              {CIVIC_CATEGORIES.map((c) => (
                <option key={c.id} value={c.labelEn}>
                  {language === 'hi' ? c.labelHi : c.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">
                {language === 'hi' ? 'सभी प्राथमिकता स्तर' : 'All Priorities'}
              </option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">{t.historyEmpty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report)}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                {report.image_preview ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 bg-slate-950">
                    <img
                      src={report.image_preview}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getPriorityBadgeClass(
                        report.suggested_priority
                      )}`}
                    >
                      {report.suggested_priority}
                    </span>
                    <span className="text-xs text-cyan-400 font-medium">
                      {report.category}
                    </span>
                    {report.cloud_synced ? (
                      <span className="text-[10px] bg-emerald-950/70 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Cloud className="w-2.5 h-2.5" /> Cloud
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                        <HardDrive className="w-2.5 h-2.5" /> Local
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {report.issue_title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(report.saved_at || report.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-500" />
                      {report.responsible_department}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={(e) => handleDownload(report, e)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                  title="Download .txt"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(t.deleteConfirm)) {
                      onDeleteReport(report.id);
                    }
                  }}
                  className="p-2 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-950/60 transition-all"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/90 text-white hover:bg-cyan-500 transition-all shadow-sm"
                >
                  <span>{t.loadReport}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
