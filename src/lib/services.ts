import { api } from "./api";
import type {
  TokenResponse,
  UserProfile,
  CreateServerPayload,
  CreateOperationPayload,
  Server,
  ServerHealth,
  Operation,
  RestoreResponse,
  PaginatedResponse,
  Credential,
  CreateCredentialPayload,
  UpdateCredentialPayload,
  Repository,
  CreateRepositoryPayload,
  UpdateRepositoryPayload,
  RepositorySyncResponse,
  Kit,
} from "@/types";

// ── Auth ────────────────────────────────────────────────────────────────────

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post("/api/v1/auth/register", payload);
  return data as { message: string; user_id: string };
}

export async function login(email: string, password: string) {
  const { data } = await api.post<TokenResponse>("/api/v1/auth/login", {
    email,
    password,
  });
  return data;
}

export async function login2fa(temp_token: string, code: string) {
  const { data } = await api.post<TokenResponse>("/api/v1/auth/login/2fa", {
    temp_token,
    code,
  });
  return data;
}

export async function logout(refresh_token: string) {
  await api.post("/api/v1/auth/logout", { refresh_token });
}

export async function verifyEmail(token: string) {
  const { data } = await api.post("/api/v1/auth/verify-email", { token });
  return data as { message: string };
}

export async function resendVerification(email: string) {
  const { data } = await api.post("/api/v1/auth/resend-verification", { email });
  return data as { message: string };
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/api/v1/auth/password/forgot", { email });
  return data as { message: string };
}

export async function resetPassword(token: string, new_password: string) {
  const { data } = await api.post("/api/v1/auth/password/reset", {
    token,
    new_password,
  });
  return data as { message: string };
}

// ── User ────────────────────────────────────────────────────────────────────

export async function getMe() {
  const { data } = await api.get<UserProfile>("/api/v1/auth/users/me");
  return data;
}

export async function updateMe(payload: { name: string }) {
  const { data } = await api.put<UserProfile>("/api/v1/auth/users/me", payload);
  return data;
}

export async function changePassword(
  current_password: string,
  new_password: string
) {
  const { data } = await api.put("/api/v1/auth/users/me/password", {
    current_password,
    new_password,
  });
  return data as { message: string };
}

// ── 2FA ─────────────────────────────────────────────────────────────────────

export async function enable2fa() {
  const { data } = await api.post<{
    qr_code: string;
    secret: string;
    message: string;
  }>("/api/v1/auth/users/me/2fa/enable");
  return data;
}

export async function verify2fa(code: string) {
  const { data } = await api.post<{
    message: string;
    backup_codes: string[];
  }>("/api/v1/auth/users/me/2fa/verify", { code });
  return data;
}

export async function disable2fa(password: string) {
  const { data } = await api.post("/api/v1/auth/users/me/2fa/disable", {
    password,
  });
  return data as { message: string };
}

// ── Servers ──────────────────────────────────────────────────────────────────

export async function getServers(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedResponse<Server>>(
    `/api/v1/servers?page=${page}&limit=${limit}`
  );
  return data;
}

export async function getServer(id: string) {
  const { data } = await api.get<Server>(`/api/v1/servers/${id}`);
  return data;
}

export async function createServer(payload: CreateServerPayload) {
  const { data } = await api.post<Server>("/api/v1/servers", payload);
  return data;
}

export async function updateServer(id: string, payload: Partial<CreateServerPayload>) {
  const { data } = await api.put<Server>(`/api/v1/servers/${id}`, payload);
  return data;
}

export async function deleteServer(id: string) {
  await api.delete(`/api/v1/servers/${id}`);
}

export async function checkServerHealth(id: string) {
  const { data } = await api.get<ServerHealth>(`/api/v1/servers/${id}/health`);
  return data;
}

// ── Operations ───────────────────────────────────────────────────────────────

export async function getOperations(
  page = 1,
  limit = 20,
  filters?: { server_id?: string; status?: string }
) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.server_id) params.set("server_id", filters.server_id);
  if (filters?.status) params.set("status", filters.status);
  const { data } = await api.get<PaginatedResponse<Operation>>(
    `/api/v1/operations?${params}`
  );
  return data;
}

export async function getOperation(id: string) {
  const { data } = await api.get<Operation>(`/api/v1/operations/${id}`);
  return data;
}

export async function createOperation(payload: CreateOperationPayload) {
  const { data } = await api.post<Operation>("/api/v1/operations", payload);
  return data;
}

export async function cancelOperation(id: string) {
  const { data } = await api.post<Operation>(`/api/v1/operations/${id}/cancel`);
  return data;
}

export async function retryOperation(id: string) {
  const { data } = await api.post<Operation>(`/api/v1/operations/${id}/retry`);
  return data;
}

export async function restoreOperation(id: string) {
  const { data } = await api.post<RestoreResponse>(`/api/v1/operations/${id}/restore`);
  return data;
}

// ── Credentials ───────────────────────────────────────────────────────────────

export async function getCredentials(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedResponse<Credential>>(
    `/api/v1/credentials?page=${page}&limit=${limit}`
  );
  return data;
}

export async function getCredential(id: string) {
  const { data } = await api.get<Credential>(`/api/v1/credentials/${id}`);
  return data;
}

export async function createCredential(payload: CreateCredentialPayload) {
  const { data } = await api.post<Credential>("/api/v1/credentials", payload);
  return data;
}

export async function updateCredential(id: string, payload: UpdateCredentialPayload) {
  const { data } = await api.put<Credential>(`/api/v1/credentials/${id}`, payload);
  return data;
}

export async function deleteCredential(id: string) {
  await api.delete(`/api/v1/credentials/${id}`);
}

// ── Repositories ──────────────────────────────────────────────────────────────

export async function getRepositories(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedResponse<Repository>>(
    `/api/v1/repositories?page=${page}&per_page=${limit}`
  );
  return data;
}

export async function getRepository(id: string) {
  const { data } = await api.get<Repository>(`/api/v1/repositories/${id}`);
  return data;
}

export async function createRepository(payload: CreateRepositoryPayload) {
  const { data } = await api.post<Repository>("/api/v1/repositories", payload);
  return data;
}

export async function updateRepository(id: string, payload: UpdateRepositoryPayload) {
  const { data } = await api.put<Repository>(`/api/v1/repositories/${id}`, payload);
  return data;
}

export async function deleteRepository(id: string) {
  await api.delete(`/api/v1/repositories/${id}`);
}

export async function syncRepository(id: string) {
  const { data } = await api.post<RepositorySyncResponse>(
    `/api/v1/repositories/${id}/sync`
  );
  return data;
}

// ── Kits ──────────────────────────────────────────────────────────────────────

export async function getKits(
  page = 1,
  limit = 20,
  filters?: { repository_id?: string; tags?: string; sync_status?: string }
) {
  const params = new URLSearchParams({ page: String(page), per_page: String(limit) });
  if (filters?.repository_id) params.set("repository_id", filters.repository_id);
  if (filters?.tags) params.set("tags", filters.tags);
  if (filters?.sync_status) params.set("sync_status", filters.sync_status);
  const { data } = await api.get<PaginatedResponse<Kit>>(
    `/api/v1/kits?${params}`
  );
  return data;
}

export async function getKit(id: string) {
  const { data } = await api.get<Kit>(`/api/v1/kits/${id}`);
  return data;
}
