// API base URL — update for your backend host
export const API_BASE = 'http://localhost:8000/api';

// All routes — do not invent new ones
export const ROUTES = {
  health:   `${API_BASE}/health`,
  prep:     `${API_BASE}/prep`,      // POST — Agent 1: concern log → visit prep
  extract:  `${API_BASE}/extract`,   // POST — Agent 2: doctor note extraction
  timeline: `${API_BASE}/timeline`,  // GET  — post-appointment records only
};
