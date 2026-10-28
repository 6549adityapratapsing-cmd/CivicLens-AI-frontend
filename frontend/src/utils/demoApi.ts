import {
  DemoDepartment,
  DepartmentMatchResult,
  DemoComplaint,
  DemoUser,
  DemoStats,
  DemoStatus,
} from '../types/demo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'civiclens_demo_token';
const USER_KEY = 'civiclens_demo_user';

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
  const res = await fetch(`${API_BASE_URL}/api/demo/config`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load demo configuration');
  return res.json();
}

export async function fetchDemoDepartments(): Promise<DemoDepartment[]> {
  const res = await fetch(`${API_BASE_URL}/api/demo/departments`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load demo departments');
  return res.json();
}

export async function matchDemoDepartment(
  category: string,
  description: string = '',
  location: string = ''
): Promise<DepartmentMatchResult> {
  const res = await fetch(`${API_BASE_URL}/api/demo/departments/match`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ category, description, location }),
  });
  if (!res.ok) throw new Error('Failed to match demo department');
  return res.json();
}

export async function loginDemoUser(
  username: string,
  password: string
): Promise<{ token: string; user: DemoUser; notice: string }> {
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
  const res = await fetch(`${API_BASE_URL}/api/demo/complaints`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Demo complaint submission failed');
  }
  return res.json();
}

export async function fetchDemoComplaints(departmentId?: string): Promise<DemoComplaint[]> {
  const url = departmentId && departmentId !== 'all'
    ? `${API_BASE_URL}/api/demo/complaints?department_id=${encodeURIComponent(departmentId)}`
    : `${API_BASE_URL}/api/demo/complaints`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load demo complaints');
  return res.json();
}

export async function fetchDemoComplaintDetail(identifier: string): Promise<DemoComplaint> {
  const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${encodeURIComponent(identifier)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Demo complaint '${identifier}' not found`);
  }
  return res.json();
}

export async function updateDemoStatus(
  complaintId: string,
  newStatus: DemoStatus,
  note?: string
): Promise<DemoComplaint> {
  const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${complaintId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ new_status: newStatus, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update demo status');
  }
  return res.json();
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
  return res.json();
}

export async function postCitizenReply(
  complaintId: string,
  message: string
): Promise<DemoComplaint> {
  const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${complaintId}/citizen-reply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit citizen message');
  }
  return res.json();
}

export async function updateDemoDepartment(
  complaintId: string,
  departmentId: string,
  note?: string
): Promise<DemoComplaint> {
  const res = await fetch(`${API_BASE_URL}/api/demo/complaints/${complaintId}/department`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ department_id: departmentId, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reassign department');
  }
  return res.json();
}

export async function fetchDemoStats(): Promise<DemoStats> {
  const res = await fetch(`${API_BASE_URL}/api/demo/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch demo statistics');
  return res.json();
}

export async function resetDemoStore(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/demo/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reset demo store');
}
