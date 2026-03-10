import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | ikctl",
}

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Bienvenido a ikctl. Próximamente: gestión de servidores.
      </p>
    </div>
  )
}
