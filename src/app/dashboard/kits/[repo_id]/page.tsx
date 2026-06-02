"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getRepository,
  getKits,
  syncRepository,
  deleteRepository,
} from "@/lib/services";
import type { Repository, Kit } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const syncStatusVariant: Record<string, "success" | "error" | "warning" | "default"> = {
  synced: "success",
  never_synced: "warning",
  sync_error: "error",
};

export default function RepoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.repo_id as string;

  const [repo, setRepo] = useState<Repository | null>(null);
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsTotal, setKitsTotal] = useState(0);
  const [kitsPage, setKitsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number; deleted: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const kitsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(kitsTotal / kitsPerPage));

  useEffect(() => {
    getRepository(id)
      .then(setRepo)
      .catch(() => setError("Failed to load repository."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getKits(kitsPage, kitsPerPage, { repository_id: id })
      .then((res) => {
        setKits(res.items ?? []);
        setKitsTotal(res.total ?? 0);
      })
      .catch(() => {});
  }, [id, kitsPage]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncRepository(id);
      setSyncResult({
        created: result.kits_created,
        updated: result.kits_updated,
        deleted: result.kits_deleted,
      });
      const updated = await getRepository(id);
      setRepo(updated);
      const kitsRes = await getKits(1, kitsPerPage, { repository_id: id });
      setKits(kitsRes.items ?? []);
      setKitsTotal(kitsRes.total ?? 0);
    } catch {
      setError("Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRepository(id);
      router.push("/dashboard/kits");
    } catch {
      setError("Failed to delete repository.");
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error && !repo) {
    return (
      <div className="space-y-4">
        <Alert variant="error" message={error ?? "Repository not found."} />
        <Button variant="secondary" onClick={() => router.push("/dashboard/kits")}>
          Back to kits
        </Button>
      </div>
    );
  }

  if (!repo) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/kits"
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{repo.url}</h1>
          <p className="text-sm text-slate-500">
            Ref: <span className="font-medium">{repo.ref}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSync} loading={syncing}>
            Sync
          </Button>
          <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteConfirm(true)}>
            Delete
          </Button>
        </div>
      </div>

      {error && <Alert variant="error" message={error} />}

      {/* Sync result */}
      {syncResult && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-700">
              Sync completed:{" "}
              <strong>{syncResult.created}</strong> kits created,{" "}
              <strong>{syncResult.updated}</strong> updated,{" "}
              <strong>{syncResult.deleted}</strong> deleted.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Repo info */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Repository details</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-400">Status</p>
              <Badge
                label={repo.sync_status.replace("_", " ")}
                variant={syncStatusVariant[repo.sync_status] ?? "default"}
              />
            </div>
            <div>
              <p className="text-slate-400">Last synced</p>
              <p className="text-slate-800">
                {repo.last_synced_at
                  ? new Date(repo.last_synced_at).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Last commit</p>
              <p className="font-mono text-xs text-slate-800">
                {repo.last_commit_sha ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Credential</p>
              <p className="text-slate-800">
                {repo.credential_id
                  ? `${repo.credential_id.slice(0, 8)}…`
                  : "None (public)"}
              </p>
            </div>
          </div>
          {repo.sync_error_message && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {repo.sync_error_message}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Kits */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">
            Kits
            {kitsTotal > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">({kitsTotal})</span>
            )}
          </h2>
        </CardHeader>
        <CardBody className="!p-0">
          {kits.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-400">
                No kits discovered yet. Sync the repository to discover kits.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Path</th>
                    <th className="px-6 py-3 text-left">Version</th>
                    <th className="px-6 py-3 text-left">Tags</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kits.map((kit) => (
                    <tr key={kit.kit_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {kit.name}
                        {kit.sync_status === "sync_error" && (
                          <span className="ml-2 text-xs text-red-500">{kit.sync_error_message}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">
                        {kit.path_in_repo}
                      </td>
                      <td className="px-6 py-3 text-slate-500">{kit.version || "—"}</td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {kit.tags.map((tag) => (
                            <Badge key={tag} label={tag} variant="default" />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          href={`/dashboard/operations?kit_id=${kit.kit_id}`}
                        >
                          <Button variant="ghost" size="sm">
                            Use in operation
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
        <Pagination
          page={kitsPage}
          totalPages={totalPages}
          onPage={setKitsPage}
        />
      </Card>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete repository"
          message={`"${repo.url}" and all its discovered kits will be permanently removed.`}
          confirmLabel="Delete repository"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
}