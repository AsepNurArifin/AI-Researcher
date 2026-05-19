const API_URL = "http://127.0.0.1:8000";

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set default Content-Type to application/json if not uploading files
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = "An error occurred";
    try {
      const data = await response.json();
      errorMsg = data.detail || errorMsg;
    } catch (e) {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth endpoints
  register: (data: any) => apiFetch("/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => apiFetch("/login", { method: "POST", body: JSON.stringify(data) }),

  // Resumes endpoints
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch("/upload-resume", { method: "POST", body: formData });
  },
  getResumeAnalysis: (resumeId: string) => apiFetch(`/resume-analysis/${resumeId}`),

  // Jobs endpoints
  createJob: (data: any) => apiFetch("/jobs", { method: "POST", body: JSON.stringify(data) }),
  getJobs: () => apiFetch("/jobs"),
  getJobCandidates: (jobId: string) => apiFetch(`/jobs/${jobId}/candidates`),

  // Matches endpoints
  matchJob: (data: { resume_id: string; job_description: string; job_title?: string }) =>
    apiFetch(`/match-job`, { method: "POST", body: JSON.stringify(data) }),
};
