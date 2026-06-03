"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServers, getOperations, getKits, getPipelines } from "@/lib/services";
import type { Server, Operation, Kit, Pipeline } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

type OperationStatus = Operation["status"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OperationStatus, string> = {
  completed: "#22c55e",
  failed: "#ef4444",
  in_progress: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#94a3b8",
  cancelled_unsafe: "#dc2626",
};

const STATUS_LABELS: Record<OperationStatus, string> = {
  completed: "Completed",
  failed: "Failed",
  in_progress: "In progress",
  pending: "Pending",
  cancelled: "Cancelled",
  cancelled_unsafe: "Cancelled (unsafe)",
};

function operationBadge(status: OperationStatus) {
  const map: Record<OperationStatus, "success" | "error" | "info" | "warning"> = {
    completed: "success",
    failed: "error",
    in_progress: "info",
    pending: "warning",
    cancelled: "warning",
    cancelled_unsafe: "error",
  };
  return <Badge label={status.replace(/_/g, " ")} variant={map[status]} />;
}

// ── Donut chart ───────────────────────────────────────────────────────────────

const R = 52;
const CX = 68;
const CY = 68;
const SW = 14;
const CIRC = 2 * Math.PI * R;

function DonutChart({
  counts,
  total,
}: {
  counts: Partial<Record<OperationStatus, number>>;
  total: number;
}) {
  if (total === 0) {
    return (
      <svg width={136} height={136} viewBox="0 0 136 136">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={SW} />
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={11}>
          No data
        </text>
      </svg>
    );
  }

  const order: OperationStatus[] = [
    "completed", "failed", "in_progress", "pending", "cancelled", "cancelled_unsafe",
  ];

  let cumulative = 0;
  const segments = order
    .filter((s) => (counts[s] ?? 0) > 0)
    .map((s) => {
      const arc = ((counts[s] ?? 0) / total) * CIRC;
      const seg = { status: s, arc, offset: cumulative };
      cumulative += arc;
      return seg;
    });

  return (
    <svg width={136} height={136} viewBox="0 0 136 136">
      {/* background ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
      {segments.map(({ status, arc, offset }) => (
        <circle
          key={status}
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={STATUS_COLORS[status]}
          strokeWidth={SW}
          strokeDasharray={`${arc} ${CIRC - arc}`}
          strokeDashoffset={CIRC / 4 - offset}
          strokeLinecap="butt"
        />
      ))}
      {/* center label */}
      <text x={CX} y={CY - 7} textAnchor="middle" fill="#0f172a" fontSize={22} fontWeight="bold">
        {total}
      </text>
      <text x={CX} y={CY + 10} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        total ops
      </text>
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  href,
  accent = "bg-slate-100",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <Card className={href ? "transition hover:shadow-md cursor-pointer" : ""}>
      <CardBody>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [operationTotal, setOperationTotal] = useState(0);
  const [pipelineTotal, setPipelineTotal] = useState(0);
  const [kitTotal, setKitTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getServers(1, 5),
      getOperations(1, 50),
      getKits(1, 50),
    ])
      .then(([s, o, k]) => {
        setServers(s.items ?? []);
        setOperations(o.items ?? []);
        setKits(k.items ?? []);
        setServerTotal(s.total ?? 0);
        setOperationTotal(o.total ?? 0);
        setKitTotal(k.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Pipelines fetched separately to avoid cascade failure
    getPipelines(1, 5)
      .then((p) => {
        setPipelines(p.items ?? []);
        setPipelineTotal(p.total ?? 0);
      })
      .catch(() => {});
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const activeOps = operations.filter(
    (o) => o.status === "in_progress" || o.status === "pending"
  ).length;

  const completedOps = operations.filter((o) => o.status === "completed").length;
  const failedOps = operations.filter((o) => o.status === "failed").length;
  const successRate =
    completedOps + failedOps > 0
      ? Math.round((completedOps / (completedOps + failedOps)) * 100)
      : null;

  const statusCounts = operations.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<OperationStatus, number>>
  );

  const recentOps = operations.slice(0, 5);
  const kitName = (id: string) => kits.find((k) => k.kit_id === id)?.name ?? id;
  const serverName = (id: string) => servers.find((s) => s.server_id === id)?.name ?? id;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header + quick actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500">ikctl — remote application manager</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/operations">
            <Button size="sm">Run operation</Button>
          </Link>
          <Link href="/dashboard/pipelines/new">
            <Button variant="secondary" size="sm">New pipeline</Button>
          </Link>
          <Link href="/dashboard/servers">
            <Button variant="secondary" size="sm">Add server</Button>
          </Link>
        </div>
      </div>

      {/* Stat cards — 6 cards */}
      {loading ? (
        <StatCardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="Servers"
            value={serverTotal}
            href="/dashboard/servers"
            accent="bg-blue-50"
            icon={
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            }
          />
          <StatCard
            label="Operations"
            value={operationTotal}
            sub={activeOps > 0 ? `${activeOps} active` : undefined}
            href="/dashboard/operations"
            accent="bg-green-50"
            icon={
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label="Pipelines"
            value={pipelineTotal}
            href="/dashboard/pipelines"
            accent="bg-purple-50"
            icon={
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
          />
          <StatCard
            label="Kits available"
            value={kitTotal}
            href="/dashboard/kits"
            accent="bg-orange-50"
            icon={
              <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            label="Active now"
            value={activeOps}
            sub="pending + in progress"
            accent="bg-yellow-50"
            icon={
              <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Success rate"
            value={successRate !== null ? `${successRate}%` : "—"}
            sub={
              successRate !== null
                ? `${completedOps} / ${completedOps + failedOps} ops`
                : "no completed ops yet"
            }
            accent="bg-teal-50"
            icon={
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Donut chart + Recent operations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Donut */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Operation status</h2>
            <p className="text-xs text-slate-400">Last {operations.length} operations</p>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5">
                <DonutChart counts={statusCounts} total={operations.length} />
                <div className="w-full space-y-2">
                  {(Object.entries(statusCounts) as [OperationStatus, number][])
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: STATUS_COLORS[status] }}
                          />
                          <span className="text-slate-600">{STATUS_LABELS[status]}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent operations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Recent operations</h2>
              <Link href="/dashboard/operations">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="!p-0">
            {loading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : recentOps.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-slate-400">No operations yet.</p>
                <Link href="/dashboard/operations">
                  <Button variant="secondary" size="sm" className="mt-3">Run operation</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentOps.map((o) => (
                  <li key={o.operation_id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{kitName(o.kit_id)}</p>
                      <p className="text-xs text-slate-400">
                        {serverName(o.server_id)} · {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {operationBadge(o.status)}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Servers + Pipelines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Servers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Servers</h2>
              <Link href="/dashboard/servers">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="!p-0">
            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : servers.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-slate-400">No servers yet.</p>
                <Link href="/dashboard/servers">
                  <Button variant="secondary" size="sm" className="mt-3">Add server</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {servers.map((s) => (
                  <li key={s.server_id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.host}:{s.port}</p>
                    </div>
                    <Link href={`/dashboard/servers/${s.server_id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Pipelines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Pipelines</h2>
              <Link href="/dashboard/pipelines">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="!p-0">
            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : pipelines.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-slate-400">No pipelines yet.</p>
                <Link href="/dashboard/pipelines/new">
                  <Button variant="secondary" size="sm" className="mt-3">New pipeline</Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pipelines.map((p) => (
                  <li key={p.pipeline_id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.kits.length} kit{p.kits.length !== 1 ? "s" : ""} ·{" "}
                        {p.targets.length} target{p.targets.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Link href={`/dashboard/pipelines/${p.pipeline_id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
