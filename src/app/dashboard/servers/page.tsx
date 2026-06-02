"use client";

import { useEffect, useState, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getServers,
  createServer,
  updateServer,
  deleteServer,
  checkServerHealth,
  getCredentials,
} from "@/lib/services";
import Link from "next/link";
import type { Server, CreateServerPayload, ServerHealth, Credential } from "@/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ── Health badge ──────────────────────────────────────────────────────────────

const healthVariantMap: Record<string, "success" | "error" | "warning" | "default"> = {
  healthy: "success",
  unhealthy: "error",
  unreachable: "warning",
};

function HealthBadge({
  health,
  loading,
}: Readonly<{ health: ServerHealth | null; loading: boolean }>) {
  if (loading) return <Badge label="Checking…" variant="default" />;
  if (!health) return null;
  return (
    <Badge
      label={health.status}
      variant={healthVariantMap[health.status] ?? "default"}
    />
  );
}

// ── Server form schema ────────────────────────────────────────────────────────

const serverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535),
  credential_id: z.string().optional(),
  description: z.string().optional(),
});
type ServerForm = z.infer<typeof serverSchema>;

// ── Server form modal ─────────────────────────────────────────────────────────

function ServerFormModal({
  editing,
  onClose,
  onSaved,
}: Readonly<{
  editing: Server | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServerForm>({
    resolver: zodResolver(serverSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          host: editing.host ?? "",
          port: editing.port ?? 22,
          credential_id: editing.credential_id ?? "",
          description: editing.description ?? "",
        }
      : { port: 22 },
  });

  useEffect(() => {
    getCredentials(1, 100)
      .then((res) => {
        setCredentials(res.items ?? []);
        if (editing) {
          reset({
            name: editing.name,
            host: editing.host ?? "",
            port: editing.port ?? 22,
            credential_id: editing.credential_id ?? "",
            description: editing.description ?? "",
          });
        }
      })
      .catch(() => setCredentials([]));
  }, [editing, reset]);

  const onSubmit = async (data: ServerForm) => {
    setError(null);
    const payload: CreateServerPayload = {
      name: data.name,
      host: data.host,
      port: data.port,
      credential_id: data.credential_id || null,
      description: data.description || undefined,
    };
    try {
      if (editing) {
        await updateServer(editing.server_id, payload);
      } else {
        await createServer(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to save server.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? "Edit server" : "Add server"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {error && <Alert variant="error" message={error} />}

          <Input
            label="Server name"
            placeholder="web-server-01"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Host / IP"
                placeholder="example.com"
                error={errors.host?.message}
                {...register("host")}
              />
            </div>
            <Input
              label="Port"
              type="number"
              placeholder="22"
              error={errors.port?.message}
              {...register("port", { valueAsNumber: true })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="credential_id" className="text-sm font-medium text-slate-700">
              Credential{" "}
              <span className="text-xs text-slate-400">(optional)</span>
            </label>
            <Controller
              name="credential_id"
              control={control}
              render={({ field }) => (
                <select
                  id="credential_id"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <option value="">— None —</option>
                  {credentials.map((c) => (
                    <option key={c.credential_id} value={c.credential_id}>
                      {c.name} ({c.credential_type})
                    </option>
                  ))}
                </select>
              )}
            />
            {credentials.length === 0 && (
              <p className="text-xs text-slate-400">
                No credentials yet.{" "}
                <a href="/dashboard/credentials" className="text-blue-600 underline">
                  Create one first.
                </a>
              </p>
            )}
          </div>

          <Input
            label="Description (optional)"
            placeholder="Primary web server"
            {...register("description")}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Add server"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Server | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, ServerHealth>>({});
  const [healthLoading, setHealthLoading] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await getServers();
      setServers(res.items ?? []);
    } catch {
      setError("Failed to load servers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleHealthCheck = async (id: string) => {
    setHealthLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const health = await checkServerHealth(id);
      setHealthMap((prev) => ({ ...prev, [id]: health }));
    } catch {
      setHealthMap((prev) => ({
        ...prev,
        [id]: {
          server_id: id,
          status: "unreachable",
          latency_ms: null,
          os_id: null,
          os_version: null,
          os_name: null,
        },
      }));
    } finally {
      setHealthLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteServer(id);
      setDeleteConfirm(null);
      await fetchServers();
    } catch {
      setError("Failed to delete server.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servers</h1>
          <p className="text-sm text-slate-500">
            Manage your remote servers and SSH connections.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Add server
        </Button>
      </div>

      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <CardSkeleton rows={3} />
      ) : null}

      {!loading && servers.length === 0 && !showForm ? (
        <Card>
          <CardBody className="py-12 text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
              />
            </svg>
            <p className="text-slate-500">No servers registered yet.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              Add your first server
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {!loading && servers.length > 0 ? (
        <div className="grid gap-4">
          {servers.map((server) => (
            <Fragment key={server.server_id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/servers/${server.server_id}`}
                          className="font-semibold text-slate-800 hover:text-blue-600 transition"
                        >
                          {server.name}
                        </Link>
                        <Badge
                          label={server.status}
                          variant={server.status === "active" ? "success" : "default"}
                        />
                        <HealthBadge
                          health={healthMap[server.server_id] ?? null}
                          loading={healthLoading[server.server_id] ?? false}
                        />
                      </div>
                      <p className="text-sm text-slate-500">
                        {server.host}:{server.port} · {server.server_type}
                        {server.credential_id
                          ? ` · cred: ${server.credential_id.slice(0, 8)}…`
                          : ""}
                      </p>
                      {server.description && (
                        <p className="text-xs text-slate-400">{server.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/servers/${server.server_id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleHealthCheck(server.server_id)}
                        loading={healthLoading[server.server_id]}
                      >
                        Health check
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(server);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteConfirm(server.server_id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {healthMap[server.server_id] ? (
                    <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-500">
                      {healthMap[server.server_id].latency_ms === null
                        ? "No latency data"
                        : `${healthMap[server.server_id].latency_ms}ms`}
                      {healthMap[server.server_id].os_name
                        ? ` · ${healthMap[server.server_id].os_name} ${healthMap[server.server_id].os_version ?? ""}`
                        : ""}
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </Fragment>
          ))}
        </div>
      ) : null}

      {showForm ? (
        <ServerFormModal
          editing={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            fetchServers();
          }}
        />
      ) : null}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete server"
          message="This action cannot be undone. The server and its configuration will be permanently removed."
          confirmLabel="Delete server"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
