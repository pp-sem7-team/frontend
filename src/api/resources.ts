import { ApiError } from './client';
import { api } from '../auth/session';
import type { Branch, Change, Commit, CommitEdit, PaginatedResponse, PullRequest, PullRequestEdit, Workspace } from '../types/api';
const id = encodeURIComponent;
const commitPath = (changeId: string) => `/changes/${id(changeId)}/commit`;
const pullRequestPath = (branchId: string) => `/branches/${id(branchId)}/pull-request`;
const page = (offset: number) => `?limit=10&offset=${offset}`;
export const resources = {
  workspaces: (offset: number, signal?: AbortSignal) => api.request<PaginatedResponse<Workspace>>(`/workspaces${page(offset)}`, { signal }),
  workspace: (workspaceId: string, signal?: AbortSignal) => api.request<Workspace>(`/workspaces/${id(workspaceId)}`, { signal }),
  createWorkspace: (name: string) => api.request<Workspace>('/workspaces', { method: 'POST', body: { name } }),
  branches: (workspaceId: string, offset: number, signal?: AbortSignal) => api.request<PaginatedResponse<Branch>>(`/workspaces/${id(workspaceId)}/branches${page(offset)}`, { signal }),
  branch: (branchId: string, signal?: AbortSignal) => api.request<Branch>(`/branches/${id(branchId)}`, { signal }),
  createBranch: (workspaceId: string, name: string) => api.request<Branch>(`/workspaces/${id(workspaceId)}/branches`, { method: 'POST', body: { name } }),
  changes: (branchId: string, offset: number, signal?: AbortSignal) => api.request<PaginatedResponse<Change>>(`/branches/${id(branchId)}/changes${page(offset)}`, { signal }),
  submitDiff: (branchId: string, rawDiff: string, signal?: AbortSignal) => api.request<Change>(`/branches/${id(branchId)}/changes`, { method: 'POST', body: { raw_diff: rawDiff }, signal }),
  change: (changeId: string, signal?: AbortSignal) => api.request<Change>(`/changes/${id(changeId)}`, { signal }),
  generateCommit: (changeId: string, signal: AbortSignal) => api.request<Commit>(commitPath(changeId), { method: 'POST', signal }),
  editCommit: (changeId: string, body: CommitEdit, signal: AbortSignal) => api.request<Commit>(commitPath(changeId), { method: 'PATCH', body, signal }),
  generatePullRequest: (branchId: string, signal: AbortSignal) => api.request<PullRequest>(pullRequestPath(branchId), { method: 'POST', signal }),
  editPullRequest: (branchId: string, body: PullRequestEdit, signal: AbortSignal) => api.request<PullRequest>(pullRequestPath(branchId), { method: 'PATCH', body, signal }),
  pullRequest: async (branchId: string, signal: AbortSignal) => {
    try {
      return await api.request<PullRequest>(pullRequestPath(branchId), { signal });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
