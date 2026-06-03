"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPipeline,
  getPipelineStatus,
  getPipelineHistory,
  launchPipeline,
  deletePipeline,
  getServers,
  getGroups,
  getKits,
} from "@/lib/services";
import type {
  Pipeline,
  PipelineExecution,
  PipelineExecutionSummary,
  Server,
  Kit,
  Group,
} from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function execStatusBadge(status: string) {
  const map: Record<string, { variant: "success" | "error" | "warning" | "info"; label: string }> = {
    completed:   { variant: "success", label: "completed" },
    failed:      { variant: "error",   label: "failed" },
    partial:     { variant: "warning", label: "partial" },
    in_progress: { variant: "info",    label: "in progress" },
    pending:     { variant: "info",    label: "pending" },
  };
  const cfg = map[status] ?? { variant: "info" as const, label: status };
  return <Badge variant={cfg.variant} label={cfg.label} />;
}

function debugBadge(level: string) {
  if (level === "none") return null;
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {level}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelineDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [currentExec, setCurrentExec] = useState<PipelineExecution | null>(null);
  const [history, setHistory] = useState<PipelineExecutionSummary[]>([]);
  const [histPage, setHistPage] = useState(1);
  const [histTotalPages, setHistTotalPages] = useState(1);
  const [histLoading, setHistLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const targetInfo = useCallback(
    (tid: string): { name: string; isGroup: boolean } => {
      const server = servers.find((s) => s.server_id === tid);
      if (server) return { name: server.name, isGroup: false };
      const group = groups.find((g) => g.group_id === tid);
      if (group) return { name: group.name, isGroup: true };
      return { name: tid, isGroup: false };
    },
    [servers, groups]
  );
  const kitName = useCallback(
    (kid: string) => {
      const k = kits.find((k) => k.kit_id === kid);
      return k ? `${k.name}${k.version ? ` (${k.version})` : ""}` : kid;
    },
    [kits]
  );

  // ── Load history ─────────────────────────────────────────────────────────────

  const loadHistory = useCallback(
    async (p: number) => {
      setHistLoading(true);
      try {
        const res = await getPipelineHistory(id, p, PAGE_SIZE);
        setHistory(res.items ?? []);
        setHistTotalPages(
          Math.ceil((res.total ?? 0) / (res.per_page ?? PAGE_SIZE))
        );
      } catch {
        // silently ignore history load errors
      } finally {
        setHistLoading(false);
      }
    },
    [id]
  );

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [pipelineData, serversData, groupsData, kitsData] = await Promise.all([
          getPipeline(id),
          getServers(1, 100),
          getGroups(1, 100),
          getKits(1, 50),
        ]);
        setPipeline(pipelineData);
        setServers(serversData.items ?? []);
        setGroups(groupsData.items ?? []);
        setKits(kitsData.items ?? []);

        // Current execution status (may 404 if none yet)
        try {
          const exec = await getPipelineStatus(id);
          setCurrentExec(exec);
        } catch {
          // No executions yet
        }

        await loadHistory(1);
      } catch {
        setLoadError("Failed to load pipeline.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Launch ───────────────────────────────────────────────────────────────────

  const handleLaunch = async () => {
    setLaunching(true);
    setLaunchError(null);
    try {
      const exec = await launchPipeline(id);
      router.push(`/dashboard/pipelines/${id}/executions/${exec.execution_id}`);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (e?.response?.status === 409) {
        setLaunchError("Cannot launch: the pipeline already has an execution in progress.");
      } else {
        setLaunchError(e?.response?.data?.message ?? "Failed to launch pipeline.");
      }
      setLaunching(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deletePipeline(id);
      router.push("/dashboard/pipelines");
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (e?.response?.status === 409) {
        setDeleteError("Cannot delete: the pipeline has executions in progress.");
      } else {
        setDeleteError(e?.response?.data?.message ?? "Failed to delete pipeline.");
      }
      setDeleteLoading(false);
    }
  };

  const handleHistPage = (p: number) => {
    setHistPage(p);
    loadHistory(p);
  };

  // ── Active execution ─────────────────────────────────────────────────────────

  const isActive =
    currentExec?.status === "pending" || currentExec?.status === "in_progress";

  // ── Render ───────────────────────────────────────────────────────────────────

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

  if (loadError || !pipeline) {
    return (
      <div className="space-y-4">
        <Alert variant="error" message={loadError ?? "Pipeline not found."} />
        <Link href="/dashboard/pipelines">
          <Button variant="secondary">Back to pipelines</Button>
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
            href="/dashboard/pipelines"
            className="mt-1 text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{pipeline.name}</h1>
            {pipeline.description && (
              <p className="text-sm text-slate-500">{pipeline.description}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/dashboard/pipelines/${id}/edit`}>
            <Button variant="secondary" size="sm" disabled={isActive}>
              Edit
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setDeleteError(null); setDeleting(true); }}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </Button>
          <Button
            onClick={handleLaunch}
            loading={launching}
            disabled={isActive}
          >
            {isActive ? "Running…" : "Run pipeline"}
          </Button>
        </div>
      </div>

      {launchError && <Alert variant="error" message={launchError} />}

      {/* Active execution banner */}
      {isActive && currentExec && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Execution in progress — editing is disabled.</span>
          </div>
          <Link
            href={`/dashboard/pipelines/${id}/executions/${currentExec.execution_id}`}
            className="ml-4 shrink-0 font-medium underline hover:no-underline"
          >
            View execution
          </Link>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Targets */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              Targets{" "}
              <span className="text-sm font-normal text-slate-400">
                ({pipeline.targets.length})
              </span>
            </h2>
          </CardHeader>
          <CardBody>
            {pipeline.targets.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No targets.</p>
            ) : (
              <ul className="space-y-1">
                {pipeline.targets.map((t) => {
                  const { name, isGroup } = targetInfo(t.server_id);
                  return (
                    <li
                      key={t.server_id}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      {isGroup ? (
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                        </svg>
                      )}
                      <span>{name}</span>
                      {isGroup && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                          group
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Global settings */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Global settings</h2>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sudo</span>
              {pipeline.sudo ? (
                <Badge variant="info" label="enabled" />
              ) : (
                <span className="text-slate-400">disabled</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Debug level</span>
              {debugBadge(pipeline.debug_level) ?? (
                <span className="text-slate-400">none</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Created</span>
              <span className="text-slate-700">
                {new Date(pipeline.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Updated</span>
              <span className="text-slate-700">
                {new Date(pipeline.updated_at).toLocaleDateString()}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Kits */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">
            Kits{" "}
            <span className="text-sm font-normal text-slate-400">
              ({pipeline.kits.length} — run in order)
            </span>
          </h2>
        </CardHeader>
        <CardBody>
          {pipeline.kits.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No kits configured.</p>
          ) : (
            <ol className="space-y-2">
              {pipeline.kits.map((k, idx) => (
                <li
                  key={`${k.kit_id}-${idx}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {kitName(k.kit_id)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {k.sudo !== null && k.sudo !== undefined && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          sudo: {String(k.sudo)}
                        </span>
                      )}
                      {k.debug_level && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          debug: {k.debug_level}
                        </span>
                      )}
                      {k.values && Object.keys(k.values).length > 0 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {Object.keys(k.values).length} value{Object.keys(k.values).length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>

      {/* Execution history */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Execution history</h2>
        </CardHeader>
        <CardBody className="!p-0">
          {histLoading ? (
            <div className="p-4">
              <TableSkeleton rows={3} cols={5} />
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">No executions yet.</p>
              <Button className="mt-3" onClick={handleLaunch} loading={launching}>
                Run now
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Operations</th>
                      <th className="px-6 py-3 text-left">Launched</th>
                      <th className="px-6 py-3 text-left">Finished</th>
                      <th className="px-6 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((exec) => (
                      <tr key={exec.execution_id} className="hover:bg-slate-50">
                        <td className="px-6 py-3">
                          {execStatusBadge(exec.status)}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          <span className="text-green-600 font-medium">
                            {exec.completed_operations}
                          </span>
                          {" / "}
                          {exec.total_operations}
                          {exec.failed_operations > 0 && (
                            <span className="ml-1 text-red-500">
                              ({exec.failed_operations} failed)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-400">
                          {new Date(exec.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-slate-400">
                          {exec.finished_at
                            ? new Date(exec.finished_at).toLocaleString()
                            : <span className="italic">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          <Link
                            href={`/dashboard/pipelines/${id}/executions/${exec.execution_id}`}
                          >
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={histPage}
                totalPages={histTotalPages}
                onPage={handleHistPage}
              />
            </>
          )}
        </CardBody>
      </Card>

      {/* Delete confirmation */}
      {deleting && (
        <ConfirmDialog
          title="Delete pipeline"
          message={
            <>
              Delete <strong>{pipeline.name}</strong>? This cannot be undone.
              {deleteError && (
                <span className="mt-2 block text-red-600">{deleteError}</span>
              )}
            </>
          }
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setDeleting(false); setDeleteError(null); }}
        />
      )}
    </div>
  );
}
