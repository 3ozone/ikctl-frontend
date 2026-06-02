"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getServer,
  checkServerHealth,
  getOperations,
  getKits,
} from "@/lib/services";
import type { Server, ServerHealth, Operation, Kit } from "@/types";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";

function statusBadge(status: Operation["status"]) {
  const map: Record<Operation["status"], "success" | "error" | "info" | "warning"> = {
    completed: "success",
    failed: "error",
    in_progress: "info",
    pending: "warning",
    cancelled: "warning",
    cancelled_unsafe: "error",
  };
  return (
    <Badge
      label={status.replace("_", " ")}
      variant={map[status]}
    />
  );
}

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [server, setServer] = useState<Server | null>(null);
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [opPage, setOpPage] = useState(1);
  const [opTotal, setOpTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServer = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getServer(id);
      setServer(s);
    } catch {
      setError("Failed to load server.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchOperations = useCallback(async (page: number) => {
    setOpLoading(true);
    try {
      const res = await getOperations(page, 10, { server_id: id });
      setOperations(res.items);
      setOpTotal(res.total);
      setOpPage(res.page);
    } catch {
      // silently fail
    } finally {
      setOpLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServer();
    fetchOperations(1);
    getKits(1, 50).then((res) => setKits(res.items ?? [])).catch(() => {});
  }, [fetchServer, fetchOperations]);

  const kitName = (id: string) =>
    kits.find((k) => k.kit_id === id)?.name ?? id;

  const handleHealthCheck = async () => {
    setHealthLoading(true);
    setHealth(null);
    try {
      const h = await checkServerHealth(id);
      setHealth(h);
    } catch {
      setHealth({
        server_id: id,
        status: "unreachable",
        latency_ms: null,
        os_id: null,
        os_version: null,
        os_name: null,
      });
    } finally {
      setHealthLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(opTotal / 10));

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !server) {
    return (
      <div className="space-y-4">
        <Alert variant="error" message={error ?? "Server not found."} />
        <Button variant="secondary" onClick={() => router.push("/dashboard/servers")}>
          Back to servers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/servers"
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{server.name}</h1>
            <Badge
              label={server.status}
              variant={server.status === "active" ? "success" : "default"}
            />
          </div>
          <p className="text-sm text-slate-500">
            {server.host}:{server.port} · {server.server_type}
          </p>
        </div>
      </div>

      {/* Server info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Server details</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleHealthCheck}
              loading={healthLoading}
            >
              Health check
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-400">Server ID</p>
              <p className="font-mono text-slate-800">{server.server_id}</p>
            </div>
            <div>
              <p className="text-slate-400">Type</p>
              <p className="text-slate-800">{server.server_type}</p>
            </div>
            <div>
              <p className="text-slate-400">Host</p>
              <p className="text-slate-800">{server.host ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Port</p>
              <p className="text-slate-800">{server.port ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Credential</p>
              <p className="text-slate-800">
                {server.credential_id
                  ? `${server.credential_id.slice(0, 8)}…`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="text-slate-800">{server.status}</p>
            </div>
            <div>
              <p className="text-slate-400">Created</p>
              <p className="text-slate-800">
                {new Date(server.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Updated</p>
              <p className="text-slate-800">
                {new Date(server.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {server.description && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Description
              </p>
              <p className="mt-1 text-sm text-slate-700">{server.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Health result */}
      {health && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Health check</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Status</p>
                <Badge
                  label={health.status}
                  variant={
                    health.status === "online"
                      ? "success"
                      : health.status === "offline"
                        ? "error"
                        : "warning"
                  }
                />
              </div>
              <div>
                <p className="text-slate-400">Latency</p>
                <p className="font-medium text-slate-800">
                  {health.latency_ms === null
                    ? "—"
                    : `${health.latency_ms}ms`}
                </p>
              </div>
              <div>
                <p className="text-slate-400">OS</p>
                <p className="font-medium text-slate-800">
                  {health.os_name
                    ? `${health.os_name} ${health.os_version ?? ""}`
                    : "—"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* OS detected */}
      {server.os_name && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Detected OS</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400">OS</p>
                <p className="font-medium text-slate-800">{server.os_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Version</p>
                <p className="font-medium text-slate-800">
                  {server.os_version ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-400">OS ID</p>
                <p className="font-medium text-slate-800">
                  {server.os_id ?? "—"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Operation history */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">
            Operation history
            {opTotal > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({opTotal} total)
              </span>
            )}
          </h2>
        </CardHeader>
        <CardBody className="!p-0">
          {opLoading && operations.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-400">Loading operations…</p>
          ) : operations.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-400">
                No operations for this server yet.
              </p>
              <Link href="/dashboard/operations">
                <Button variant="secondary" size="sm" className="mt-3">
                  Run operation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Kit</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Started</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operations.map((op) => (
                    <tr key={op.operation_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {kitName(op.kit_id)}
                      </td>
                      <td className="px-6 py-3">{statusBadge(op.status)}</td>
                      <td className="px-6 py-3 text-slate-400">
                        {new Date(op.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/operations?op=${op.operation_id}`}>
                          <Button variant="ghost" size="sm">Details</Button>
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
          page={opPage}
          totalPages={totalPages}
          onPage={fetchOperations}
        />
      </Card>
    </div>
  );
}
