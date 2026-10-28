import { SavedReport } from '../types';

const STORAGE_KEY = 'civiclens_report_history_v1';

export function getSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load civic reports from localStorage:', e);
    return [];
  }
}

export function saveReportToStorage(report: SavedReport): SavedReport[] {
  try {
    const current = getSavedReports();
    // Prepend new or update existing
    const filtered = current.filter((r) => r.id !== report.id);
    const updated = [report, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save civic report to localStorage:', e);
    return getSavedReports();
  }
}

export function deleteReportFromStorage(id: string): SavedReport[] {
  try {
    const current = getSavedReports();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete report:', e);
    return getSavedReports();
  }
}

export function clearAllStorageReports(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear reports:', e);
  }
}
