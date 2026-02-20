const API_BASE = process.env.REACT_APP_API_URL || "";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export async function login(email, password) {
  return api("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getDashboard() {
  return api("/api/dashboard");
}

export async function getSubmission(id) {
  return api(`/api/submissions/${id}`);
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function analyseRisk(fields) {
  return api("/api/risk", { method: "POST", body: JSON.stringify(fields) });
}

export async function submitDecision(submissionId, decision, notes) {
  return api("/api/decision", {
    method: "POST",
    body: JSON.stringify({ submission_id: submissionId, decision, notes }),
  });
}

export async function chatWithCopilot(submissionId, message) {
  return api("/api/chat", {
    method: "POST",
    body: JSON.stringify({ submission_id: submissionId, message }),
  });
}
