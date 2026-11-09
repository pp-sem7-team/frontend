export type UUID = string;
export type ISODateTime = string;

export interface User {
  id: UUID;
  email: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Workspace {
  id: UUID;
  name: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type BranchStatus = 'active' | 'closed';

export interface Branch {
  id: UUID;
  workspace_id: UUID;
  name: string;
  status: BranchStatus;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface PaginatedResponse<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
}
export type GenerationStatus = 'pending' | 'done' | 'failed';

export type CommitType =
  | 'feat'
  | 'fix'
  | 'refactor'
  | 'perf'
  | 'docs'
  | 'test'
  | 'style'
  | 'chore';

export interface Commit {
  id: UUID;
  type: CommitType | null;
  scope: string | null;
  message: string | null;
  is_edited_by_user: boolean;
  status: GenerationStatus;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AnalysisResult {
  id: UUID;
  structured_changes: unknown | null;
  status: GenerationStatus;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Change {
  id: UUID;
  branch_id: UUID;
  sequence_number: number;
  analysis: AnalysisResult;
  commit: Commit;
  created_at: ISODateTime;
}

export interface PullRequest {
  id: UUID;
  branch_id: UUID;
  title: string | null;
  description: string | null;
  is_edited_by_user: boolean;
  status: GenerationStatus;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}