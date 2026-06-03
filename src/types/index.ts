export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Server {
  server_id: string;
  user_id: string;
  name: string;
  server_type: string;
  status: string;
  host: string | null;
  port: number | null;
  credential_id: string | null;
  description: string | null;
  os_id: string | null;
  os_version: string | null;
  os_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerHealth {
  server_id: string;
  status: string;
  latency_ms: number | null;
  os_id: string | null;
  os_version: string | null;
  os_name: string | null;
}

export interface Operation {
  operation_id: string;
  server_id: string;
  server_name?: string;
  kit_id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled" | "cancelled_unsafe";
  output?: string;
  error?: string;
  sudo?: boolean;
  debug_level?: "none" | "errors" | "full";
  backup_files?: string[];
  started_at?: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RestoreResponse {
  operation_id: string;
  restored_files: string[];
}

export interface CreateServerPayload {
  name: string;
  host: string;
  port?: number;
  credential_id?: string | null;
  description?: string;
}

export interface CreateOperationPayload {
  server_id?: string;
  group_id?: string;
  kit_id: string;
  sudo?: boolean;
  debug_level?: "none" | "errors" | "full";
  values?: Record<string, unknown>;
  timeout_seconds?: number;
}

export interface BatchOperationResponse {
  operations: Operation[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface Credential {
  credential_id: string;
  user_id: string;
  name: string;
  credential_type: "ssh" | "git_https" | "git_ssh";
  username: string | null;
  has_private_key: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCredentialPayload {
  name: string;
  type: "ssh" | "git_https" | "git_ssh";
  username?: string;
  password?: string;
  private_key?: string;
}

export interface UpdateCredentialPayload {
  name: string;
  username?: string;
  password?: string;
  private_key?: string;
}

// ── Repositories ──────────────────────────────────────────────────────────────

export interface Repository {
  repository_id: string;
  user_id: string;
  url: string;
  ref: string;
  credential_id: string | null;
  sync_status: "never_synced" | "synced" | "sync_error";
  last_synced_at: string | null;
  last_commit_sha: string | null;
  sync_error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRepositoryPayload {
  url: string;
  ref: string;
  credential_id?: string | null;
}

export interface UpdateRepositoryPayload {
  url: string;
  ref: string;
  credential_id?: string | null;
}

export interface RepositorySyncResponse {
  repository_id: string;
  sync_status: "never_synced" | "synced" | "sync_error";
  last_commit_sha: string | null;
  sync_error_message: string | null;
  kits_created: number;
  kits_updated: number;
  kits_deleted: number;
}

// ── Kits ──────────────────────────────────────────────────────────────────────

export interface Kit {
  kit_id: string;
  user_id: string;
  repository_id: string;
  path_in_repo: string;
  name: string;
  description: string;
  version: string;
  tags: string[];
  values: Record<string, unknown>;
  debug_level: string;
  sync_status: "never_synced" | "synced" | "sync_error";
  is_deleted?: boolean;
  last_synced_at: string | null;
  last_commit_sha: string | null;
  sync_error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ── Groups ────────────────────────────────────────────────────────────────────

export interface Group {
  group_id: string;
  user_id: string;
  name: string;
  description: string | null;
  server_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  server_ids?: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string | null;
  server_ids?: string[];
}

// ── Pipelines ─────────────────────────────────────────────────────────────────

export interface PipelineTarget {
  server_id: string;
}

export interface PipelineKitConfig {
  kit_id: string;
  sudo?: boolean | null;
  debug_level?: "none" | "errors" | "full" | null;
  values?: Record<string, unknown>;
}

export interface Pipeline {
  pipeline_id: string;
  user_id: string;
  name: string;
  description: string | null;
  targets: PipelineTarget[];
  kits: PipelineKitConfig[];
  sudo: boolean;
  debug_level: "none" | "errors" | "full";
  values: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreatePipelinePayload {
  name: string;
  description?: string;
  targets: PipelineTarget[];
  kits: PipelineKitConfig[];
  sudo?: boolean;
  debug_level?: "none" | "errors" | "full";
}

export interface UpdatePipelinePayload {
  name?: string;
  description?: string;
  targets?: PipelineTarget[];
  kits?: PipelineKitConfig[];
  sudo?: boolean;
  debug_level?: "none" | "errors" | "full";
}

export interface PipelineOperationRef {
  operation_id: string;
  server_id: string;
  kit_id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled" | "cancelled_unsafe";
  output?: string;
  error?: string;
}

export interface PipelineExecution {
  execution_id: string;
  pipeline_id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "partial";
  operations: PipelineOperationRef[];
  created_at: string;
  started_at?: string;
  finished_at: string | null;
  snapshot?: Record<string, unknown>;
}

export interface PipelineExecutionSummary {
  execution_id: string;
  pipeline_id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "partial";
  total_operations: number;
  completed_operations: number;
  failed_operations: number;
  created_at: string;
  started_at?: string;
  finished_at: string;
}
