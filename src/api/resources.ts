import { api } from '../auth/session';
import type { Branch, Change, PaginatedResponse, Workspace } from '../types/api';
const id = encodeURIComponent;
const page = (offset: number) => `?limit=10&offset=${offset}`;
export const resources = {
  workspaces: (offset: number, signal?: AbortSignal) => api.request<PaginatedResponse<Workspace>>(`/workspaces${page(offset)}`, { signal }),
  workspace: (workspaceId: string, signal?: AbortSignal) => api.request<Workspace>(`/workspaces/${id(workspaceId)}`, { signal }),
  createWorkspace: (name: string) => api.request<Workspace>('/workspaces', { method: 'POST', body: { name } }),
  branches: (workspaceId: string, offset: number, signal?: AbortSignal) => api.request<PaginatedResponse<Branch>>(`/workspaces/${id(workspaceId)}/branches${page(offset)}`, { signal }),
  branch: (branchId: string, signal?: AbortSignal) => api.request<Branch>(`/branches/${id(branchId)}`, { signal }),
  createBranch: (workspaceId: string, name: string) => api.request<Branch>(`/workspaces/${id(workspaceId)}/branches`, { method: 'POST', body: { name } }),
  changes: (branchId: string, offset: number, signal?: AbortSignal) => api.request<PaginatedResponse<Change>>(`/branches/${id(branchId)}/changes${page(offset)}`, { signal }),
  submitDiff: (branchId: string, rawDiff: string) => api.request<Change>(`/branches/${id(branchId)}/changes`, { method: 'POST', body: { raw_diff: rawDiff } }),
  change: (changeId: string, signal?: AbortSignal) => api.request<Change>(`/changes/${id(changeId)}`, { signal }),
};
