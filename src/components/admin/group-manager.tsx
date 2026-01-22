'use client'

import { useState, useTransition } from 'react'
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
  createGroup,
  deleteGroup,
  type ActionResult,
} from '@/app/admin/group-actions'
import { Trash2, Edit2 } from 'lucide-react'
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
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!name.trim()) {
      setResult({ success: false, error: 'Введите название группы' })
      return
    }

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('description', description.trim())

    startTransition(async () => {
      const actionResult = await createGroup(formData)
      setResult(actionResult)

      if (actionResult.success) {
        setName('')
        setDescription('')
        setTimeout(() => setResult(null), 3000)
      }
    })
  }

  async function handleDelete(groupId: string) {
    if (!confirm('Вы уверены, что хотите удалить эту группу?')) {
      return
    }

    startTransition(async () => {
      const actionResult = await deleteGroup(groupId)
      setResult(actionResult)
      setTimeout(() => setResult(null), 3000)
    })
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
              disabled={isPending}
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
              disabled={isPending}
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
            disabled={isPending}
          >
            {isPending ? 'Создание...' : 'Создать группу'}
          </Button>
        </form>

        {/* Список групп */}
        {initialGroups.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Существующие группы:</h3>
            <div className="space-y-2">
              {initialGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{group.name}</p>
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
                    >
                      <Link href={`/admin/groups/${group.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(group.id)}
                      disabled={isPending}
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
    </Card>
  )
}
