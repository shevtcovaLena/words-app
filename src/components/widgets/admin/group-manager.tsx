'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  createGroup,
  deleteGroup,
  updateGroup,
  type ActionResult,
} from '@/app/admin/group-actions'
import { Trash2, Edit2, Pencil } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/supabase'

type Group = Database['public']['Tables']['word_groups']['Row']

interface GroupManagerProps {
  groups: Group[]
}

/**
 * Компонент для управления группами слов
 */
export function GroupManager({ groups: initialGroups }: GroupManagerProps) {
  const [groups, setGroups] = useState(initialGroups)
  const [result, setResult] = useState<ActionResult | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editResult, setEditResult] = useState<ActionResult | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])

  useEffect(() => {
    if (editingGroup) {
      setEditName(editingGroup.name)
      setEditDescription(editingGroup.description ?? '')
      setEditResult(null)
    }
  }, [editingGroup])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!name.trim()) {
      setResult({ success: false, error: 'Введите название группы' })
      return
    }

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('description', description.trim())

    setCreating(true)
    try {
      const actionResult = await createGroup(formData)
      setResult(actionResult)

      if (actionResult.success) {
        if (actionResult.group) {
          setGroups((prev) => [actionResult.group!, ...prev])
        }
        setName('')
        setDescription('')
        setTimeout(() => setResult(null), 3000)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(groupId: string) {
    if (!confirm('Вы уверены, что хотите удалить эту группу?')) {
      return
    }

    setDeletingId(groupId)
    try {
      const actionResult = await deleteGroup(groupId)
      setResult(actionResult)
      if (actionResult.success) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId))
      }
      setTimeout(() => setResult(null), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  function openEditDialog(group: Group) {
    setEditingGroup(group)
  }

  async function handleUpdateGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingGroup) return

    if (!editName.trim()) {
      setEditResult({ success: false, error: 'Введите название группы' })
      return
    }

    const formData = new FormData()
    formData.append('name', editName.trim())
    formData.append('description', editDescription.trim())

    setSavingEdit(true)
    try {
      const actionResult = await updateGroup(editingGroup.id, formData)
      setEditResult(actionResult)

      if (actionResult.success) {
        if (actionResult.group) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === actionResult.group!.id ? actionResult.group! : g,
            ),
          )
        }
        setEditingGroup(null)
        setTimeout(() => setEditResult(null), 3000)
      }
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление группами слов</CardTitle>
        <CardDescription>
          Создавайте группы (словари) для организации слов по темам или классам
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Форма создания группы */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group_name">Название группы *</Label>
            <Input
              id="group_name"
              type="text"
              placeholder="например: 1 класс - 1 полугодие"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px]"
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group_description">Описание (необязательно)</Label>
            <Textarea
              id="group_description"
              placeholder="Краткое описание группы слов"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="min-h-[80px]"
              disabled={creating}
            />
          </div>

          {result && (
            <div
              className={`rounded-md p-3 text-sm ${
                result.success
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {result.success ? result.message : result.error}
            </div>
          )}

          <Button
            type="submit"
            className="min-h-[44px] w-full"
            disabled={creating}
          >
            {creating ? 'Создание...' : 'Создать группу'}
          </Button>
        </form>

        {/* Список групп */}
        {groups.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Существующие группы:</h3>
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      <Button
                        type="button"
                        variant="link"
                        size="icon"
                        onClick={() => openEditDialog(group)}
                        className="min-h-[30px] min-w-[30px]"
                        title="Редактировать название и описание"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {group.name}
                    </p>
                    {group.description && (
                      <p className="text-muted-foreground text-sm">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="min-h-[44px] min-w-[44px]"
                      title="Слова в группе"
                    >
                      <Link href={`/admin/groups/${group.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(group.id)}
                      disabled={deletingId !== null}
                      className="min-h-[44px] min-w-[44px] text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog
        open={editingGroup !== null}
        onOpenChange={(open) => {
          if (!open) setEditingGroup(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Редактировать группу</DialogTitle>
              <DialogDescription>
                Измените название и описание. Список слов по-прежнему
                открывается со страницы группы.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="edit_group_name">Название группы *</Label>
              <Input
                id="edit_group_name"
                type="text"
                required
                minLength={2}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-h-[44px]"
                disabled={savingEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_group_description">Описание</Label>
              <Textarea
                id="edit_group_description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="min-h-[80px]"
                disabled={savingEdit}
              />
            </div>
            {editResult && (
              <div
                className={`rounded-md p-3 text-sm ${
                  editResult.success
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {editResult.success ? editResult.message : editResult.error}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingGroup(null)}
                disabled={savingEdit}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
