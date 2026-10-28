import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedReport, PublicCivicReport } from '../types';

// Read ONLY the public project URL and anonymous / publishable key
// NEVER expose service_role or secret keys in Vite client variables!
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length >= 10
  );
};

// Singleton client instance (null when not configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Upload an image to the private civic_media storage bucket.
 * Generates a collision-resistant unique path to prevent overwriting.
 */
export async function uploadCivicImage(
  file: File
): Promise<{ success: boolean; imagePath?: string; signedUrl?: string; error?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase is not configured. Saved image locally only.',
    };
  }

  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Only JPG, PNG, and WebP images are allowed.' };
    }

    // Validate 10MB maximum size
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Image exceeds maximum 10MB limit.' };
    }

    // Generate safe, unique filename using UUID
    const cleanExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniquePath = `reports/${crypto.randomUUID()}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('civic_media')
      .upload(uniquePath, file, {
        cacheControl: '3600',
        upsert: false, // Prevent unauthorized overwrites
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Generate a temporary signed URL (valid for 2 hours) for secure preview
    const { data: signedData, error: signedError } = await supabase.storage
      .from('civic_media')
      .createSignedUrl(uniquePath, 7200);

    return {
      success: true,
      imagePath: uniquePath,
      signedUrl: signedData?.signedUrl || undefined,
      error: signedError?.message,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Image upload failed' };
  }
}

/**
 * Resolves an image path or URL to a temporary signed URL for private civic_media objects.
 */
export async function getReportImageUrl(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }
  if (!supabase || !isSupabaseConfigured()) {
    return pathOrUrl;
  }
  try {
    const { data, error } = await supabase.storage.from('civic_media').createSignedUrl(pathOrUrl, 7200);
    return error ? pathOrUrl : (data?.signedUrl || pathOrUrl);
  } catch {
    return pathOrUrl;
  }
}

/**
 * Synchronize a report to the Supabase database.
 * Gracefully preserves local storage if Supabase fails or is unconfigured.
 */
export async function syncReportToSupabase(
  report: SavedReport
): Promise<{ success: boolean; cloudId?: string; error?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase credentials not configured in environment.',
    };
  }

  try {
    // Format payload adhering to PostgreSQL constraints:
    // Notice: status is strictly initialized to 'submitted'
    // User ID is left null for anonymous visitors
    const payload = {
      category: report.category.slice(0, 80),
      priority: report.suggested_priority.toLowerCase(),
      summary: report.summary.slice(0, 1000),
      detected_issue: report.issue_title.slice(0, 300),
      visible_evidence: report.visible_evidence,
      public_impact: Array.isArray(report.potential_impact)
        ? report.potential_impact.join('; ')
        : String(report.potential_impact || ''),
      suggested_department: report.responsible_department.slice(0, 200),
      estimated_risk_level: report.suggested_priority,
      priority_rationale: report.priority_reasoning.slice(0, 1500),
      recommended_action: Array.isArray(report.next_steps)
        ? report.next_steps.join('; ')
        : String(report.next_steps || ''),
      location_context: (report.user_location || '').slice(0, 255),
      draft_complaint: report.complaint_draft,
      image_url: report.image_preview || null,
      model_used: report.model_used,
      status: 'submitted', // Enforced by RLS INSERT policy
      is_public: true,
    };

    const { data, error } = await supabase
      .from('civic_reports')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      console.warn('Supabase report sync failed (fallback to localStorage active):', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, cloudId: data?.id };
  } catch (err: any) {
    console.warn('Supabase sync exception:', err);
    return { success: false, error: err.message || 'Network error during cloud sync' };
  }
}

/**
 * Fetch public community reports from the secure view.
 * Excludes sensitive complaint draft letters and internal user IDs.
 */
export async function fetchPublicCommunityReports(): Promise<{
  data: PublicCivicReport[];
  error?: string;
}> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      data: [],
      error: 'Supabase is not configured. Connect project to view community feed.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('community_civic_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as PublicCivicReport[]) || [] };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch public reports' };
  }
}

/**
 * Fetch authenticated citizen's personal reports (including drafts).
 * Uses Row Level Security to ensure users only see their own reports.
 */
export async function fetchMyCitizenReports(): Promise<{
  data: SavedReport[];
  error?: string;
}> {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: [], error: 'User is not authenticated' };
    }

    const { data, error } = await supabase
      .from('civic_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    const mapped: SavedReport[] = (data || []).map((row: any) => ({
      analysis_id: row.id,
      id: row.id,
      timestamp: row.created_at,
      saved_at: row.created_at,
      language: 'en',
      category: row.category,
      issue_title: row.detected_issue,
      summary: row.summary,
      visible_evidence: row.visible_evidence || [],
      potential_impact: Array.isArray(row.public_impact)
        ? row.public_impact
        : (row.public_impact || '').split('; '),
      suggested_priority: (row.priority
        ? row.priority.charAt(0).toUpperCase() + row.priority.slice(1).toLowerCase()
        : 'Medium') as any,
      priority_reasoning: row.priority_rationale || '',
      responsible_department: row.suggested_department || '',
      next_steps: Array.isArray(row.recommended_action)
        ? row.recommended_action
        : (row.recommended_action || '').split('; '),
      complaint_draft: row.draft_complaint || { subject: '', to_authority: '', body: '' },
      ai_provider: 'cloud_sync',
      model_used: row.model_used || '',
      disclaimer: '',
      image_preview: row.image_url || undefined,
      user_location: row.location_context || undefined,
      status:
        row.status === 'submitted'
          ? 'Submitted'
          : row.status === 'under_review'
          ? 'In Review'
          : row.status === 'resolved'
          ? 'Resolved'
          : 'Draft',
      cloud_synced: true,
      cloud_id: row.id,
    }));

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch personal reports' };
  }
}

export interface CloudComplaintUpdate {
  id: string;
  complaint_id: string;
  user_id?: string;
  update_type: 'status_change' | 'progress_update' | 'inspection' | 'officer_reply' | 'citizen_reply' | 'system_event';
  old_status?: string;
  new_status?: string;
  note: string;
  work_done?: string;
  work_planned?: string;
  inspection_findings?: string;
  next_steps?: string;
  expected_completion_date?: string;
  media_urls?: string[];
  is_internal_only: boolean;
  created_at: string;
}

/**
 * Fetch timeline updates for a specific complaint from Supabase.
 */
export async function fetchCloudComplaintUpdates(
  complaintId: string
): Promise<{ data: CloudComplaintUpdate[]; error?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }
  try {
    const { data, error } = await supabase
      .from('complaint_updates')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data as CloudComplaintUpdate[]) || [] };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch complaint updates' };
  }
}

/**
 * Post an update or citizen reply to a cloud complaint.
 */
export async function postCloudComplaintUpdate(payload: {
  complaintId: string;
  updateType: 'citizen_reply' | 'progress_update' | 'status_change';
  note: string;
  workDone?: string;
  workPlanned?: string;
  inspectionFindings?: string;
  nextSteps?: string;
  expectedCompletionDate?: string;
  newStatus?: string;
}): Promise<{ success: boolean; updateId?: string; error?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }
  try {
    const { data: userData } = await supabase.auth.getUser();
    const row = {
      complaint_id: payload.complaintId,
      user_id: userData?.user?.id || null,
      update_type: payload.updateType,
      note: payload.note,
      work_done: payload.workDone || null,
      work_planned: payload.workPlanned || null,
      inspection_findings: payload.inspectionFindings || null,
      next_steps: payload.nextSteps || null,
      expected_completion_date: payload.expectedCompletionDate || null,
      new_status: payload.newStatus || null,
      is_internal_only: false,
    };
    const { data, error } = await supabase
      .from('complaint_updates')
      .insert([row])
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, updateId: data?.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to post complaint update' };
  }
}


