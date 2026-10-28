export type DemoStatus =
  | 'Submitted (Demo)'
  | 'Under Review (Demo)'
  | 'Action Planned (Demo)'
  | 'Resolved (Demo)'
  | 'Rejected (Demo)';

export interface DemoDepartment {
  id: string;
  name: string;
  supported_categories: string[];
  sample_service_area: string;
  description: string;
  routing_rules: string;
  sla_hours: number;
  is_demo: boolean;
}

export interface DepartmentMatchResult {
  matched_department: DemoDepartment;
  confidence_score: number;
  explanation: string;
  requires_confirmation: boolean;
  candidate_departments: DemoDepartment[];
}

export interface SimulatedReceipt {
  receipt_id: string;
  reference_number: string;
  timestamp: string;
  department_name: string;
  acknowledgement: string;
  disclaimer: string;
  expected_sla_hours: number;
}

export interface StatusUpdateRecord {
  status: DemoStatus;
  timestamp: string;
  updated_by: string;
  note: string;
  role?: string;
  work_done?: string;
  work_planned?: string;
  inspection_findings?: string;
  next_steps?: string;
  expected_completion_date?: string;
  update_type?: string;
  is_simulated: boolean;
}

export interface DemoComplaint {
  id: string;
  reference_number: string;
  citizen_id: string;
  citizen_name: string;
  citizen_contact?: string;
  title: string;
  category: string;
  department_id: string;
  department_name: string;
  priority: string;
  location: string;
  summary: string;
  complaint_body: string;
  status: DemoStatus;
  status_history: StatusUpdateRecord[];
  visible_evidence: string[];
  image_ref?: string;
  expected_completion_date?: string;
  receipt: SimulatedReceipt;
  created_at: string;
  updated_at: string;
  idempotency_key?: string;
  is_demo: boolean;
}

export interface DemoUser {
  user_id: string;
  username: string;
  role: 'citizen' | 'officer' | 'admin';
  display_name: string;
  department?: string;
  department_name?: string;
}

export interface DemoStats {
  total_complaints: number;
  by_category: Record<string, number>;
  by_department: Record<string, number>;
  by_status: Record<string, number>;
  recent_submissions: Array<{
    id: string;
    reference_number: string;
    title: string;
    category: string;
    department: string;
    status: DemoStatus;
    created_at: string;
  }>;
}
