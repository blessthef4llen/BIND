/**
 * services/api.ts — Pulse API client
 *
 * Update API_BASE_URL with your machine's LAN IP before running on a device.
 * Run `ifconfig` (Mac/Linux) or `ipconfig` (Windows) to find it.
 * Example: http://192.168.1.42:8000
 *
 * Backend runs on port 8000 (FastAPI / uvicorn).
 */

export const API_BASE_URL = 'http://localhost:8000';
export const API_BASE     = `${API_BASE_URL}/api`;

// ── Types ─────────────────────────────────────────────────────────────────────

export type UrgencyLevel   = 'low' | 'medium' | 'high';
export type EscalationLevel = 'monitor' | 'see_doctor' | 'urgent';
export type Confidence     = 'high' | 'medium' | 'low';

export interface HealthStatus {
  status: string;
  granite_ready: boolean;
}

export interface ConcernLog {
  id:                   string;
  date_logged:          string;
  body_area:            string;
  symptom:              string;
  urgency_level:        UrgencyLevel;
  severity:             number;
  notes:                string;
  symptom_date?:        string;
  category?:            string;
  category_confidence?: Confidence;
  archived:             boolean;
  archived_at?:         string | null;
}

export interface NewConcernInput {
  body_area:            string;
  symptom:              string;
  urgency_level:        UrgencyLevel;
  severity?:            number;
  notes?:               string;
  symptom_date?:        string;
  category?:            string;
  category_confidence?: Confidence;
}

export interface ConcernUpdateInput {
  symptom?:             string;
  body_area?:           string;
  urgency_level?:       UrgencyLevel;
  severity?:            number;
  notes?:               string;
  category?:            string;
  category_confidence?: Confidence;
}

export interface CategorizeResult {
  category:   string;
  confidence: Confidence;
  reason:     string;
}

export interface VisitPrepResponse {
  symptom_summary:     string;
  questions_to_ask:    string[];
  concerns_to_mention: Array<{ area: string; urgency: UrgencyLevel }>;
}

export interface ExtractNoteResponse {
  diagnosis:      string;
  prescriptions:  string[];
  key_advice:     string[];
  follow_up_date: string;
}

export interface TimelineEntry {
  id:             string;
  visit_date:     string;
  diagnosis:      string;
  prescriptions:  string[];
  key_advice:     string[];
  follow_up_date: string;
  archived:       boolean;
  archived_at?:   string | null;
}

export interface PatternResult {
  pattern_summary:  string;
  escalation_level: EscalationLevel;
  entry_count:      number;
}

export interface VisitPrepChainResult {
  concern_summary:      string;
  escalation_decision:  EscalationLevel;
  escalation_reason:    string;
  suggested_questions:  string[];
}

export interface AgentChainResult {
  step1_checkin:    ConcernLog;
  step2_pattern:    PatternResult;
  step3_visit_prep: VisitPrepChainResult;
}

// ── ROUTES constant (import this in screens) ──────────────────────────────────

export const ROUTES = {
  health:         `${API_BASE}/health`,
  prep:           `${API_BASE}/prep`,
  extract:        `${API_BASE}/extract`,
  categorize:     `${API_BASE}/categorize`,

  concerns:       `${API_BASE}/concerns`,
  concernArchived:`${API_BASE}/concerns/archived`,
  concern:        (id: string) => `${API_BASE}/concerns/${id}`,
  concernArchive: (id: string) => `${API_BASE}/concerns/${id}/archive`,
  concernRestore: (id: string) => `${API_BASE}/concerns/${id}/restore`,

  timeline:       `${API_BASE}/timeline`,
  timelineEntry:  (id: string) => `${API_BASE}/timeline/${id}`,
  timelineArchive:(id: string) => `${API_BASE}/timeline/${id}/archive`,
  timelineRestore:(id: string) => `${API_BASE}/timeline/${id}/restore`,

  agentChain:       `${API_BASE}/run-agent-chain`,
  upload:           `${API_BASE}/upload`,
  extractFile:      `${API_BASE}/extract-file`,
  uploadLink:       (id: string) => `${API_BASE}/uploads/${id}/link`,
  timelineUploads:  (id: string) => `${API_BASE}/timeline/${id}/uploads`,
  timelineReport:   (id: string) => `${API_BASE}/timeline/${id}/report`,
} as const;

// ── Internal helpers ──────────────────────────────────────────────────────────

async function _getToken(): Promise<string | null> {
  try {
    const { default: AS } = await import('@react-native-async-storage/async-storage');
    return AS.getItem('pulse_auth_token');
  } catch { return null; }
}

async function _fetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await _getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers, ...options });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${options?.method ?? 'GET'} ${url} → ${res.status}: ${text}`);
  }
  // 204 No Content
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

const get  = <T>(url: string) => _fetch<T>(url);
const post = <T>(url: string, body: object) =>
  _fetch<T>(url, { method: 'POST', body: JSON.stringify(body) });
const patch = <T>(url: string, body: object) =>
  _fetch<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
const del  = <T>(url: string) => _fetch<T>(url, { method: 'DELETE' });

// ── API client ────────────────────────────────────────────────────────────────

export const api = {
  // Health
  health: ()                           => get<HealthStatus>(ROUTES.health),

  // Agents
  prep:       (data: Omit<ConcernLog, 'id'|'date_logged'|'archived'|'archived_at'>) =>
    post<VisitPrepResponse>(ROUTES.prep, {
      body_area:           data.body_area,
      start_time:          '',
      concern_description: data.symptom,
      urgency:             data.urgency_level,
      additional_message:  data.notes ?? '',
    }),

  extract:    (text: string)                => post<ExtractNoteResponse>(ROUTES.extract, { text }),
  categorize: (body_area: string, description: string, urgency: UrgencyLevel = 'low') =>
    post<CategorizeResult>(ROUTES.categorize, { body_area, description, urgency }),

  // Concerns
  getConcerns:        ()                          => get<{ concerns: ConcernLog[] }>(ROUTES.concerns),
  getArchivedConcerns:()                          => get<{ concerns: ConcernLog[] }>(ROUTES.concernArchived),
  logConcern:         (data: NewConcernInput)     => post<ConcernLog>(ROUTES.concerns, data),
  updateConcern:      (id: string, data: ConcernUpdateInput) => patch<ConcernLog>(ROUTES.concern(id), data),
  deleteConcern:      (id: string)                => del<void>(ROUTES.concern(id)),
  archiveConcern:     (id: string)                => post<{status:string}>(ROUTES.concernArchive(id), {}),
  restoreConcern:     (id: string)                => post<{status:string}>(ROUTES.concernRestore(id), {}),

  // Timeline
  getTimeline:        ()                          => get<{ timeline: TimelineEntry[] }>(ROUTES.timeline),
  saveTimelineEntry:  (data: Omit<TimelineEntry, 'id'|'archived'|'archived_at'>) =>
    post<TimelineEntry>(ROUTES.timeline, data),
  archiveTimelineEntry:(id: string)               => post<{status:string}>(ROUTES.timelineArchive(id), {}),
  restoreTimelineEntry:(id: string)               => post<{status:string}>(ROUTES.timelineRestore(id), {}),

  // Demo chain
  runAgentChain: (data: {
    body_area: string; symptom: string;
    urgency_level: UrgencyLevel; severity: number;
    notes?: string;
  }) => post<AgentChainResult>(ROUTES.agentChain, data),

  // Extract from uploaded file
  extractFromFile: (uploadId: string) =>
    post<ExtractNoteResponse>(ROUTES.extractFile, { upload_id: uploadId }),

  // Link upload to timeline entry
  linkUpload: (uploadId: string, timelineId: string) =>
    patch<{ status: string }>(ROUTES.uploadLink(uploadId), { timeline_id: timelineId }),

  // Get uploads attached to a timeline entry
  getTimelineUploads: (timelineId: string) =>
    get<{ uploads: UploadMeta[] }>(ROUTES.timelineUploads(timelineId)),

  // URL to generate/download PDF report (use with Linking.openURL + ?token=)
  getReportUrl: async (timelineId: string): Promise<string> => {
    const token = await _getToken();
    const base  = ROUTES.timelineReport(timelineId);
    return token ? `${base}?token=${token}` : base;
  },

  // Upload file (multipart)
  uploadFile: async (uri: string, name: string, mimeType: string): Promise<UploadMeta> => {
    const token = await _getToken();
    const form  = new FormData();
    form.append('file', { uri, name, type: mimeType } as any);
    const res = await fetch(ROUTES.upload, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail ?? 'Upload failed'); }
    return res.json();
  },
};