"use client"

import { useState } from "react"
import { ServersList } from "@/features/servers/components/ServersList"
import { RegisterServerForm } from "@/features/servers/components/RegisterServerForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ServerResponse } from "@/types/api"

const PER_PAGE = 10

export default function ServersPage() {
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<ServerResponse | undefined>(undefined)
  const [listKey, setListKey] = useState(0)

  function handleNew() {
    setSelectedServer(undefined)
    setIsFormOpen(true)
  }

  function handleEdit(server: ServerResponse) {
    setSelectedServer(server)
    setIsFormOpen(true)
  }

  function handleCancel() {
    setIsFormOpen(false)
    setSelectedServer(undefined)
  }

  function handleSuccess() {
    setIsFormOpen(false)
    setSelectedServer(undefined)
    setListKey((k) => k + 1)
  }

  function handleMutationSuccess() {
    setListKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Servidores</h1>
        {!isFormOpen && (
          <Button onClick={handleNew}>Nuevo servidor</Button>
        )}
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedServer ? "Editar servidor" : "Nuevo servidor"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterServerForm
              server={selectedServer}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      <ServersList
        key={listKey}
        page={page}
        perPage={PER_PAGE}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDeleteSuccess={handleMutationSuccess}
        onToggleSuccess={handleMutationSuccess}
      />
    </div>
  )
}
