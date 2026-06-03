"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPipelineExecution, getServers, getKits } from "@/lib/services";
import type { PipelineExecution, Server, Kit } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const POLL_INTERVAL_MS = 5000;

const TERMINAL_STATUSES = new Set([
  "completed",
  "failed",
  "partial",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function execStatusBadge(status: string) {
  const map: Record<string, { variant: "success" | "error" | "warning" | "info"; label: string }> = {
    completed:        { variant: "success", label: "completed" },
    failed:           { variant: "error",   label: "failed" },
    partial:          { variant: "warning", label: "partial" },
    in_progress:      { variant: "info",    label: "in progress" },
    pending:          { variant: "info",    label: "pending" },
  };
  const cfg = map[status] ?? { variant: "info" as const, label: status };
  return <Badge variant={cfg.variant} label={cfg.label} />;
}

function opStatusBadge(status: string) {
  const map: Record<string, { variant: "success" | "error" | "warning" | "info"; label: string }> = {
    completed:        { variant: "success", label: "completed" },
    failed:           { variant: "error",   label: "failed" },
    cancelled:        { variant: "warning", label: "cancelled" },
    cancelled_unsafe: { variant: "error",   label: "cancelled (unsafe)" },
    in_progress:      { variant: "info",    label: "in progress" },
    pending:          { variant: "info",    label: "pending" },
  };
  const cfg = map[status] ?? { variant: "info" as const, label: status };
  return <Badge variant={cfg.variant} label={cfg.label} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelineExecutionDetailPage() {
  const params = useParams<{ id: string; exec_id: string }>();
  const pipelineId = params.id;
  const execId = params.exec_id;

  const [execution, setExecution] = useState<PipelineExecution | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const serverName = useCallback(
    (sid: string) => servers.find((s) => s.server_id === sid)?.name ?? sid,
    [servers]
  );
  const kitName = useCallback(
    (kid: string) => {
      const k = kits.find((k) => k.kit_id === kid);
      return k ? `${k.name}${k.version ? ` (${k.version})` : ""}` : kid;
    },
    [kits]
  );

  // ── Fetch execution ───────────────────────────────────────────────────────

  const fetchExecution = useCallback(async () => {
    try {
      const exec = await getPipelineExecution(pipelineId, execId);
      setExecution(exec);

      // Stop polling when terminal
      if (TERMINAL_STATUSES.has(exec.status)) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch {
      // silently ignore poll errors; initial error handled below
    }
  }, [pipelineId, execId]);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [exec, serversData, kitsData] = await Promise.all([
          getPipelineExecution(pipelineId, execId),
          getServers(1, 100),
          getKits(1, 50),
        ]);
        setExecution(exec);
        setServers(serversData.items ?? []);
        setKits(kitsData.items ?? []);

        // Start polling if not terminal
        if (!TERMINAL_STATUSES.has(exec.status)) {
          pollingRef.current = setInterval(fetchExecution, POLL_INTERVAL_MS);
        }
      } catch {
        setLoadError("Failed to load execution.");
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId, execId]);

  // ── Render ────────────────────────────────────────────────────────────────

  const isActive =
    execution?.status === "pending" || execution?.status === "in_progress";

  const completedOps = execution?.operations.filter(
    (o) => o.status === "completed"
  ).length ?? 0;
  const failedOps = execution?.operations.filter(
    (o) => o.status === "failed" || o.status === "cancelled_unsafe"
  ).length ?? 0;
  const totalOps = execution?.operations.length ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (loadError || !execution) {
    return (
      <div className="space-y-4">
        <Alert variant="error" message={loadError ?? "Execution not found."} />
        <Link href={`/dashboard/pipelines/${pipelineId}`}>
          <Button variant="secondary">Back to pipeline</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href={`/dashboard/pipelines/${pipelineId}`}
            className="mt-1 text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Execution</h1>
              {execStatusBadge(execution.status)}
              {isActive && (
                <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
            </div>
            <p className="text-sm text-slate-400 font-mono">{execution.execution_id}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardBody className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{totalOps}</p>
            <p className="text-xs text-slate-400 mt-1">Total ops</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{completedOps}</p>
            <p className="text-xs text-slate-400 mt-1">Completed</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4 text-center">
            <p className="text-2xl font-bold text-red-500">{failedOps}</p>
            <p className="text-xs text-slate-400 mt-1">Failed</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-800">
              {totalOps - completedOps - failedOps}
            </p>
            <p className="text-xs text-slate-400 mt-1">Pending / running</p>
          </CardBody>
        </Card>
      </div>

      {/* Timestamps */}
      <Card>
        <CardBody className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Launched
            </p>
            <p className="mt-0.5 text-slate-700">
              {new Date(execution.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Finished
            </p>
            <p className="mt-0.5 text-slate-700">
              {execution.finished_at
                ? new Date(execution.finished_at).toLocaleString()
                : <span className="italic text-slate-400">—</span>}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Operations */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">
            Operations{" "}
            <span className="text-sm font-normal text-slate-400">
              ({totalOps})
            </span>
          </h2>
          {isActive && (
            <p className="text-xs text-blue-500">
              Auto-refreshing every 5 seconds…
            </p>
          )}
        </CardHeader>
        <CardBody className="!p-0">
          {execution.operations.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No operations yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Server</th>
                    <th className="px-6 py-3 text-left">Kit</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {execution.operations.map((op) => (
                    <tr key={op.operation_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        {opStatusBadge(op.status)}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {serverName(op.server_id)}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {kitName(op.kit_id)}
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/operations?highlight=${op.operation_id}`}>
                          <Button variant="ghost" size="sm">
                            View operation
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
