// API service for architecture-diagram-api backend

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// --- Types ---

export interface ApiProject {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiDiagram {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  data: Record<string, unknown>;
  thumbnail: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Diagram list item (no `data` field to keep list responses light) */
export type ApiDiagramSummary = Omit<ApiDiagram, 'data'>;

// --- Helpers ---

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as Record<string, string>).message ?? res.statusText);
  }
  // DELETE returns 200 with empty body sometimes
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Projects ---

export const projectsApi = {
  list: () => request<ApiProject[]>('/projects'),

  get: (id: string) => request<ApiProject>(`/projects/${encodeURIComponent(id)}`),

  create: (data: { name: string; description?: string; color?: string }) =>
    request<ApiProject>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    request<ApiProject>(`/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  diagrams: (projectId: string) =>
    request<ApiDiagramSummary[]>(`/projects/${encodeURIComponent(projectId)}/diagrams`),
};

// --- Diagrams ---

export const diagramsApi = {
  get: (id: string) => request<ApiDiagram>(`/diagrams/${encodeURIComponent(id)}`),

  create: (projectId: string, data: { name: string; description?: string; data?: Record<string, unknown> }) =>
    request<ApiDiagram>(`/projects/${encodeURIComponent(projectId)}/diagrams`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string; data?: Record<string, unknown> }) =>
    request<ApiDiagram>(`/diagrams/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/diagrams/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  updateThumbnail: (id: string, thumbnail: string) =>
    request<ApiDiagram>(`/diagrams/${encodeURIComponent(id)}/thumbnail`, {
      method: 'PUT',
      body: JSON.stringify({ thumbnail }),
    }),
};
