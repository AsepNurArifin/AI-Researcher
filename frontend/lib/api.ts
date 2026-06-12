const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

export function getUserRole(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
    ));
    return decoded.role || null;
  } catch (e) {
    return null;
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
  getResumes: () => apiFetch("/resumes").then((res: any) => res.items),
  deleteResume: (resumeId: string) => apiFetch(`/resumes/${resumeId}`, { method: "DELETE" }),

  // Jobs endpoints
  createJob: (data: any) => apiFetch("/jobs", { method: "POST", body: JSON.stringify(data) }),
  getJobs: () => apiFetch("/jobs").then((res: any) => res.items),
  getJobCandidates: (jobId: string) => apiFetch(`/jobs/${jobId}/candidates`),
  updateJob: (jobId: string, data: any) => apiFetch(`/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(data) }),
  applyJob: (jobId: string) => apiFetch(`/jobs/${jobId}/apply`, { method: "POST" }),
  checkAppliedStatus: (jobId: string) => apiFetch(`/jobs/${jobId}/applied`),

  // Matches endpoints
  matchJob: (data: { resume_id: string; job_description: string; job_title?: string }) =>
    apiFetch(`/match-job`, { method: "POST", body: JSON.stringify(data) }),
  getMatches: () => apiFetch("/matches").then((res: any) => res.items),
};

