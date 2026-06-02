"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getCredentials,
  createCredential,
  updateCredential,
  deleteCredential,
} from "@/lib/services";
import type { Credential, CreateCredentialPayload, UpdateCredentialPayload } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(["ssh", "git_https", "git_ssh"]),
  username: z.string().max(255).optional(),
  password: z.string().max(1024).optional(),
  private_key: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;

// ── Helpers ──────────────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  ssh: "SSH",
  git_https: "Git HTTPS",
  git_ssh: "Git SSH",
};

// ── Credential form modal ────────────────────────────────────────────────────

function CredentialFormModal({
  editing,
  onClose,
  onSaved,
}: Readonly<{
  editing: Credential | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [error, setError] = useState<string | null>(null);

  const isCreate = !editing;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: editing
      ? { name: editing.name, type: editing.credential_type, username: editing.username ?? "" }
      : { type: "ssh" },
  });

  const selectedType = useWatch({ control, name: "type" }) as string;
  const credType = isCreate ? selectedType : editing?.credential_type;
  const showUsername = credType === "ssh" || credType === "git_https";
  const showPassword = credType === "ssh" || credType === "git_https";
  const showPrivateKey = credType === "ssh" || credType === "git_ssh";

  const onSubmit = async (data: CreateFormValues) => {
    setError(null);
    try {
if (editing) {
      const payload: UpdateCredentialPayload = {
        name: data.name,
        username: data.username || undefined,
        password: data.password || undefined,
        private_key: data.private_key || undefined,
      };
      await updateCredential(editing.credential_id, payload);
    } else {
      const payload: CreateCredentialPayload = {
        name: data.name,
        type: data.type,
        username: data.username || undefined,
        password: data.password || undefined,
        private_key: data.private_key || undefined,
      };
      await createCredential(payload);
    }
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Failed to save credential.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? "Edit credential" : "Add credential"}
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
            label="Name / Alias"
            placeholder="my-ssh-key"
            error={errors.name?.message}
            {...register("name")}
          />

          {isCreate && (
            <div className="flex flex-col gap-1">
              <label htmlFor="cred-type" className="text-sm font-medium text-slate-700">
                Type
              </label>
              <select
                id="cred-type"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                {...register("type")}
              >
                <option value="ssh">SSH</option>
                <option value="git_https">Git HTTPS</option>
                <option value="git_ssh">Git SSH</option>
              </select>
            </div>
          )}

          {!isCreate && (
            <div className="flex items-center gap-2">
              <Badge
                label={typeLabels[editing.credential_type] ?? editing.credential_type}
                variant="info"
              />
              <span className="text-xs text-slate-400">Type cannot be changed</span>
            </div>
          )}

          {showUsername && (
            <Input
              label="Username"
              placeholder="root"
              error={errors.username?.message}
              {...register("username")}
            />
          )}

          {showPassword && (
            <Input
              label={isCreate ? "Password" : "New Password (leave blank to keep existing)"}
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
          )}

          {showPrivateKey && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                {isCreate ? "Private Key" : "New Private Key"}
                {!isCreate && (
                  <span className="ml-1 text-xs text-slate-400">(leave blank to keep existing)</span>
                )}
              </label>
              <textarea
                {...register("private_key")}
                rows={5}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.private_key && (
                <p className="text-xs text-red-500">{errors.private_key.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Add credential"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const perPage = 10;

  const load = (p = page) => {
    setLoading(true);
    setError("");
    getCredentials(p, perPage)
      .then((res) => {
        setCredentials(res.items ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setError("Failed to load credentials."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCredential(id);
      setDeleteConfirm(null);
      load(page);
    } catch {
      setError("Failed to delete credential.");
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Credentials</h1>
          <p className="text-sm text-slate-500">
            Manage SSH keys and authentication credentials for your servers.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + New Credential
        </Button>
      </div>

      {error && <Alert variant="error" message={error} />}

      {loading ? (
        <Card><CardBody className="!p-0"><TableSkeleton rows={4} cols={5} /></CardBody></Card>
      ) : null}

      {!loading && credentials.length === 0 && !showForm ? (
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <p className="text-slate-500">No credentials yet.</p>
            <Button className="mt-4" onClick={() => { setEditing(null); setShowForm(true); }}>
              Add your first credential
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {!loading && credentials.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">
              Credentials
              <span className="ml-2 text-sm font-normal text-slate-400">({total})</span>
            </h2>
          </CardHeader>
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Username</th>
                    <th className="px-6 py-3 text-left">Key</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {credentials.map((c) => (
                    <tr key={c.credential_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-6 py-3">
                        <Badge
                          label={typeLabels[c.credential_type] ?? c.credential_type}
                          variant="info"
                        />
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {c.username ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {c.has_private_key ? "Stored" : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(c);
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteConfirm(c.credential_id)}
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
        <CredentialFormModal
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
          title="Delete credential"
          message="This action cannot be undone. Any servers using this credential will lose access."
          confirmLabel="Delete credential"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}