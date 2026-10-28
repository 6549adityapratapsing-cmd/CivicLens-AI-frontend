import {
  DemoDepartment,
  DepartmentMatchResult,
  DemoComplaint,
  DemoUser,
  DemoStats,
  DemoStatus,
} from '../types/demo';
import { API_BASE_URL } from './api';

const TOKEN_KEY = 'civiclens_demo_token';
const USER_KEY = 'civiclens_demo_user';
const LOCAL_COMPLAINTS_KEY = 'civiclens_local_demo_complaints_v1';

const DEFAULT_DEPARTMENTS: DemoDepartment[] = [
  {
    id: 'demo-pwd-roads',
    name: 'Demo Road Maintenance Department (PWD / Infrastructure)',
    supported_categories: [
      'Pothole / Road Damage',
      'Footpath / Public Property',
      'Drainage / Waterlogging',
      'Streetlight / Electrical',
    ],
    sample_service_area: 'Zone 1-4 Municipal Corridors',
    description: 'Handles asphalt repair, resurfacing, and municipal thoroughfares.',
    routing_rules: 'Assigned automatically when roadway or public pavement damage is identified.',
    sla_hours: 48,
    is_demo: true,
  },
  {
    id: 'demo-nagar-nigam-sanitation',
    name: 'Demo Solid Waste & Sanitation Bureau (Nagar Nigam)',
    supported_categories: ['Garbage Dump / Sanitation'],
    sample_service_area: 'Ward 1-12 Commercial & Residential Sectors',
    description: 'Manages municipal solid waste collection, roadside heaps, and public hygiene.',
    routing_rules: 'Assigned for garbage heaps, overflowing bins, and public littering.',
    sla_hours: 24,
    is_demo: true,
  },
  {
    id: 'demo-electricity-board',
    name: 'Demo Electricity & Public Lighting Division',
    supported_categories: ['Streetlight / Electrical'],
    sample_service_area: 'City-wide Grid & Feeder Network',
    description: 'Maintains streetlights, exposed junction boxes, and public electrical fixtures.',
    routing_rules: 'High priority routing for exposed wiring or blacked-out public streets.',
    sla_hours: 24,
    is_demo: true,
  },
  {
    id: 'demo-jal-sansthan',
    name: 'Demo Water Supply & Drainage Authority (Jal Board)',
    supported_categories: ['Drainage / Waterlogging'],
    sample_service_area: 'Metro Water & Stormwater Network',
    description: 'Resolves water pipe bursts, open stormwater drains, and persistent waterlogging.',
    routing_rules: 'Assigned for contaminated drinking lines or severe stormwater blockages.',
    sla_hours: 36,
    is_demo: true,
  },
  {
    id: 'demo-horticulture',
    name: 'Demo Urban Forestry & Parks Department',
    supported_categories: ['Footpath / Public Property'],
    sample_service_area: 'Municipal Parks & Green Belts',
    description: 'Oversees fallen trees, overgrown vegetation obstructing pedestrian access.',
    routing_rules: 'Assigned for fallen tree limbs or sidewalk obstructions from vegetation.',
    sla_hours: 48,
    is_demo: true,
  },
];

const INITIAL_LOCAL_COMPLAINTS: DemoComplaint[] = [
  {
    id: 'seed-complaint-1',
    reference_number: 'DEMO-2026-000001',
    citizen_id: 'demo-citizen-1',
    citizen_name: 'Aarav Sharma',
    citizen_contact: '+91 98765 43210',
    title: 'Dangerous 2-Meter Road Crater Near Sector 4',
    category: 'Pothole / Road Damage',
    department_id: 'demo-pwd-roads',
    department_name: 'Demo Road Maintenance Department (PWD / Infrastructure)',
    priority: 'Critical',
    location: 'Sector 4 Main Road, near Metro Pillar 142',
    summary: 'Deep road crater with exposed aggregate causing severe vehicular damage and transit risk.',
    complaint_body: 'To The Executive Engineer, Municipal Corporation. Severe pothole crater causing accident hazards.',
    status: 'Action Planned (Demo)',
    status_history: [
      {
        status: 'Submitted (Demo)',
        timestamp: '2026-10-27T19:48:29.681116+00:00',
        updated_by: 'Citizen Submission (Simulated)',
        note: 'Initial automated grievance draft received and logged in demo system.',
        role: 'system',
        is_simulated: true,
      },
      {
        status: 'Action Planned (Demo)',
        timestamp: '2026-10-27T20:08:49.043798+00:00',
        updated_by: 'Rajesh Varma (Demo Department Officer)',
        note: 'Repair crew dispatched for leveling and patch repairs.',
        role: 'officer',
        work_done: 'Site inspection completed. Cold-mix asphalt asphalt requisitioned.',
        update_type: 'progress_update',
        is_simulated: true,
      },
    ],
    visible_evidence: [
      'Exposed sub-base aggregate',
      'Pothole depth exceeding 15 centimeters',
    ],
    receipt: {
      receipt_id: 'RCPT-DEMO-2026-000001',
      reference_number: 'DEMO-2026-000001',
      timestamp: '2026-10-27T19:48:29.681116+00:00',
      department_name: 'Demo Road Maintenance Department (PWD / Infrastructure)',
      acknowledgement: 'SIMULATED SUBMISSION — Recorded in Demo Environment Only',
      disclaimer: 'This complaint exists only in the CivicLens AI demo.',
      expected_sla_hours: 48,
    },
    created_at: '2026-10-27T19:48:29.681116+00:00',
    updated_at: '2026-10-27T20:08:49.043798+00:00',
    is_demo: true,
  },
  {
    id: 'seed-complaint-2',
    reference_number: 'DEMO-2026-000002',
    citizen_id: 'demo-citizen-1',
    citizen_name: 'Aarav Sharma',
    citizen_contact: '+91 98765 43210',
    title: 'Uncollected Hazardous Waste Near City Market',
    category: 'Garbage Dump / Sanitation',
    department_id: 'demo-nagar-nigam-sanitation',
    department_name: 'Demo Solid Waste & Sanitation Bureau (Nagar Nigam)',
    priority: 'High',
    location: 'City Market Gate 3',
    summary: 'Overflowing municipal dumpster spilling onto pedestrian walkways creating biohazard.',
    complaint_body: 'To Sanitary Inspector, Nagar Nigam. Accumulation of organic and plastic waste obstructing transit.',
    status: 'Under Review (Demo)',
    status_history: [
      {
        status: 'Submitted (Demo)',
        timestamp: '2026-10-27T20:00:00.000000+00:00',
        updated_by: 'Citizen Submission (Simulated)',
        note: 'Grievance submitted in demo system.',
        role: 'system',
        is_simulated: true,
      },
    ],
    visible_evidence: ['Overflowing garbage bins', 'Stagnant leach water on road'],
    receipt: {
      receipt_id: 'RCPT-DEMO-2026-000002',
      reference_number: 'DEMO-2026-000002',
      timestamp: '2026-10-27T20:00:00.000000+00:00',
      department_name: 'Demo Solid Waste & Sanitation Bureau (Nagar Nigam)',
      acknowledgement: 'SIMULATED SUBMISSION — Recorded in Demo Environment Only',
      disclaimer: 'This complaint exists only in the CivicLens AI demo.',
      expected_sla_hours: 24,
    },
    created_at: '2026-10-27T20:00:00.000000+00:00',
    updated_at: '2026-10-27T20:00:00.000000+00:00',
    is_demo: true,
  },
];

function getLocalComplaints(): DemoComplaint[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMPLAINTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(INITIAL_LOCAL_COMPLAINTS));
      return INITIAL_LOCAL_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LOCAL_COMPLAINTS;
  } catch {
    return INITIAL_LOCAL_COMPLAINTS;
  }
}

function saveLocalComplaints(complaints: DemoComplaint[]): void {
  try {
    localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(complaints));
  } catch (e) {
    console.error('Failed to save local demo complaints', e);
  }
}

export function getStoredDemoToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredDemoUser(): DemoUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredDemoAuth(token: string, user: DemoUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save demo auth token', e);
  }
}

export function clearStoredDemoAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Failed to clear demo auth', e);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredDemoToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchDemoConfig(): Promise<{
  demo_mode: boolean;
  notice: string;
  active_model: string;
  external_submissions_allowed: boolean;
  disclaimer: string;
  demo_accounts: Array<{ role: string; username: string; label: string; description: string }>;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/config`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load demo configuration');
    return await res.json();
  } catch {
    return {
      demo_mode: true,
      notice: 'DEMO MODE — Operating in simulated demo sandbox.',
      active_model: 'gemini-3.5-flash-lite',
      external_submissions_allowed: false,
      disclaimer: 'This is a simulated demo environment. No real government authorities are contacted.',
      demo_accounts: [
        { role: 'citizen', username: 'citizen', label: 'Aarav Sharma (Citizen)', description: 'Citizen Grievance Filing' },
        { role: 'officer', username: 'officer', label: 'Rajesh Varma (Officer)', description: 'Department Officer Review' },
      ],
    };
  }
}

export async function fetchDemoDepartments(): Promise<DemoDepartment[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/departments`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load demo departments');
    return await res.json();
  } catch {
    return DEFAULT_DEPARTMENTS;
  }
}

export async function matchDemoDepartment(
  category: string,
  description: string = '',
  location: string = ''
): Promise<DepartmentMatchResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/departments/match`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ category, description, location }),
    });
    if (!res.ok) throw new Error('Failed to match demo department');
    return await res.json();
  } catch {
    const matched = DEFAULT_DEPARTMENTS.find((d) => d.supported_categories.includes(category)) || DEFAULT_DEPARTMENTS[0];
    return {
      matched_department: matched,
      confidence_score: 0.95,
      explanation: `Matched automatically to ${matched.name} based on issue category '${category}'.`,
      requires_confirmation: false,
      candidate_departments: DEFAULT_DEPARTMENTS.slice(0, 3),
    };
  }
}

export async function loginDemoUser(
  username: string,
  password: string
): Promise<{ token: string; user: DemoUser; notice: string }> {
  // First attempt live backend API call
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Demo login failed');
    }
    const data = await res.json();
    setStoredDemoAuth(data.token, data.user);
    return data;
  } catch (err: any) {
    // If the server explicitly rejected the credentials (400/401 with a detail message), rethrow it
    if (err.message && err.message !== 'Failed to fetch' && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }

    // Server is unreachable, sleeping, or offline: Graceful Client-Side Simulated Demo Authentication
    const simulatedUsers: Record<string, { user: DemoUser; token: string }> = {
      citizen: {
        user: {
          user_id: 'demo-citizen-1',
          username: 'citizen',
          role: 'citizen',
          display_name: 'Aarav Sharma (Demo Citizen)',
        },
        token: 'civiclens-demo-citizen-token-3a2b',
      },
      citizen2: {
        user: {
          user_id: 'demo-citizen-2',
          username: 'citizen2',
          role: 'citizen',
          display_name: 'Vikram Singh (Demo Citizen)',
        },
        token: 'civiclens-demo-citizen2-token-4c7p',
      },
      officer: {
        user: {
          user_id: 'demo-officer-1',
          username: 'officer',
          role: 'officer',
          display_name: 'Rajesh Varma (Demo Department Officer)',
          department: 'demo-pwd-roads',
          department_name: 'Demo Road Maintenance Department (PWD / Infrastructure)',
        },
        token: 'civiclens-demo-officer-token-9k4w',
      },
      admin: {
        user: {
          user_id: 'demo-admin-1',
          username: 'admin',
          role: 'admin',
          display_name: 'Municipal Admin (Demo Overseer)',
        },
        token: 'civiclens-demo-admin-token-7x9q',
      },
    };

    const validPasswords: Record<string, string> = {
      citizen: 'demo123',
      citizen2: 'demo123',
      officer: 'officer123',
      admin: 'admin123',
    };

    const cleanUser = username.trim().toLowerCase();
    const account = simulatedUsers[cleanUser];

    if (account && validPasswords[cleanUser] === password.trim()) {
      setStoredDemoAuth(account.token, account.user);
      return {
        token: account.token,
        user: account.user,
        notice: 'DEMO MODE — Operating in simulated demo sandbox (offline client mode).',
      };
    }

    throw new Error('Invalid demo credentials. Use citizen / demo123 or officer / officer123');
  }
}

export async function submitDemoComplaint(payload: {
  title: string;
  category: string;
  department_id: string;
  priority?: string;
  location: string;
  summary: string;
  complaint_body: string;
  visible_evidence?: string[];
  image_ref?: string;
  citizen_name?: string;
  citizen_contact?: string;
  idempotency_key?: string;
}): Promise<DemoComplaint> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/complaints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Demo complaint submission failed');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch' && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }

    // Client-side fallback submission
    const existing = getLocalComplaints();
    const nextNum = existing.length + 1;
    const ref = `DEMO-2026-${String(nextNum).padStart(6, '0')}`;
    const dept = DEFAULT_DEPARTMENTS.find((d) => d.id === payload.department_id) || DEFAULT_DEPARTMENTS[0];
    const now = new Date().toISOString();

    const newComplaint: DemoComplaint = {
      id: `local-demo-${Date.now()}`,
      reference_number: ref,
      citizen_id: 'demo-citizen-1',
      citizen_name: payload.citizen_name || 'Aarav Sharma (Demo Citizen)',
      citizen_contact: payload.citizen_contact || '+91 98765 43210',
      title: payload.title,
      category: payload.category,
      department_id: dept.id,
      department_name: dept.name,
      priority: payload.priority || 'Medium',
      location: payload.location,
      summary: payload.summary,
      complaint_body: payload.complaint_body,
      status: 'Submitted (Demo)',
      status_history: [
        {
          status: 'Submitted (Demo)',
          timestamp: now,
          updated_by: 'Citizen Submission (Simulated)',
          note: 'Initial automated grievance draft received and logged in demo system.',
          role: 'system',
          is_simulated: true,
        },
      ],
      visible_evidence: payload.visible_evidence || [],
      image_ref: payload.image_ref,
      receipt: {
        receipt_id: `RCPT-${ref}`,
        reference_number: ref,
        timestamp: now,
        department_name: dept.name,
        acknowledgement: 'SIMULATED SUBMISSION — Recorded in Demo Environment Only',
        disclaimer: 'This complaint exists only in the CivicLens AI demo. It has not been sent to any government authority.',
        expected_sla_hours: dept.sla_hours,
      },
      created_at: now,
      updated_at: now,
      is_demo: true,
    };

    saveLocalComplaints([newComplaint, ...existing]);
    return newComplaint;
  }
}

export async function fetchDemoComplaints(departmentId?: string): Promise<DemoComplaint[]> {
  try {
    const url = departmentId && departmentId !== 'all'
      ? `${API_BASE_URL}/api/demo/complaints?department_id=${encodeURIComponent(departmentId)}`
      : `${API_BASE_URL}/api/demo/complaints`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load demo complaints');
    return await res.json();
  } catch {
    const all = getLocalComplaints();
    if (!departmentId || departmentId === 'all') {
      return all;
    }
    return all.filter((c) => c.department_id === departmentId);
  }
}

export async function fetchDemoComplaintDetail(identifier: string): Promise<DemoComplaint> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${encodeURIComponent(identifier)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Demo complaint '${identifier}' not found`);
    }
    return await res.json();
  } catch {
    const all = getLocalComplaints();
    const found = all.find((c) => c.id === identifier || c.reference_number.toLowerCase() === identifier.toLowerCase());
    if (!found) throw new Error(`Demo complaint '${identifier}' not found`);
    return found;
  }
}

export async function updateDemoStatus(
  complaintId: string,
  newStatus: DemoStatus,
  note?: string
): Promise<DemoComplaint> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_status: newStatus, note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update demo status');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch' && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }
    const all = getLocalComplaints();
    const target = all.find((c) => c.id === complaintId);
    if (!target) throw new Error('Complaint not found');
    target.status = newStatus;
    target.updated_at = new Date().toISOString();
    target.status_history.push({
      status: newStatus,
      timestamp: target.updated_at,
      updated_by: 'Officer (Simulated)',
      note: note || `Status changed to ${newStatus}`,
      role: 'officer',
      is_simulated: true,
    });
    saveLocalComplaints(all);
    return target;
  }
}

export async function postOfficerProgressUpdate(
  complaintId: string,
  payload: {
    newStatus?: DemoStatus;
    note: string;
    work_done?: string;
    work_planned?: string;
    inspection_findings?: string;
    next_steps?: string;
    expected_completion_date?: string;
  }
): Promise<DemoComplaint> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${complaintId}/officer-update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        new_status: payload.newStatus,
        note: payload.note,
        work_done: payload.work_done,
        work_planned: payload.work_planned,
        inspection_findings: payload.inspection_findings,
        next_steps: payload.next_steps,
        expected_completion_date: payload.expected_completion_date,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to post officer progress update');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch' && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }
    const all = getLocalComplaints();
    const target = all.find((c) => c.id === complaintId);
    if (!target) throw new Error('Complaint not found');
    const now = new Date().toISOString();
    if (payload.newStatus) target.status = payload.newStatus;
    target.updated_at = now;
    target.status_history.push({
      status: target.status,
      timestamp: now,
      updated_by: 'Rajesh Varma (Demo Department Officer)',
      note: payload.note,
      role: 'officer',
      work_done: payload.work_done,
      work_planned: payload.work_planned,
      inspection_findings: payload.inspection_findings,
      next_steps: payload.next_steps,
      expected_completion_date: payload.expected_completion_date,
      update_type: 'progress_update',
      is_simulated: true,
    });
    saveLocalComplaints(all);
    return target;
  }
}

export async function postCitizenReply(
  complaintId: string,
  message: string
): Promise<DemoComplaint> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${complaintId}/citizen-reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit citizen message');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch' && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }
    const all = getLocalComplaints();
    const target = all.find((c) => c.id === complaintId);
    if (!target) throw new Error('Complaint not found');
    const now = new Date().toISOString();
    target.updated_at = now;
    target.status_history.push({
      status: target.status,
      timestamp: now,
      updated_by: 'Citizen Reply (Simulated)',
      note: message,
      role: 'citizen',
      update_type: 'citizen_reply',
      is_simulated: true,
    });
    saveLocalComplaints(all);
    return target;
  }
}

export async function updateDemoDepartment(
  complaintId: string,
  departmentId: string,
  note?: string
): Promise<DemoComplaint> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${complaintId}/department`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ department_id: departmentId, note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to reassign department');
    }
    return await res.json();
  } catch (err: any) {
    if (err.message && err.message !== 'Failed to fetch' && !err.message.toLowerCase().includes('fetch')) {
      throw err;
    }
    const all = getLocalComplaints();
    const target = all.find((c) => c.id === complaintId);
    if (!target) throw new Error('Complaint not found');
    const dept = DEFAULT_DEPARTMENTS.find((d) => d.id === departmentId);
    if (dept) {
      target.department_id = dept.id;
      target.department_name = dept.name;
    }
    target.updated_at = new Date().toISOString();
    saveLocalComplaints(all);
    return target;
  }
}

export async function fetchDemoStats(): Promise<DemoStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch demo statistics');
    return await res.json();
  } catch {
    const all = getLocalComplaints();
    const byCategory: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    all.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      byDepartment[c.department_name] = (byDepartment[c.department_name] || 0) + 1;
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    });

    return {
      total_complaints: all.length,
      by_category: byCategory,
      by_department: byDepartment,
      by_status: byStatus,
      recent_submissions: all.slice(0, 5).map((c) => ({
        id: c.id,
        reference_number: c.reference_number,
        title: c.title,
        category: c.category,
        department: c.department_name,
        status: c.status,
        created_at: c.created_at,
      })),
    };
  }
}

export async function resetDemoStore(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/demo/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {
    localStorage.removeItem(LOCAL_COMPLAINTS_KEY);
  }
}
