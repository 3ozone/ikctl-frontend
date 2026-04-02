"use client"

import { useState } from "react"
import { GroupsList } from "@/features/groups/components/GroupsList"
import { GroupForm } from "@/features/groups/components/GroupForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GroupResponse } from "@/types/api"

const PER_PAGE = 10

export default function GroupsPage() {
  const [page, setPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<GroupResponse | undefined>(undefined)
  const [listKey, setListKey] = useState(0)

  function handleNew() {
    setSelectedGroup(undefined)
    setIsFormOpen(true)
  }

  function handleEdit(group: GroupResponse) {
    setSelectedGroup(group)
    setIsFormOpen(true)
  }

  function handleCancel() {
    setIsFormOpen(false)
    setSelectedGroup(undefined)
  }

  function handleSuccess() {
    setIsFormOpen(false)
    setSelectedGroup(undefined)
    setListKey((k) => k + 1)
  }

  function handleDeleteSuccess() {
    setListKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Grupos</h1>
        {!isFormOpen && (
          <Button onClick={handleNew}>Nuevo grupo</Button>
        )}
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedGroup ? "Editar grupo" : "Nuevo grupo"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GroupForm
              group={selectedGroup}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      <GroupsList
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
