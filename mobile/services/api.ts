const BASE_URL = "http://192.168.0.126:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export type UrgencyLevel = "low" | "medium" | "high";

export interface PrepRequest {
  body_area?: string;
  concern_description?: string;
  urgency?: UrgencyLevel;
  start_time?: string;
}

export interface PrepResponse {
  symptom_summary: string;
  questions_to_ask: string[];
  concerns_to_mention: Array<{
    area: string;
    urgency: UrgencyLevel;
  }>;
}

export interface ExtractResponse {
  diagnosis?: string;
  prescriptions?: string[];
  key_advice?: string[];
  lifestyle_recommendations?: string[];
  follow_up_date?: string;
  [key: string]: unknown;
}

export interface TimelineEntry {
  visit_date?: string;
  visit_reason?: string;
  diagnosis?: string;
  advice?: string;
  follow_up?: string;
  body_area?: string;
  [key: string]: unknown;
}

export interface HealthResponse {
  status?: string;
  ibm_ready?: boolean;
  [key: string]: unknown;
}

export const api = {
  health: async (): Promise<HealthResponse> => {
    const res = await fetch(`${BASE_URL}/api/health`);
    return handleResponse<HealthResponse>(res);
  },

  prep: async (data: PrepRequest): Promise<PrepResponse> => {
    const res = await fetch(`${BASE_URL}/api/prep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body_area: data.body_area ?? "",
        concern_description: data.concern_description ?? "",
        urgency: data.urgency ?? "low",
        start_time: data.start_time ?? "",
      }),
    });

    return handleResponse<PrepResponse>(res);
  },

  extract: async (text: string): Promise<ExtractResponse> => {
    const res = await fetch(`${BASE_URL}/api/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text ?? "",
      }),
    });

    return handleResponse<ExtractResponse>(res);
  },

  timeline: async (): Promise<TimelineEntry[]> => {
    const res = await fetch(`${BASE_URL}/api/timeline`);
    return handleResponse<TimelineEntry[]>(res);
  },
};