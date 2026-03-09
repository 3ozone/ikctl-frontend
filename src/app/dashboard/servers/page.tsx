"use client";

import { useEffect, useState } from "react";
import {
  getServers,
  createServer,
  updateServer,
  deleteServer,
  checkServerHealth,
} from "@/lib/services";
import type { Server, CreateServerPayload, ServerHealth } from "@/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const serverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1, "User is required"),
  auth_type: z.enum(["ssh_key", "password"]),
  password: z.string().optional(),
  ssh_key: z.string().optional(),
  description: z.string().optional(),
});
type ServerForm = z.infer<typeof serverSchema>;

function healthBadge(health: ServerHealth | null, loading: boolean) {
  if (loading) return <Badge label="Checking…" variant="default" />;
  if (!health) return null;
  const map = { healthy: "success", unhealthy: "error", unreachable: "warning" } as const;
  return <Badge label={health.status} variant={map[health.status]} />;
}

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
          status: "unreachable",
          message: "Could not connect",
          checked_at: new Date().toISOString(),
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

      {/* Server list */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading servers…</p>
      ) : servers.length === 0 && !showForm ? (
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
            <Button
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              Add your first server
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{server.name}</h3>
                      {healthBadge(
                        healthMap[server.id] ?? null,
                        healthLoading[server.id] ?? false
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {server.user}@{server.host}:{server.port} · {server.auth_type}
                    </p>
                    {server.description && (
                      <p className="text-xs text-slate-400">{server.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleHealthCheck(server.id)}
                      loading={healthLoading[server.id]}
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
                    {deleteConfirm === server.id ? (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(server.id)}
                        >
                          Confirm delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteConfirm(server.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
                {healthMap[server.id] && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-500">
                    {healthMap[server.id].message} ·{" "}
                    {healthMap[server.id].latency_ms != null &&
                      `${healthMap[server.id].latency_ms}ms · `}
                    Checked {new Date(healthMap[server.id].checked_at).toLocaleTimeString()}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
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
      )}
    </div>
  );
}

function ServerFormModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Server | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServerForm>({
    resolver: zodResolver(serverSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          host: editing.host,
          port: editing.port,
          user: editing.user,
          auth_type: editing.auth_type,
          description: editing.description,
        }
      : { port: 22, auth_type: "ssh_key" },
  });

  const authType = watch("auth_type");

  const onSubmit = async (data: ServerForm) => {
    setError(null);
    const payload: CreateServerPayload = {
      name: data.name,
      host: data.host,
      port: data.port,
      user: data.user,
      auth_type: data.auth_type,
      description: data.description,
      password: data.password,
      ssh_key: data.ssh_key,
    };
    try {
      if (editing) {
        await updateServer(editing.id, payload);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                placeholder="192.168.1.100"
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
          <Input
            label="SSH user"
            placeholder="admin"
            error={errors.user?.message}
            {...register("user")}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Auth type</label>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              {...register("auth_type")}
            >
              <option value="ssh_key">SSH key</option>
              <option value="password">Password</option>
            </select>
          </div>
          {authType === "password" && (
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
          )}
          {authType === "ssh_key" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                Private SSH key
              </label>
              <textarea
                rows={4}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                {...register("ssh_key")}
              />
            </div>
          )}
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
