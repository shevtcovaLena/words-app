'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Trash2 } from 'lucide-react'
import { deleteWord, type ActionResult } from '@/app/admin/actions'
import type { Database } from '@/types/supabase'

type Word = Database['public']['Tables']['words']['Row']

interface WordsListProps {
  words: Word[]
}

/**
 * Список слов с возможностью удаления
 */
export function WordsList({ words }: WordsListProps) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [result, setResult] = useState<ActionResult | null>(null)

  async function handleDelete(wordId: string) {
    if (!confirm('Вы уверены, что хотите удалить это слово?')) {
      return
    }

    setDeletingId(wordId)
    startTransition(async () => {
      const actionResult = await deleteWord(wordId)
      setResult(actionResult)
      setDeletingId(null)

      if (actionResult.success) {
        setTimeout(() => setResult(null), 3000)
      }
    })
  }

  if (words.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Добавленные слова</CardTitle>
          <CardDescription>Список слов пуст</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Добавьте первое слово через форму выше
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добавленные слова ({words.length})</CardTitle>
        <CardDescription>Последние 20 добавленных слов</CardDescription>
      </CardHeader>
      <CardContent>
        {result && !result.success && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {result.error}
          </div>
        )}

        <div className="space-y-2">
          {words.map((word) => (
            <div
              key={word.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{word.full_word}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">{word.mask}</span>
                </div>
                <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                  <span>Уровень: {word.level}</span>
                  <span>•</span>
                  <span>{word.is_public ? 'Публичное' : 'Приватное'}</span>
                  <span>•</span>
                  <span>
                    {new Date(word.created_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(word.id)}
                disabled={isPending || deletingId === word.id}
                className="text-destructive hover:bg-destructive/10 ml-4 min-h-[44px] min-w-[44px]"
                aria-label={`Удалить слово ${word.full_word}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
