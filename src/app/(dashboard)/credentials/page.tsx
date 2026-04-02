"use client"

import { useState } from "react"
import { CredentialsList } from "@/features/credentials/components/CredentialsList"
import { CredentialForm } from "@/features/credentials/components/CredentialForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CredentialResponse } from "@/types/api"

const PER_PAGE = 10

export default function CredentialsPage() {
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCredential, setSelectedCredential] = useState<CredentialResponse | undefined>(
    undefined,
  )
  const [listKey, setListKey] = useState(0)

  function handleNew() {
    setSelectedCredential(undefined)
    setIsFormOpen(true)
  }

  function handleEdit(credential: CredentialResponse) {
    setSelectedCredential(credential)
    setIsFormOpen(true)
  }

  function handleCancel() {
    setIsFormOpen(false)
    setSelectedCredential(undefined)
  }

  function handleSuccess() {
    setIsFormOpen(false)
    setSelectedCredential(undefined)
    setListKey((k) => k + 1)
  }

  function handleDeleteSuccess() {
    setListKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Credenciales</h1>
        {!isFormOpen && (
          <Button onClick={handleNew}>Nueva credencial</Button>
        )}
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCredential ? "Editar credencial" : "Nueva credencial"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CredentialForm
              credential={selectedCredential}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      <CredentialsList
        key={listKey}
        page={page}
        perPage={PER_PAGE}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
