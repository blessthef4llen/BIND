// services/api.ts — All fetch calls to the PULSE Flask backend
// IMPORTANT: Replace YOUR_LOCAL_IP with your machine's LAN IP before demo
// Run `ifconfig` (Mac/Linux) or `ipconfig` (Windows) to find it
// localhost does NOT work on physical devices with Expo Go

const BASE_URL = 'http://YOUR_LOCAL_IP:5000'; // e.g. 'http://192.168.1.42:5000'

// --- Type Definitions ---

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface Concern {
  body_area: string;
  symptom: string;
  urgency_level: UrgencyLevel;
  severity: number;       // 1–10
  notes?: string;
  date_logged?: string;   // ISO date string, auto-set by backend if omitted
  language?: string;      // 'en' | 'es' | 'zh' | 'tl'
}

export interface TimelineEntry {
  visit_date: string;
  visit_reason: string;
  diagnosis: string;
  advice: string;
  follow_up: string;
  body_area: string;
}

export interface PatternResult {
  escalation_level: 'monitor' | 'see_doctor' | 'urgent';
  pattern_summary: string;
  recurring_areas: string[];
  severity_trend: string;
}

export interface VisitPrepResult {
  concern_summary: string;
  questions: string[];
  concerns_to_mention: Array<{ area: string; urgency: UrgencyLevel }>;
  escalation: PatternResult;
}

export interface ExtractedNote {
  diagnosis: string;
  prescriptions: Array<{ name: string; instructions: string }>;
  key_advice: string[];
  follow_up: string;
  lifestyle_recommendations?: string[];
}

export interface AgentChainResult {
  chain_complete: boolean;
  step1_logged: boolean;
  step2_pattern: PatternResult;
  step3_visit_prep: VisitPrepResult;
}

// --- API Client ---

export const api = {
  logConcern: (concern: Concern) =>
    post('/api/log-concern', concern),

  getConcerns: (): Promise<{ concerns: Concern[] }> =>
    get('/api/concerns'),

  generatePrep: (concerns?: Concern[]): Promise<VisitPrepResult> =>
    post('/api/prep', { concerns }),

  extractNotes: (rawText: string): Promise<ExtractedNote> =>
    post('/api/extract', { raw_text: rawText }),

  saveVisit: (entry: TimelineEntry): Promise<{ status: string; total_entries: number }> =>
    post('/api/save-visit', entry),

  getTimeline: (): Promise<{ timeline: TimelineEntry[] }> =>
    get('/api/timeline'),

  runAgentChain: (concern: Concern): Promise<AgentChainResult> =>
    post('/api/run-agent-chain', { concern }),

  healthCheck: (): Promise<{ status: string; ibm_ready: boolean }> =>
    get('/api/health'),
};

// --- Internal helpers ---

async function get(path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post(path: string, body: object): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}
