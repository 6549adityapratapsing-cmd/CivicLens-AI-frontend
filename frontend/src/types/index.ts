export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type LanguageCode = 'en' | 'hi';

export interface ComplaintDraft {
  subject: string;
  to_authority: string;
  body: string;
  recommended_portal?: string;
}

export interface CivicAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  language: LanguageCode;
  category: string;
  issue_title: string;
  summary: string;
  visible_evidence: string[];
  potential_impact: string[];
  suggested_priority: PriorityLevel;
  priority_reasoning: string;
  responsible_department: string;
  next_steps: string[];
  complaint_draft: ComplaintDraft;
  ai_provider: string;
  model_used: string;
  disclaimer: string;
}

export interface SavedReport extends CivicAnalysisResponse {
  id: string;
  saved_at: string;
  image_preview?: string;
  user_notes?: string;
  user_location?: string;
  status: 'Draft' | 'Submitted' | 'In Review' | 'Resolved';
  cloud_synced?: boolean;
  cloud_id?: string;
  cloud_error?: string;
}

export interface PublicCivicReport {
  id: string;
  created_at: string;
  category: string;
  priority: string;
  detected_issue: string;
  summary: string;
  visible_evidence: string[];
  public_impact: string;
  suggested_department: string;
  estimated_risk_level?: string;
  location_context?: string;
  image_url?: string;
  status: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  language?: LanguageCode;
  context?: Partial<CivicAnalysisResponse> | null;
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  suggested_questions: string[];
  provider: string;
  model: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface AIHealthResponse {
  status: 'healthy' | 'degraded' | 'error';
  provider: string;
  model: string;
  configured: boolean;
  details: string;
  actionable_tip?: string | null;
  available_models?: string[];
}

export interface CivicCategory {
  id: string;
  labelEn: string;
  labelHi: string;
  descriptionEn: string;
  descriptionHi: string;
  icon: string;
  defaultDepartment: string;
}
