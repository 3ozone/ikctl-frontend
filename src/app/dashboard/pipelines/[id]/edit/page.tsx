"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  getPipeline,
  getPipelineStatus,
  getServers,
  getGroups,
  getKits,
  updatePipeline,
} from "@/lib/services";
import type { Server, Kit, Pipeline, Group } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1024).optional(),
  sudo: z.boolean(),
  debug_level: z.enum(["none", "errors", "full"]),
});
type FormValues = z.infer<typeof schema>;

// ── Kit row state ─────────────────────────────────────────────────────────────

let kitRowCounter = 0;

type KitRow = {
  uid: number;
  kit_id: string;
  sudo_override: boolean;
  sudo_value: boolean;
  debug_override: boolean;
  debug_value: "none" | "errors" | "full";
  values: { key: string; value: string }[];
};

function emptyKitRow(): KitRow {
  return {
    uid: ++kitRowCounter,
    kit_id: "",
    sudo_override: false,
    sudo_value: false,
    debug_override: false,
    debug_value: "none",
    values: [],
  };
}

function kitRowFromConfig(
  cfg: Pipeline["kits"][number],
  kits: Kit[]
): KitRow {
  // Values: use pipeline-stored values; if empty, fall back to kit defaults
  const kit = kits.find((k) => k.kit_id === cfg.kit_id);
  const storedValues = cfg.values && Object.keys(cfg.values).length > 0
    ? cfg.values
    : (kit?.values ?? {});

  return {
    uid: ++kitRowCounter,
    kit_id: cfg.kit_id,
    sudo_override: cfg.sudo !== null && cfg.sudo !== undefined,
    sudo_value: cfg.sudo ?? false,
    debug_override: cfg.debug_level !== null && cfg.debug_level !== undefined,
    debug_value: cfg.debug_level ?? "none",
    values: Object.entries(storedValues).map(([key, val]) => ({
      key,
      value: String(val ?? ""),
    })),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditPipelinePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [kitRows, setKitRows] = useState<KitRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [targetsError, setTargetsError] = useState<string | null>(null);
  const [kitsError, setKitsError] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sudo: false, debug_level: "none" },
  });

  // ── Load data ────────────────────────────────────────────────────────────────

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

        const allServers = serversData.items ?? [];
        const allGroups = groupsData.items ?? [];
        const allKits = kitsData.items ?? [];

        setPipeline(pipelineData);
        setServers(allServers);
        setGroups(allGroups);
        setKits(allKits);

        // Pre-populate form
        reset({
          name: pipelineData.name,
          description: pipelineData.description ?? "",
          sudo: pipelineData.sudo,
          debug_level: pipelineData.debug_level,
        });
        setSelectedTargetIds(pipelineData.targets.map((t) => t.server_id));
        setKitRows(
          pipelineData.kits.length > 0
            ? pipelineData.kits.map((cfg) => kitRowFromConfig(cfg, allKits))
            : [emptyKitRow()]
        );

        // Check for active execution
        try {
          const exec = await getPipelineStatus(id);
          if (exec && (exec.status === "pending" || exec.status === "in_progress")) {
            setInProgress(true);
          }
        } catch {
          // No executions yet — fine
        }
      } catch {
        setLoadError("Failed to load pipeline.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Targets ──────────────────────────────────────────────────────────────────

  const toggleTarget = (id: string) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setTargetsError(null);
  };

  // ── Kit rows ─────────────────────────────────────────────────────────────────

  const addKitRow = () => setKitRows((prev) => [...prev, emptyKitRow()]);

  const removeKitRow = (uid: number) =>
    setKitRows((prev) => prev.filter((r) => r.uid !== uid));

  const updateKitRow = (uid: number, patch: Partial<KitRow>) => {
    setKitRows((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r))
    );
    setKitsError(null);
  };

  const handleKitSelect = (uid: number, kit_id: string) => {
    const kit = kits.find((k) => k.kit_id === kit_id);
    updateKitRow(uid, {
      kit_id,
      values: kit
        ? Object.entries(kit.values ?? {}).map(([key, val]) => ({
            key,
            value: String(val ?? ""),
          }))
        : [],
    });
  };

  const updateKitValue = (uid: number, idx: number, value: string) => {
    setKitRows((prev) =>
      prev.map((r) => {
        if (r.uid !== uid) return r;
        const values = r.values.map((v, i) =>
          i === idx ? { ...v, value } : v
        );
        return { ...r, values };
      })
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    let valid = true;

    if (selectedTargetIds.length === 0) {
      setTargetsError("Select at least one target server or group.");
      valid = false;
    }

    const filledKits = kitRows.filter((r) => r.kit_id !== "");
    if (filledKits.length === 0) {
      setKitsError("Add at least one kit.");
      valid = false;
    }

    if (!valid) return;

    try {
      await updatePipeline(id, {
        name: data.name,
        description: data.description || undefined,
        sudo: data.sudo,
        debug_level: data.debug_level,
        targets: selectedTargetIds.map((server_id) => ({ server_id })),
        kits: filledKits.map((r) => ({
          kit_id: r.kit_id,
          sudo: r.sudo_override ? r.sudo_value : null,
          debug_level: r.debug_override ? r.debug_value : null,
          values: Object.fromEntries(
            r.values
              .filter((v) => v.key.trim())
              .map((v) => [v.key, v.value])
          ),
        })),
      });
      router.push(`/dashboard/pipelines/${id}`);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (e?.response?.status === 409) {
        setSubmitError(
          "Cannot edit: the pipeline has executions in progress."
        );
      } else {
        setSubmitError(
          e?.response?.data?.message ?? "Failed to update pipeline."
        );
      }
    }
  };

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

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert variant="error" message={loadError} />
        <Link href="/dashboard/pipelines">
          <Button variant="secondary">Back to pipelines</Button>
        </Link>
      </div>
    );
  }

  const disabled = inProgress || isSubmitting;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/pipelines/${id}`}
          className="text-slate-400 hover:text-slate-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Edit pipeline
          </h1>
          <p className="text-sm text-slate-500">{pipeline?.name}</p>
        </div>
      </div>

      {inProgress && (
        <Alert
          variant="warning"
          message="This pipeline has an execution in progress. Editing is disabled until it finishes."
        />
      )}

      {submitError && <Alert variant="error" message={submitError} />}

      <fieldset disabled={disabled} className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">Basic info</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Name"
                placeholder="Install Kubernetes cluster"
                error={errors.name?.message}
                {...register("name")}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">
                  Description{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="What does this pipeline do…"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-slate-50 disabled:text-slate-400"
                  {...register("description")}
                />
              </div>
            </CardBody>
          </Card>

          {/* Global defaults */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">Global defaults</h2>
              <p className="text-xs text-slate-400">
                Inherited by kits that don&apos;t set their own value.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 disabled:opacity-50"
                  {...register("sudo")}
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Run with sudo</span>
                  <p className="text-xs text-slate-400">Execute each kit script with sudo privileges.</p>
                </div>
              </label>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Debug level</label>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 w-40 disabled:bg-slate-50 disabled:text-slate-400"
                  {...register("debug_level")}
                >
                  <option value="none">none</option>
                  <option value="errors">errors</option>
                  <option value="full">full</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Targets */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">
                Targets{" "}
                <span className="font-normal text-slate-400 text-sm">
                  ({selectedTargetIds.length} selected)
                </span>
              </h2>
              <p className="text-xs text-slate-400">The pipeline will run on each selected server or group.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              {targetsError && (
                <p className="mb-1 text-sm text-red-600">{targetsError}</p>
              )}

              {/* Servers */}
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wide">Servers</p>
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
                          className="rounded disabled:opacity-50"
                          checked={selectedTargetIds.includes(s.server_id)}
                          onChange={() => toggleTarget(s.server_id)}
                          disabled={disabled}
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

              {/* Groups */}
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wide">Groups</p>
                {groups.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                    No groups available.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {groups.map((g) => (
                      <label
                        key={g.group_id}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          className="rounded disabled:opacity-50"
                          checked={selectedTargetIds.includes(g.group_id)}
                          onChange={() => toggleTarget(g.group_id)}
                          disabled={disabled}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{g.name}</p>
                          <p className="truncate text-xs text-slate-400">
                            {g.server_ids?.length ?? 0} server{(g.server_ids?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Kits */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">Kits</h2>
              <p className="text-xs text-slate-400">Kits run in order on every target server.</p>
            </CardHeader>
            <CardBody className="space-y-3">
              {kitsError && (
                <p className="text-sm text-red-600">{kitsError}</p>
              )}
              {kitRows.map((row, idx) => (
                <div
                  key={row.uid}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Kit {idx + 1}
                    </span>
                    {kitRows.length > 1 && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => removeKitRow(row.uid)}
                        className="text-slate-400 hover:text-red-500 transition disabled:opacity-40"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">Kit</label>
                    {kits.length === 0 ? (
                      <p className="text-sm text-slate-400">No kits available.</p>
                    ) : (
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                        value={row.kit_id}
                        disabled={disabled}
                        onChange={(e) => handleKitSelect(row.uid, e.target.value)}
                      >
                        <option value="">— select a kit —</option>
                        {kits
                          .filter((k) => !k.is_deleted)
                          .map((k) => (
                            <option key={k.kit_id} value={k.kit_id}>
                              {k.name} {k.version ? `(${k.version})` : ""}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded disabled:opacity-50"
                          checked={row.sudo_override}
                          disabled={disabled}
                          onChange={(e) =>
                            updateKitRow(row.uid, { sudo_override: e.target.checked })
                          }
                        />
                        Override sudo
                      </label>
                      {row.sudo_override && (
                        <select
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
                          value={row.sudo_value ? "true" : "false"}
                          disabled={disabled}
                          onChange={(e) =>
                            updateKitRow(row.uid, { sudo_value: e.target.value === "true" })
                          }
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded disabled:opacity-50"
                          checked={row.debug_override}
                          disabled={disabled}
                          onChange={(e) =>
                            updateKitRow(row.uid, { debug_override: e.target.checked })
                          }
                        />
                        Override debug
                      </label>
                      {row.debug_override && (
                        <select
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
                          value={row.debug_value}
                          disabled={disabled}
                          onChange={(e) =>
                            updateKitRow(row.uid, {
                              debug_value: e.target.value as "none" | "errors" | "full",
                            })
                          }
                        >
                          <option value="none">none</option>
                          <option value="errors">errors</option>
                          <option value="full">full</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {row.values.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Values
                      </p>
                      <div className="space-y-1">
                        {row.values.map((v, i) => (
                          <div key={v.key} className="flex items-center gap-2">
                            <span className="w-32 shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-mono text-slate-600 truncate">
                              {v.key}
                            </span>
                            <input
                              type="text"
                              value={v.value}
                              disabled={disabled}
                              onChange={(e) => updateKitValue(row.uid, i, e.target.value)}
                              className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                disabled={disabled}
                onClick={addKitRow}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-2 text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add kit
              </button>
            </CardBody>
          </Card>

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <Link href={`/dashboard/pipelines/${id}`}>
              <Button variant="secondary" type="button">Cancel</Button>
            </Link>
            <Button type="submit" loading={isSubmitting} disabled={disabled}>
              Save changes
            </Button>
          </div>
        </form>
      </fieldset>
    </div>
  );
}
