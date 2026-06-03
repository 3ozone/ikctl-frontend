"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getGroups,
  getServers,
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/lib/services";
import type { Group, Server } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const PAGE_SIZE = 20;

// ── Schema ────────────────────────────────────────────────────────────────────

const groupSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1024).optional(),
});
type GroupForm = z.infer<typeof groupSchema>;

// ── Group form modal ──────────────────────────────────────────────────────────

function GroupFormModal({
  editing,
  servers,
  onClose,
  onSaved,
}: Readonly<{
  editing: Group | null;
  servers: Server[];
  onClose: () => void;
  onSaved: (group: Group) => void;
}>) {
  const [error, setError] = useState<string | null>(null);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>(
    editing?.server_ids ?? []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: editing
      ? { name: editing.name, description: editing.description ?? "" }
      : {},
  });

  const toggleServer = (id: string) => {
    setSelectedServerIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: GroupForm) => {
    setError(null);
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        server_ids: selectedServerIds,
      };
      let saved: Group;
      if (editing) {
        saved = await updateGroup(editing.group_id, payload);
      } else {
        saved = await createGroup(payload);
      }
      onSaved(saved);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to save group.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? "Edit group" : "New group"}
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
            label="Name"
            placeholder="k8s-nodes"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Description <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of this group…"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none"
              {...register("description")}
            />
          </div>

          {/* Server picker */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Servers{" "}
              <span className="font-normal text-slate-400">
                ({selectedServerIds.length} selected)
              </span>
            </label>
            {servers.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                No servers available.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {servers.map((s) => (
                  <label
                    key={s.server_id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedServerIds.includes(s.server_id)}
                      onChange={() => toggleServer(s.server_id)}
                      className="rounded"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="truncate text-xs text-slate-400">{s.host}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const serverName = (id: string) =>
    servers.find((s) => s.server_id === id)?.name ?? id;

  const fetchGroups = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getGroups(p, PAGE_SIZE);
      setGroups(res.items ?? []);
      setTotalPages(Math.ceil((res.total ?? 0) / (res.per_page ?? PAGE_SIZE)));
    } catch {
      setError("Failed to load groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups(1);
    getServers(1, 100).then((res) => setServers(res.items ?? [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePage = (p: number) => {
    setPage(p);
    fetchGroups(p);
  };

  const handleSaved = (group: Group) => {
    if (editing) {
      setGroups((prev) => prev.map((g) => (g.group_id === group.group_id ? group : g)));
    } else {
      setGroups((prev) => [group, ...prev]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteGroup(deleting.group_id);
      setGroups((prev) => prev.filter((g) => g.group_id !== deleting.group_id));
      setDeleting(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDeleteError(e?.response?.data?.message ?? "Failed to delete group.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Groups</h1>
          <p className="text-sm text-slate-500">
            Organize servers into groups for pipeline targeting.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          + New group
        </Button>
      </div>

      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <Card><CardBody className="!p-0"><TableSkeleton rows={4} cols={4} /></CardBody></Card>
      ) : groups.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-slate-500">No groups yet.</p>
            <Button className="mt-4" onClick={() => { setEditing(null); setShowForm(true); }}>
              Create your first group
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Server groups</h2>
          </CardHeader>
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Servers</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groups.map((g) => (
                    <tr key={g.group_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">{g.name}</td>
                      <td className="px-6 py-3 text-slate-500">
                        {g.server_ids.length === 0 ? (
                          <span className="text-slate-400 italic">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {g.server_ids.slice(0, 3).map((id) => (
                              <span
                                key={id}
                                className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                              >
                                {serverName(id)}
                              </span>
                            ))}
                            {g.server_ids.length > 3 && (
                              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                                +{g.server_ids.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {g.description ?? <span className="italic">—</span>}
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {new Date(g.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditing(g); setShowForm(true); }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setDeleteError(null); setDeleting(g); }}
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

      {/* Form modal */}
      {showForm && (
        <GroupFormModal
          editing={editing}
          servers={servers}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <ConfirmDialog
          title="Delete group"
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
          onCancel={() => { setDeleting(null); setDeleteError(null); }}
        />
      )}
    </div>
  );
}
