import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  MapPin,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import {
  LanguageCode,
  CivicAnalysisResponse,
  SavedReport,
  AIHealthResponse,
} from './types';
import { UI_TEXT } from './utils/translations';
import { checkAIHealth, analyzeCivicIssue } from './utils/api';
import {
  getSavedReports,
  saveReportToStorage,
  deleteReportFromStorage,
  clearAllStorageReports,
} from './utils/storage';
import { isSupabaseConfigured, syncReportToSupabase } from './utils/supabase';
import { SamplePreset } from './utils/sampleImages';

import { Header, ActiveTab } from './components/Header';
import { CivicStatsTicker } from './components/CivicStatsTicker';
import { ImageUploadZone } from './components/ImageUploadZone';
import { CategorySelector } from './components/CategorySelector';
import { AnalysisProgress } from './components/AnalysisProgress';
import { AnalysisResultCard } from './components/AnalysisResultCard';
import { ComplaintDraftEditor } from './components/ComplaintDraftEditor';
import { ReportHistory } from './components/ReportHistory';
import { CivicChatModal } from './components/CivicChatModal';
import { CivicGuideModal } from './components/CivicGuideModal';
import { DisclaimerBanner } from './components/DisclaimerBanner';

import { DemoSafetyBanner } from './components/DemoSafetyBanner';
import { DepartmentMatchSelector } from './components/DepartmentMatchSelector';
import { DemoReceiptModal } from './components/DemoReceiptModal';
import { DemoTrackingView } from './components/DemoTrackingView';
import { DemoAdminDashboard } from './components/DemoAdminDashboard';
import { CitizenComplaintsDashboard } from './components/CitizenComplaintsDashboard';
import { TwoRoleLoginLanding } from './components/TwoRoleLoginLanding';

import {
  DemoUser,
  DemoDepartment,
  DepartmentMatchResult,
  DemoComplaint,
} from './types/demo';
import {
  getStoredDemoUser,
  clearStoredDemoAuth,
  loginDemoUser,
  fetchDemoDepartments,
  matchDemoDepartment,
  submitDemoComplaint,
  resetDemoStore,
} from './utils/demoApi';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(() => getStoredDemoUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const user = getStoredDemoUser();
    return user?.role === 'officer' || user?.role === 'admin' ? 'admin' : 'report';
  });

  const [aiHealth, setAiHealth] = useState<AIHealthResponse | null>(null);

  // Demo Pipeline State
  const [departments, setDepartments] = useState<DemoDepartment[]>([]);
  const [departmentMatch, setDepartmentMatch] = useState<DepartmentMatchResult | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('demo-nagar-nigam');
  const [submittedComplaint, setSubmittedComplaint] = useState<DemoComplaint | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [trackingRef, setTrackingRef] = useState<string | null>(null);
  const [isSubmittingDemo, setIsSubmittingDemo] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Pothole / Road Damage');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemma3:1b');

  // Analysis Lifecycle State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CivicAnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<{ message: string; tip?: string } | null>(null);

  // History State
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => getSavedReports());

  const t = UI_TEXT[language];

  const fetchAIHealth = () => {
    checkAIHealth()
      .then((data) => {
        setAiHealth(data);
        if (data.model) {
          setSelectedModel(data.model);
        }
      })
      .catch((err: any) => {
        setAiHealth({
          status: 'error',
          provider: 'unknown',
          model: 'unknown',
          configured: false,
          details: err.message || 'Backend server is not reachable.',
          actionable_tip: 'Ensure the backend FastAPI server is running on http://localhost:8000',
        });
      });
  };

  useEffect(() => {
    fetchAIHealth();
    fetchDemoDepartments()
      .then((depts) => {
        setDepartments(depts);
        if (depts.length > 0) {
          setSelectedDeptId(depts[0].id);
        }
      })
      .catch((err) => console.warn('Failed to load demo departments', err));
  }, []);

  const handleLoginSuccess = (user: DemoUser) => {
    setCurrentUser(user);
    if (user.role === 'officer' || user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('report');
    }
    setDemoNotice(`Welcome, ${user.display_name}! Active Role: ${user.role.toUpperCase()} (Demo)`);
    setTimeout(() => setDemoNotice(null), 3500);
  };

  const handleLogout = () => {
    clearStoredDemoAuth();
    setCurrentUser(null);
    setDemoNotice('You have been logged out of the demo environment.');
    setTimeout(() => setDemoNotice(null), 3500);
  };

  const handleSwitchRoleImmediate = async () => {
    if (!currentUser) return;
    const isOfficer = currentUser.role === 'officer' || currentUser.role === 'admin';
    const targetRole = isOfficer ? 'citizen' : 'officer';
    const targetPassword = isOfficer ? 'demo123' : 'officer123';

    try {
      const res = await loginDemoUser(targetRole, targetPassword);
      setCurrentUser(res.user);
      setActiveTab(targetRole === 'officer' ? 'admin' : 'report');
      setDemoNotice(`Switched to: ${res.user.display_name} (${res.user.role.toUpperCase()})`);
      setTimeout(() => setDemoNotice(null), 3500);
    } catch (err: any) {
      console.error('Switch role failed', err);
      // Fallback: clear auth to open role landing page
      handleLogout();
    }
  };

  const handleFileSelect = (file: File | null, previewUrl: string | null) => {
    setSelectedFile(file);
    setImagePreviewUrl(previewUrl);
    setAnalysisError(null);
  };

  const handlePresetSelect = (preset: SamplePreset) => {
    setSelectedCategory(preset.category);
    setDescription(language === 'hi' ? preset.descriptionHi : preset.descriptionEn);
    setAnalysisError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !description.trim()) {
      setAnalysisError({
        message:
          language === 'hi'
            ? 'कृपया समस्या की एक फोटो अपलोड करें या नीचे विवरण लिखें।'
            : 'Please upload a photo or write a description of the civic issue.',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
    formData.append('category', selectedCategory);
    formData.append('description', description);
    formData.append('language', language);
    formData.append('model', selectedModel);
    if (location.trim()) {
      formData.append('location', location);
    }

    try {
      const result = await analyzeCivicIssue(formData);
      setAnalysisResult(result);

      // Smart Demo Department Matching
      try {
        const match = await matchDemoDepartment(result.category, description, location);
        setDepartmentMatch(match);
        if (match.matched_department?.id) {
          setSelectedDeptId(match.matched_department.id);
        }
      } catch (matchErr) {
        console.warn('Demo department auto-matching notice:', matchErr);
      }

      // Save to local storage history
      const savedItem: SavedReport = {
        ...result,
        id: result.analysis_id,
        saved_at: new Date().toISOString(),
        image_preview: imagePreviewUrl || undefined,
        user_notes: description,
        user_location: location,
        status: 'Draft',
        cloud_synced: false,
      };
      const updated = saveReportToStorage(savedItem);
      setSavedReports(updated);

      if (isSupabaseConfigured()) {
        void syncReportToSupabase(savedItem).then((res) => {
          if (res.success && res.cloudId) {
            const syncedItem: SavedReport = {
              ...savedItem,
              cloud_synced: true,
              cloud_id: res.cloudId,
              status: 'Submitted',
            };
            const postSync = saveReportToStorage(syncedItem);
            setSavedReports(postSync);
          }
        });
      }
    } catch (err: any) {
      setAnalysisError({
        message: err.message || 'Civic issue analysis failed.',
        tip: err.actionableTip,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToHistoryCustom = (
    customBody: string,
    citizenName: string,
    loc: string
  ) => {
    if (!analysisResult) return;
    const updatedDraft = { ...analysisResult.complaint_draft, body: customBody };
    const savedItem: SavedReport = {
      ...analysisResult,
      id: analysisResult.analysis_id,
      saved_at: analysisResult.timestamp,
      complaint_draft: updatedDraft,
      image_preview: imagePreviewUrl || undefined,
      user_notes: citizenName ? `Citizen: ${citizenName}` : description,
      user_location: loc || location,
      status: 'Submitted',
      cloud_synced: false,
    };
    const updated = saveReportToStorage(savedItem);
    setSavedReports(updated);

    if (isSupabaseConfigured()) {
      void syncReportToSupabase(savedItem).then((res) => {
        if (res.success && res.cloudId) {
          const syncedItem: SavedReport = {
            ...savedItem,
            cloud_synced: true,
            cloud_id: res.cloudId,
          };
          const postSync = saveReportToStorage(syncedItem);
          setSavedReports(postSync);
        }
      });
    }
  };

  const handleSelectFromHistory = (report: SavedReport) => {
    setAnalysisResult(report);
    setSelectedCategory(report.category);
    if (report.image_preview) {
      setImagePreviewUrl(report.image_preview);
    }
    setActiveTab('report');
  };

  const handleDeleteFromHistory = (id: string) => {
    const updated = deleteReportFromStorage(id);
    setSavedReports(updated);
  };

  const handleClearAllHistory = () => {
    clearAllStorageReports();
    setSavedReports([]);
  };

  const handleSubmitDemoComplaint = async (data: {
    customBody: string;
    citizenName: string;
    citizenContact: string;
    location: string;
  }) => {
    if (!analysisResult) return;
    setIsSubmittingDemo(true);
    setAnalysisError(null);

    const idempotencyKey = `demo_sub_${analysisResult.analysis_id}_${Date.now()}`;

    try {
      const res = await submitDemoComplaint({
        title: analysisResult.complaint_draft.subject || `${analysisResult.category} Issue`,
        category: analysisResult.category,
        department_id: selectedDeptId,
        complaint_body: data.customBody,
        location: data.location || location || 'Ward 12, Demo Area',
        priority: analysisResult.suggested_priority || 'High',
        visible_evidence: analysisResult.visible_evidence || [],
        summary: analysisResult.summary,
        citizen_name: currentUser?.display_name || data.citizenName || 'Demo Citizen',
        citizen_contact: data.citizenContact || 'citizen@demo.example',
        idempotency_key: idempotencyKey,
      });
      setSubmittedComplaint(res);
      setShowReceiptModal(true);
      setTrackingRef(res.reference_number);
    } catch (err: any) {
      setAnalysisError({
        message: err.message || 'Simulated submission failed.',
        tip: 'Check that FastAPI backend is running and DEMO_MODE=True is configured.',
      });
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  const handleResetDemoData = async () => {
    if (window.confirm('Reset all demo complaints to seed state? This affects only simulated demo records and is completely safe.')) {
      try {
        await resetDemoStore();
        setDemoNotice('Demo complaints reset to seed state successfully.');
        setTimeout(() => setDemoNotice(null), 3500);
      } catch (err: any) {
        alert(`Reset failed: ${err.message}`);
      }
    }
  };

  // If no user is logged in, show the Two-Role Login Landing Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
        {/* Navigation Banner for Unauthenticated State */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
                    Demo Environment
                  </span>
                </div>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </header>

        {demoNotice && (
          <div className="bg-teal-950/90 border-b border-teal-500/40 text-teal-200 text-xs py-2 px-4 text-center font-medium shadow-md">
            {demoNotice}
          </div>
        )}

        <main className="flex-1 flex items-center justify-center py-6">
          <TwoRoleLoginLanding
            onLoginSuccess={handleLoginSuccess}
            language={language}
          />
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">CivicLens AI</span>
              <span>•</span>
              <span>Two-Role Citizen & Department Redressal Suite</span>
            </div>
            <div className="text-[11px] text-slate-500">
              FastAPI & React Vite • Demo Isolation Active
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated Dashboard Layout
  const isOfficerOrAdmin = currentUser.role === 'officer' || currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Persistent Safety Barrier Banner */}
      <DemoSafetyBanner
        currentUser={currentUser}
        onSwitchRole={handleSwitchRoleImmediate}
        onLogout={handleLogout}
        onResetData={handleResetDemoData}
      />

      {demoNotice && (
        <div className="bg-teal-950/90 border-b border-teal-500/40 text-teal-200 text-xs py-2 px-4 text-center font-medium shadow-md">
          {demoNotice}
        </div>
      )}

      {/* Top Navbar */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        aiHealth={aiHealth}
        historyCount={savedReports.length}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRoleImmediate}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isOfficerOrAdmin
                ? 'Department Management Console'
                : t.heroBadge}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {isOfficerOrAdmin
              ? 'Department Grievance & SLA Response Console'
              : t.appTitle}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400">
            {isOfficerOrAdmin
              ? 'Triage incoming municipal grievances, post inspection findings, dispatch work crews, and resolve civic issues.'
              : t.appTagline}
          </p>
        </div>

        {/* Civic Statistics Ticker */}
        <CivicStatsTicker
          language={language}
          aiProvider={aiHealth?.provider || 'Ollama'}
          modelName={selectedModel || aiHealth?.model || 'gemma3:1b'}
        />

        {/* AI Health Alert Banner (if setup or key required) */}
        {aiHealth && aiHealth.status !== 'healthy' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">
                  {language === 'hi'
                    ? 'AI सेवा कॉन्फ़िगरेशन सूचना: '
                    : 'AI Configuration Notice: '}
                </span>
                <span>{aiHealth.details}</span>
                {aiHealth.actionable_tip && (
                  <p className="text-[11px] text-amber-400/90 font-mono mt-1">
                    Tip: {aiHealth.actionable_tip}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={fetchAIHealth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-100 border border-amber-700 transition-all flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* TAB 1: Report Issue (Citizen) */}
        {activeTab === 'report' && (
          <div className="space-y-8">
            {/* Input Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Image Dropzone */}
              <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
                <ImageUploadZone
                  language={language}
                  selectedFile={selectedFile}
                  imagePreviewUrl={imagePreviewUrl}
                  onFileSelect={handleFileSelect}
                  onPresetSelect={handlePresetSelect}
                />
              </div>

              {/* Right Column: Category & Details */}
              <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
                <CategorySelector
                  language={language}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />

                {/* Location Landmark field */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.locationLabel}</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Near Subhash Chowk, Sector 15 Metro Station"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Additional Description / Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.notesLabel}</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    className="w-full text-xs p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{t.analyzingButton}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{t.analyzeButton}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {analysisError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3 shadow-lg">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">
                    {language === 'hi' ? 'विश्लेषण विफल' : 'Analysis Failed'}
                  </div>
                  <div>{analysisError.message}</div>
                  {analysisError.tip && (
                    <div className="text-[11px] text-rose-200 font-mono bg-rose-950/80 p-2 rounded-lg border border-rose-900 mt-2">
                      💡 {analysisError.tip}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Scanning Progress Indicator */}
            {isAnalyzing && (
              <AnalysisProgress
                language={language}
                aiProvider={aiHealth?.provider || 'Ollama'}
              />
            )}

            {/* Analysis Results View */}
            {analysisResult && !isAnalyzing && (
              <div className="space-y-8 animate-fadeIn">
                <AnalysisResultCard
                  report={analysisResult}
                  language={language}
                  imagePreviewUrl={imagePreviewUrl}
                />

                {/* Demonstration Department Matcher & Routing */}
                <DepartmentMatchSelector
                  matchResult={departmentMatch}
                  departments={departments}
                  selectedDepartmentId={selectedDeptId}
                  onSelectDepartment={setSelectedDeptId}
                />

                <ComplaintDraftEditor
                  report={analysisResult}
                  language={language}
                  onSaveToHistory={handleSaveToHistoryCustom}
                  onSubmitDemo={handleSubmitDemoComplaint}
                  isSubmittingDemo={isSubmittingDemo}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Citizen's Own Complaints Dashboard */}
        {activeTab === 'complaints' && (
          <CitizenComplaintsDashboard
            onNewComplaintClick={() => setActiveTab('report')}
            onTrackReference={(ref) => {
              setTrackingRef(ref);
              setActiveTab('track');
            }}
          />
        )}

        {/* TAB 3: Track Demo */}
        {activeTab === 'track' && (
          <DemoTrackingView
            initialRef={trackingRef}
          />
        )}

        {/* TAB 4: Department Officer & Admin Portal */}
        {activeTab === 'admin' && (
          <DemoAdminDashboard
            currentUser={currentUser}
          />
        )}

        {/* TAB 5: Saved Reports History */}
        {activeTab === 'history' && (
          <ReportHistory
            reports={savedReports}
            language={language}
            onSelectReport={handleSelectFromHistory}
            onDeleteReport={handleDeleteFromHistory}
            onClearAll={handleClearAllHistory}
          />
        )}

        {/* TAB 6: Civic Assistant Chat */}
        {activeTab === 'chat' && (
          <CivicChatModal
            language={language}
            activeReport={analysisResult}
          />
        )}

        {/* TAB 7: Redressal Guide */}
        {activeTab === 'guide' && <CivicGuideModal language={language} />}

        {/* Citizen Legal Disclaimer Banner */}
        <DisclaimerBanner language={language} />
      </main>

      {/* Simulated Submission Receipt Modal */}
      {showReceiptModal && submittedComplaint && (
        <DemoReceiptModal
          complaint={submittedComplaint}
          onClose={() => setShowReceiptModal(false)}
          onTrack={(ref) => {
            setShowReceiptModal(false);
            setTrackingRef(ref);
            setActiveTab('complaints');
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">CivicLens AI</span>
            <span>•</span>
            <span>Citizen Governance Hackathon Suite</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Deployed with FastAPI & React Vite • Google Gen AI SDK
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
