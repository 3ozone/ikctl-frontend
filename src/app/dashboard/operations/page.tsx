"use client";

import { useEffect, useState } from "react";
import { getOperations, getServers, createOperation, getOperation } from "@/lib/services";
import type { Operation, Server } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const KNOWN_KITS = [
  "nginx",
  "docker",
  "td-agent",
  "postgresql",
  "redis",
  "mysql",
  "nodejs",
  "python",
];

const opSchema = z.object({
  server_id: z.string().min(1, "Select a server"),
  kit: z.string().min(1, "Kit name is required"),
  sudo: z.boolean().optional(),
});
type OpForm = z.infer<typeof opSchema>;

function statusBadge(status: Operation["status"]) {
  const map = {
    completed: "success",
    failed: "error",
    in_progress: "info",
    pending: "warning",
  } as const;
  return (
    <Badge
      label={status.replace("_", " ")}
      variant={map[status]}
    />
  );
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Operation | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const fetchOperations = async () => {
    try {
      const res = await getOperations();
      setOperations(res.items ?? []);
    } catch {
      setError("Failed to load operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    getServers().then((res) => setServers(res.items ?? [])).catch(() => {});
  }, []);

  // Poll for in-progress operation
  useEffect(() => {
    if (!pollingId) return;
    const interval = setInterval(async () => {
      try {
        const op = await getOperation(pollingId);
        setOperations((prev) =>
          prev.map((o) => (o.id === pollingId ? op : o))
        );
        if (selected?.id === pollingId) setSelected(op);
        if (op.status === "completed" || op.status === "failed") {
          setPollingId(null);
        }
      } catch {
        setPollingId(null);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingId, selected]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations</h1>
          <p className="text-sm text-slate-500">
            Run kits on your servers and track their progress.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Run operation</Button>
      </div>

      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : operations.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-slate-500">No operations yet.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              Run your first operation
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Operation history</h2>
          </CardHeader>
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Kit</th>
                    <th className="px-6 py-3 text-left">Server</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operations.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">{op.kit}</td>
                      <td className="px-6 py-3 text-slate-500">
                        {op.server_name ?? op.server_id}
                      </td>
                      <td className="px-6 py-3">{statusBadge(op.status)}</td>
                      <td className="px-6 py-3 text-slate-400">
                        {new Date(op.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(op);
                            if (
                              op.status === "pending" ||
                              op.status === "in_progress"
                            ) {
                              setPollingId(op.id);
                            }
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Operation details */}
      {selected && (
        <OperationDetailsModal
          operation={selected}
          onClose={() => {
            setSelected(null);
            setPollingId(null);
          }}
        />
      )}

      {/* Run operation form */}
      {showForm && (
        <RunOperationModal
          servers={servers}
          onClose={() => setShowForm(false)}
          onCreated={(op) => {
            setOperations((prev) => [op, ...prev]);
            setShowForm(false);
            setSelected(op);
            setPollingId(op.id);
          }}
        />
      )}
    </div>
  );
}

function RunOperationModal({
  servers,
  onClose,
  onCreated,
}: {
  servers: Server[];
  onClose: () => void;
  onCreated: (op: Operation) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OpForm>({ resolver: zodResolver(opSchema) });

  const onSubmit = async (data: OpForm) => {
    setError(null);
    try {
      const op = await createOperation({
        server_id: data.server_id,
        kit: data.kit,
        sudo: data.sudo,
      });
      onCreated(op);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to start operation.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Run operation</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {error && <Alert variant="error" message={error} />}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Server</label>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              {...register("server_id")}
            >
              <option value="">Select a server…</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.host})
                </option>
              ))}
            </select>
            {errors.server_id && (
              <p className="text-xs text-red-500">{errors.server_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Kit</label>
            <Input
              list="kit-suggestions"
              placeholder="nginx"
              error={errors.kit?.message}
              {...register("kit")}
            />
            <datalist id="kit-suggestions">
              {KNOWN_KITS.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("sudo")} className="rounded" />
            Run with sudo
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Run
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OperationDetailsModal({
  operation,
  onClose,
}: {
  operation: Operation;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Operation: {operation.kit}
            </h2>
            {statusBadge(operation.status)}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Server</p>
              <p className="font-medium text-slate-800">
                {operation.server_name ?? operation.server_id}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Started</p>
              <p className="font-medium text-slate-800">
                {new Date(operation.created_at).toLocaleString()}
              </p>
            </div>
            {operation.completed_at && (
              <div>
                <p className="text-slate-400">Completed</p>
                <p className="font-medium text-slate-800">
                  {new Date(operation.completed_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {(operation.status === "pending" || operation.status === "in_progress") && (
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Operation is running… Auto-refreshing every 3 seconds.
            </div>
          )}

          {operation.output && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Output
              </p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-green-400">
                {operation.output}
              </pre>
            </div>
          )}

          {operation.error && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-400">
                Error
              </p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-red-950 p-4 text-xs text-red-300">
                {operation.error}
              </pre>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
