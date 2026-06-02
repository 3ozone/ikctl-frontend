"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getRepositories,
  createRepository,
  updateRepository,
  deleteRepository,
  syncRepository,
  getCredentials,
} from "@/lib/services";
import type {
  Repository,
  CreateRepositoryPayload,
  UpdateRepositoryPayload,
  Credential,
} from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ── Helpers ──────────────────────────────────────────────────────────────────

const syncStatusVariant: Record<string, "success" | "error" | "warning" | "default"> = {
  synced: "success",
  never_synced: "warning",
  sync_error: "error",
};

// ── Schema ────────────────────────────────────────────────────────────────────

const repoSchema = z.object({
  url: z.string().min(1, "URL is required"),
  ref: z.string().min(1, "Ref (branch/tag) is required"),
  credential_id: z.string().optional(),
});
type RepoFormValues = z.infer<typeof repoSchema>;

// ── Repo form modal ───────────────────────────────────────────────────────────

function RepoFormModal({
  editing,
  onClose,
  onSaved,
}: Readonly<{
  editing: Repository | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RepoFormValues>({
    resolver: zodResolver(repoSchema),
    defaultValues: editing
      ? { url: editing.url, ref: editing.ref, credential_id: editing.credential_id ?? "" }
      : { ref: "main" },
  });

  useEffect(() => {
    getCredentials(1, 100)
      .then((res) => setCredentials(res.items ?? []))
      .catch(() => setCredentials([]));
  }, []);

  const onSubmit = async (data: RepoFormValues) => {
    setError(null);
    const payload: CreateRepositoryPayload | UpdateRepositoryPayload = {
      url: data.url,
      ref: data.ref,
      credential_id: data.credential_id || null,
    };
    try {
      if (editing) {
        await updateRepository(editing.repository_id, payload);
      } else {
        await createRepository(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to save repository.");
    }
  };

  const gitCredOptions = credentials.filter(
    (c) => c.credential_type === "git_https" || c.credential_type === "git_ssh"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? "Edit repository" : "Add repository"}
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
            label="Git URL"
            placeholder="https://github.com/org/infra-kits"
            error={errors.url?.message}
            {...register("url")}
          />

          <Input
            label="Ref (branch or tag)"
            placeholder="main"
            error={errors.ref?.message}
            {...register("ref")}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="repo-credential" className="text-sm font-medium text-slate-700">
              Credential{" "}
              <span className="text-xs text-slate-400">(optional — for private repos)</span>
            </label>
            <Controller
              name="credential_id"
              control={control}
              render={({ field }) => (
                <select
                  id="repo-credential"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <option value="">— None —</option>
                  {gitCredOptions.map((c) => (
                    <option key={c.credential_id} value={c.credential_id}>
                      {c.name} ({c.credential_type})
                    </option>
                  ))}
                </select>
              )}
            />
            {gitCredOptions.length === 0 && (
              <p className="text-xs text-slate-400">
                No Git credentials yet.{" "}
                <a href="/dashboard/credentials" className="text-blue-600 underline">
                  Create one first.
                </a>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Add repository"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KitsPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Repository | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const perPage = 20;

  const load = (p = page) => {
    setLoading(true);
    setError("");
    getRepositories(p, perPage)
      .then((res) => {
        setRepos(res.items ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setError("Failed to load repositories."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await syncRepository(id);
      load(page);
    } catch {
      setError("Sync failed. Check the repository for error details.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRepository(id);
      setDeleteConfirm(null);
      load(page);
    } catch {
      setError("Failed to delete repository.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kits</h1>
          <p className="text-sm text-slate-500">
            Manage Git repositories and their kits.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Add repository
        </Button>
      </div>

      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <Card><CardBody className="!p-0"><TableSkeleton rows={4} cols={5} /></CardBody></Card>
      ) : null}

      {!loading && repos.length === 0 && !showForm ? (
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-slate-500">No repositories yet.</p>
            <Button className="mt-4" onClick={() => { setEditing(null); setShowForm(true); }}>
              Add your first repository
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {!loading && repos.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              Repositories
              <span className="ml-2 text-sm font-normal text-slate-400">({total})</span>
            </h2>
          </CardHeader>
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">URL</th>
                    <th className="px-6 py-3 text-left">Ref</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Last synced</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repos.map((repo) => (
                    <tr key={repo.repository_id} className="hover:bg-slate-50">
                      <td className="max-w-xs truncate px-6 py-3 font-medium text-slate-800">
                        <Link
                          href={`/dashboard/kits/${repo.repository_id}`}
                          className="hover:text-blue-600 transition"
                        >
                          {repo.url}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-slate-500">{repo.ref}</td>
                      <td className="px-6 py-3">
                        <Badge
                          label={repo.sync_status.replace("_", " ")}
                          variant={syncStatusVariant[repo.sync_status] ?? "default"}
                        />
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {repo.last_synced_at
                          ? new Date(repo.last_synced_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSync(repo.repository_id)}
                            loading={syncingId === repo.repository_id}
                          >
                            Sync
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(repo);
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(repo.repository_id)}
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
          </CardBody>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={setPage}
            />
        </Card>
      ) : null}

      {showForm ? (
        <RepoFormModal
          editing={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load(page);
          }}
        />
      ) : null}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete repository"
          message="All discovered kits from this repository will be removed. This action cannot be undone."
          confirmLabel="Delete repository"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}