"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPipelines, deletePipeline } from "@/lib/services";
import type { Pipeline } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(value: boolean, label: string) {
  return value ? (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      {label}
    </span>
  ) : null;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<Pipeline | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPipelines = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPipelines(p, PAGE_SIZE);
      setPipelines(res.items ?? []);
      setTotalPages(Math.ceil((res.total ?? 0) / (res.per_page ?? PAGE_SIZE)));
    } catch {
      setError("Failed to load pipelines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePage = (p: number) => {
    setPage(p);
    fetchPipelines(p);
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deletePipeline(deleting.pipeline_id);
      setPipelines((prev) => prev.filter((p) => p.pipeline_id !== deleting.pipeline_id));
      setDeleting(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      if (e?.response?.status === 409) {
        setDeleteError("Cannot delete: the pipeline has executions in progress.");
      } else {
        setDeleteError(e?.response?.data?.message ?? "Failed to delete pipeline.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipelines</h1>
          <p className="text-sm text-slate-500">
            Run a sequence of kits across multiple servers.
          </p>
        </div>
        <Link href="/dashboard/pipelines/new">
          <Button>+ New pipeline</Button>
        </Link>
      </div>

      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <Card>
          <CardBody className="!p-0">
            <TableSkeleton rows={4} cols={5} />
          </CardBody>
        </Card>
      ) : pipelines.length === 0 ? (
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
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            <p className="text-slate-500">No pipelines yet.</p>
            <Link href="/dashboard/pipelines/new">
              <Button className="mt-4">Create your first pipeline</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Your pipelines</h2>
          </CardHeader>
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-left">Targets</th>
                    <th className="px-6 py-3 text-left">Kits</th>
                    <th className="px-6 py-3 text-left">Flags</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pipelines.map((p) => (
                    <tr key={p.pipeline_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        <Link
                          href={`/dashboard/pipelines/${p.pipeline_id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 max-w-xs truncate text-slate-400">
                        {p.description ?? <span className="italic">—</span>}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {p.targets.length}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {p.kits.length}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {statusBadge(p.sudo, "sudo")}
                          {p.debug_level !== "none" && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {p.debug_level}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/pipelines/${p.pipeline_id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          <Link href={`/dashboard/pipelines/${p.pipeline_id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(p);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
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

      {/* Delete confirmation */}
      {deleting && (
        <ConfirmDialog
          title="Delete pipeline"
          message={
            <>
              Delete <strong>{deleting.name}</strong>? This cannot be undone.
              {deleteError && (
                <span className="mt-2 block text-red-600">{deleteError}</span>
              )}
            </>
          }
          confirmLabel="Delete"
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setDeleting(null);
            setDeleteError(null);
          }}
        />
      )}
    </div>
  );
}
