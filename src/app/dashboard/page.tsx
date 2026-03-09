"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getServers, getOperations } from "@/lib/services";
import type { Server, Operation } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function operationBadge(status: Operation["status"]) {
  const map = {
    completed: "success",
    failed: "error",
    in_progress: "info",
    pending: "warning",
  } as const;
  return <Badge label={status.replace("_", " ")} variant={map[status]} />;
}

export default function DashboardPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getServers(1, 5), getOperations(1, 5)])
      .then(([s, o]) => {
        setServers(s.items ?? []);
        setOperations(o.items ?? []);
      })
      .catch(() => {
        setServers([]);
        setOperations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500">
          Welcome to ikctl — your remote application manager.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Servers"
          value={loading ? "…" : String(servers.length)}
          icon={
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          }
        />
        <StatCard
          label="Total Operations"
          value={loading ? "…" : String(operations.length)}
          icon={
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Active Operations"
          value={
            loading
              ? "…"
              : String(
                  operations.filter(
                    (o) => o.status === "in_progress" || o.status === "pending"
                  ).length
                )
          }
          icon={
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent servers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Recent Servers</h2>
              <Link href="/dashboard/servers">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="!p-0">
            {loading ? (
              <p className="px-6 py-4 text-sm text-slate-400">Loading…</p>
            ) : servers.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-slate-400">No servers yet.</p>
                <Link href="/dashboard/servers">
                  <Button variant="secondary" size="sm" className="mt-3">
                    Add server
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {servers.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">
                        {s.user}@{s.host}:{s.port}
                      </p>
                    </div>
                    <Link href={`/dashboard/servers?id=${s.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Recent operations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Recent Operations</h2>
              <Link href="/dashboard/operations">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardBody className="!p-0">
            {loading ? (
              <p className="px-6 py-4 text-sm text-slate-400">Loading…</p>
            ) : operations.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-slate-400">No operations yet.</p>
                <Link href="/dashboard/operations">
                  <Button variant="secondary" size="sm" className="mt-3">
                    Run operation
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {operations.map((o) => (
                  <li key={o.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {o.kit}
                      </p>
                      <p className="text-xs text-slate-400">
                        {o.server_name ?? o.server_id} ·{" "}
                        {new Date(o.created_at).toLocaleDateString()}
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
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
