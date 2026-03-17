const BASE_URL = "http://192.168.0.126:8000";

export const api = {
  // 🔍 Test connection
  health: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // 📊 Get concerns (for home screen)
  getConcerns: async () => {
    const res = await fetch(`${BASE_URL}/concerns`);
    return res.json();
  },

  // 🧠 Agent 1 ONLY (what you already built)
  generateVisitPrep: async (data) => {
    const res = await fetch(`${BASE_URL}/generate-visit-prep`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return res.json();
  },
};