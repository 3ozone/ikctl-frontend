"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getOperations, getServers, createOperation, getOperation, cancelOperation, retryOperation, restoreOperation, getKits } from "@/lib/services";
import type { Operation, Server, Kit } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Pagination } from "@/components/ui/Pagination";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TableSkeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 20;
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "cancelled_unsafe", label: "Cancelled (unsafe)" },
];

const opSchema = z.object({
  server_id: z.string().min(1, "Select a server"),
  kit: z.string().min(1, "Select a kit"),
  sudo: z.boolean().optional(),
  debug_level: z.enum(["none", "errors", "full"]).optional(),
});
type OpForm = z.infer<typeof opSchema>;

function statusBadge(status: Operation["status"]) {
  const map: Record<Operation["status"], "success" | "error" | "info" | "warning"> = {
    completed: "success",
    failed: "error",
    in_progress: "info",
    pending: "warning",
    cancelled: "warning",
    cancelled_unsafe: "error",
  };
  return <Badge label={status.replace(/_/g, " ")} variant={map[status]} />;
}

function OperationsPageInner() {
  const searchParams = useSearchParams();
  const preselectedKitId = searchParams.get("kit_id");
  const [operations, setOperations] = useState<Operation[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!!preselectedKitId);
  const [selected, setSelected] = useState<Operation | null>(null);
  const [pollingId, setPollingId] = useState<string | null>(null);

  // Lookup maps for display names
  const serverName = (id: string) =>
    servers.find((s) => s.server_id === id)?.name ?? id;
  const kitName = (id: string) =>
    kits.find((k) => k.kit_id === id)?.name ?? id;

  // Filters & pagination
  const [filterServer, setFilterServer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOperations = async (
    p = page,
    srv = filterServer,
    st = filterStatus,
  ) => {
    setLoading(true);
    try {
      const filters: { server_id?: string; status?: string } = {};
      if (srv) filters.server_id = srv;
      if (st) filters.status = st;
      const res = await getOperations(p, PAGE_SIZE, filters);
      setOperations(res.items ?? []);
      setTotalPages(Math.ceil((res.total ?? 0) / (res.per_page ?? PAGE_SIZE)));
    } catch {
      setError("Failed to load operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations(1, "", "");
    getServers().then((res) => setServers(res.items ?? [])).catch(() => {});
    getKits(1, 50).then((res) => setKits(res.items ?? [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterServer = (v: string) => {
    setFilterServer(v);
    setPage(1);
    fetchOperations(1, v, filterStatus);
  };

  const handleFilterStatus = (v: string) => {
    setFilterStatus(v);
    setPage(1);
    fetchOperations(1, filterServer, v);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchOperations(p, filterServer, filterStatus);
  };

  // Poll for in-progress operation
  useEffect(() => {
    if (!pollingId) return;
    const interval = setInterval(async () => {
      try {
        const op = await getOperation(pollingId);
        setOperations((prev) =>
          prev.map((o) => (o.operation_id === pollingId ? op : o))
        );
        if (selected?.operation_id === pollingId) setSelected(op);
        const TERMINAL = ["completed", "failed", "cancelled", "cancelled_unsafe"];
        if (TERMINAL.includes(op.status)) {
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterServer}
          onChange={(e) => handleFilterServer(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All servers</option>
          {servers.map((s) => (
            <option key={s.server_id} value={s.server_id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => handleFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Card><CardBody className="!p-0"><TableSkeleton rows={5} cols={5} /></CardBody></Card>
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
                    <tr key={op.operation_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">{kitName(op.kit_id)}</td>
                      <td className="px-6 py-3 text-slate-500">
                        {serverName(op.server_id)}
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
                              setPollingId(op.operation_id);
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
            <Pagination page={page} totalPages={totalPages} onPage={handlePage} />
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
          onUpdate={(updatedOp) => {
            setOperations((prev) =>
              prev.map((o) => (o.operation_id === updatedOp.operation_id ? updatedOp : o))
            );
            setSelected(updatedOp);
            setPollingId(null);
          }}
          onRetried={(newOp) => {
            setOperations((prev) => [newOp, ...prev]);
            setSelected(newOp);
            setPollingId(newOp.operation_id);
          }}
        />
      )}

      {/* Run operation form */}
      {showForm && (
        <RunOperationModal
          servers={servers}
          kits={kits}
          initialKitId={preselectedKitId ?? undefined}
          onClose={() => setShowForm(false)}
          onCreated={(op) => {
            setOperations((prev) => [op, ...prev]);
            setShowForm(false);
            setSelected(op);
            setPollingId(op.operation_id);
          }}
        />
      )}
    </div>
  );
}

function RunOperationModal({
  servers,
  kits,
  initialKitId,
  onClose,
  onCreated,
}: {
  servers: Server[];
  kits: Kit[];
  initialKitId?: string;
  onClose: () => void;
  onCreated: (op: Operation) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [kitValues, setKitValues] = useState<Record<string, string>>(() => {
    if (!initialKitId) return {};
    const kit = kits.find((k) => k.kit_id === initialKitId && !k.is_deleted);
    if (!kit?.values) return {};
    return Object.fromEntries(
      Object.entries(kit.values).map(([k, v]) => [k, String(v ?? "")])
    );
  });
  const availableKits = kits.filter((k) => !k.is_deleted);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OpForm>({
    resolver: zodResolver(opSchema),
    defaultValues: { kit: initialKitId ?? "" },
  });

  const watchedKitId = useWatch({ control, name: "kit" });

  useEffect(() => {
    const kit = availableKits.find((k) => k.kit_id === watchedKitId);
    if (kit?.values && Object.keys(kit.values).length > 0) {
      setKitValues(
        Object.fromEntries(
          Object.entries(kit.values).map(([k, v]) => [k, String(v ?? "")])
        )
      );
    } else {
      setKitValues({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedKitId]);

  const onSubmit = async (data: OpForm) => {
    setError(null);
    try {
      const op = await createOperation({
        server_id: data.server_id,
        kit_id: data.kit,
        sudo: data.sudo,
        debug_level: data.debug_level,
        values: Object.keys(kitValues).length > 0 ? kitValues : undefined,
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
                <option key={s.server_id} value={s.server_id}>
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
            {availableKits.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                No synced kits available.{" "}
                <Link href="/dashboard/kits" className="text-blue-600 underline">
                  Sync a repository first.
                </Link>
              </p>
            ) : (
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register("kit")}
              >
                <option value="">Select a kit…</option>
                {availableKits.map((k) => (
                  <option key={k.kit_id} value={k.kit_id}>
                    {k.name}{k.version ? ` v${k.version}` : ""}
                  </option>
                ))}
              </select>
            )}
            {errors.kit && (
              <p className="text-xs text-red-500">{errors.kit.message}</p>
            )}
          </div>

          {/* Kit parameters — shown only when the selected kit has values */}
          {Object.keys(kitValues).length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Parameters</label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                {Object.entries(kitValues).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-1/3 shrink-0 font-mono text-xs text-slate-500 truncate" title={key}>
                      {key}
                    </span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setKitValues((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="flex-1 min-w-0 rounded border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("sudo")} className="rounded" />
            Run with sudo
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Debug level</label>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              {...register("debug_level")}
            >
              <option value="none">None</option>
              <option value="errors">Errors only</option>
              <option value="full">Full</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={availableKits.length === 0}>
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
  onUpdate,
  onRetried,
}: {
  operation: Operation;
  onClose: () => void;
  onUpdate: (op: Operation) => void;
  onRetried: (op: Operation) => void;
}) {
  const [actionLoading, setActionLoading] = useState<"cancel" | "retry" | "restore" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [restoreFiles, setRestoreFiles] = useState<string[] | null>(null);

  const canCancel = operation.status === "pending" || operation.status === "in_progress";
  const canRetry = operation.status === "failed" || operation.status === "cancelled_unsafe";
  const canRestore = canRetry && (operation.backup_files?.length ?? 0) > 0;

  const handleCancel = async () => {
    setActionLoading("cancel");
    setActionError(null);
    try {
      const updated = await cancelOperation(operation.operation_id);
      onUpdate(updated);
    } catch {
      setActionError("Failed to cancel operation.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async () => {
    setActionLoading("retry");
    setActionError(null);
    try {
      const newOp = await retryOperation(operation.operation_id);
      onRetried(newOp);
    } catch {
      setActionError("Failed to retry operation.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async () => {
    setActionLoading("restore");
    setActionError(null);
    setRestoreFiles(null);
    try {
      const result = await restoreOperation(operation.operation_id);
      setRestoreFiles(result.restored_files);
    } catch {
      setActionError("Failed to start restore.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Operation: {operation.kit_id}
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
            {operation.finished_at && (
              <div>
                <p className="text-slate-400">Completed</p>
                <p className="font-medium text-slate-800">
                  {new Date(operation.finished_at).toLocaleString()}
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

          {actionError && (
            <Alert variant="error" message={actionError} />
          )}

          {restoreFiles !== null && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Restore queued for {restoreFiles.length} file{restoreFiles.length !== 1 ? "s" : ""}
              {restoreFiles.length > 0 && (
                <ul className="mt-1 list-inside list-disc font-mono text-xs">
                  {restoreFiles.map((f) => <li key={f}>{f}</li>)}
                </ul>
              )}
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
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <div className="flex gap-2">
            {canCancel && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                loading={actionLoading === "cancel"}
                disabled={!!actionLoading}
              >
                Cancel operation
              </Button>
            )}
            {canRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                loading={actionLoading === "retry"}
                disabled={!!actionLoading}
              >
                Retry
              </Button>
            )}
            {canRestore && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRestore}
                loading={actionLoading === "restore"}
                disabled={!!actionLoading || restoreFiles !== null}
              >
                Restore backup
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OperationsPage() {
  return (
    <Suspense>
      <OperationsPageInner />
    </Suspense>
  );
}
