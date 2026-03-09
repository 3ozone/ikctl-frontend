import { api } from "./api";
import type {
  TokenResponse,
  UserProfile,
  CreateServerPayload,
  CreateOperationPayload,
  Server,
  ServerHealth,
  Operation,
  PaginatedResponse,
} from "@/types";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Auth ────────────────────────────────────────────────────────────────────

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post("/api/v1/register", payload);
  return data as { message: string; user_id: string };
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams({ username: email, password });
  const { data } = await axios.post<TokenResponse>(
    `${BASE_URL}/api/v1/login`,
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, withCredentials: true }
  );
  return data;
}

export async function login2fa(temp_token: string, code: string) {
  const { data } = await api.post<TokenResponse>("/api/v1/login/2fa", {
    temp_token,
    code,
  });
  return data;
}

export async function logout(refresh_token: string) {
  await api.post("/api/v1/logout", { refresh_token });
}

export async function verifyEmail(token: string) {
  const { data } = await api.post("/api/v1/verify-email", { token });
  return data as { message: string };
}

export async function resendVerification(email: string) {
  const { data } = await api.post("/api/v1/resend-verification", { email });
  return data as { message: string };
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/api/v1/password/forgot", { email });
  return data as { message: string };
}

export async function resetPassword(token: string, new_password: string) {
  const { data } = await api.post("/api/v1/password/reset", {
    token,
    new_password,
  });
  return data as { message: string };
}

// ── User ────────────────────────────────────────────────────────────────────

export async function getMe() {
  const { data } = await api.get<UserProfile>("/api/v1/users/me");
  return data;
}

export async function updateMe(payload: { name: string }) {
  const { data } = await api.put<UserProfile>("/api/v1/users/me", payload);
  return data;
}

export async function changePassword(
  current_password: string,
  new_password: string
) {
  const { data } = await api.put("/api/v1/users/me/password", {
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
  }>("/api/v1/users/me/2fa/enable");
  return data;
}

export async function verify2fa(code: string) {
  const { data } = await api.post<{
    message: string;
    backup_codes: string[];
  }>("/api/v1/users/me/2fa/verify", { code });
  return data;
}

export async function disable2fa(password: string) {
  const { data } = await api.post("/api/v1/users/me/2fa/disable", {
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

export async function getOperations(page = 1, limit = 20) {
  const { data } = await api.get<PaginatedResponse<Operation>>(
    `/api/v1/operations?page=${page}&limit=${limit}`
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
