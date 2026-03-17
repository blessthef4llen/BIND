const BASE_URL = "http://192.168.0.126:8000";

export const generateVisitPrep = async (data) => {
  const response = await fetch(`${BASE_URL}/generate-visit-prep`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};