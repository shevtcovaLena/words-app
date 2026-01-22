'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  addWordsToGroup,
  removeWordsFromGroup,
  type ActionResult,
} from '@/app/admin/group-actions'
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import type { Database } from '@/types/supabase'

type Word = Database['public']['Tables']['words']['Row']
type GroupItem = Database['public']['Tables']['word_group_items']['Row']

interface GroupWordsManagerProps {
  groupId: string
  groupName: string
  allWords: Word[]
  groupWords: Word[]
  groupItems: GroupItem[]
  wordGroupsMap: Record<string, string[]> // wordId -> groupIds[]
}

/**
 * Компонент для управления словами в группе с drag-and-drop
 */
export function GroupWordsManager({
  groupId,
  groupName,
  allWords,
  groupWords,
  groupItems,
  wordGroupsMap,
}: GroupWordsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [selectedGroupWords, setSelectedGroupWords] = useState<Set<string>>(
    new Set(),
  )

  // Сортируем слова: сначала те, которых нет в других группах, затем остальные
  const sortedAllWords = useMemo(() => {
    const wordsWithoutGroups: Word[] = []
    const wordsWithGroups: Word[] = []

    allWords.forEach((word) => {
      const otherGroups = (wordGroupsMap[word.id] || []).filter(
        (gId) => gId !== groupId,
      )
      if (otherGroups.length === 0) {
        wordsWithoutGroups.push(word)
      } else {
        wordsWithGroups.push(word)
      }
    })

    return [...wordsWithoutGroups, ...wordsWithGroups]
  }, [allWords, wordGroupsMap, groupId])

  // Слова в группе, отсортированные по sort_order
  const sortedGroupWords = useMemo(() => {
    return [...groupWords].sort((a, b) => {
      const itemA = groupItems.find((item) => item.word_id === a.id)
      const itemB = groupItems.find((item) => item.word_id === b.id)
      return (itemA?.sort_order || 0) - (itemB?.sort_order || 0)
    })
  }, [groupWords, groupItems])

  async function handleAddWords() {
    if (selectedWords.size === 0) {
      return
    }

    startTransition(async () => {
      const actionResult = await addWordsToGroup(
        groupId,
        Array.from(selectedWords),
      )
      setResult(actionResult)

      if (actionResult.success) {
        setSelectedWords(new Set())
        setTimeout(() => setResult(null), 3000)
      }
    })
  }

  async function handleRemoveWords() {
    if (selectedGroupWords.size === 0) {
      return
    }

    startTransition(async () => {
      const actionResult = await removeWordsFromGroup(
        groupId,
        Array.from(selectedGroupWords),
      )
      setResult(actionResult)

      if (actionResult.success) {
        setSelectedGroupWords(new Set())
        setTimeout(() => setResult(null), 3000)
      }
    })
  }

  function toggleWordSelection(wordId: string) {
    const newSet = new Set(selectedWords)
    if (newSet.has(wordId)) {
      newSet.delete(wordId)
    } else {
      newSet.add(wordId)
    }
    setSelectedWords(newSet)
  }

  function toggleGroupWordSelection(wordId: string) {
    const newSet = new Set(selectedGroupWords)
    if (newSet.has(wordId)) {
      newSet.delete(wordId)
    } else {
      newSet.add(wordId)
    }
    setSelectedGroupWords(newSet)
  }

  function selectAllAvailable() {
    const availableWordIds = sortedAllWords
      .filter((word) => !groupWords.some((gw) => gw.id === word.id))
      .map((word) => word.id)
    setSelectedWords(new Set(availableWordIds))
  }

  function selectAllInGroup() {
    setSelectedGroupWords(new Set(sortedGroupWords.map((word) => word.id)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление словами в группе: {groupName}</CardTitle>
        <CardDescription>
          Выберите слова для добавления в группу или удаления из неё
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Список всех слов */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Все слова ({sortedAllWords.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllAvailable}
                disabled={isPending}
              >
                Выбрать все доступные
              </Button>
            </div>
            <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-lg border p-3">
              {sortedAllWords
                .filter((word) => !groupWords.some((gw) => gw.id === word.id))
                .map((word) => {
                  const otherGroups = (wordGroupsMap[word.id] || []).filter(
                    (gId) => gId !== groupId,
                  )
                  const isSelected = selectedWords.has(word.id)

                  return (
                    <div
                      key={word.id}
                      className={`flex cursor-pointer items-center justify-between rounded border p-2 transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted border-transparent'
                      }`}
                      onClick={() => toggleWordSelection(word.id)}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleWordSelection(word.id)}
                          className="min-h-[20px] min-w-[20px]"
                        />
                        <div className="flex-1">
                          <span className="font-medium">{word.full_word}</span>
                          <span className="text-muted-foreground ml-2 font-mono text-sm">
                            {word.mask}
                          </span>
                        </div>
                        {otherGroups.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-3 w-3 rounded-full border-yellow-500 bg-yellow-400 p-0"
                            title={`Слово уже в ${otherGroups.length} других группах`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
            <Button
              onClick={handleAddWords}
              disabled={isPending || selectedWords.size === 0}
              className="min-h-[44px] w-full"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Добавить выбранные ({selectedWords.size})
            </Button>
          </div>

          {/* Список слов в группе */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Слова в группе ({sortedGroupWords.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllInGroup}
                disabled={isPending}
              >
                Выбрать все
              </Button>
            </div>
            <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-lg border p-3">
              {sortedGroupWords.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  В группе пока нет слов
                </p>
              ) : (
                sortedGroupWords.map((word) => {
                  const otherGroups = (wordGroupsMap[word.id] || []).filter(
                    (gId) => gId !== groupId,
                  )
                  const isSelected = selectedGroupWords.has(word.id)

                  return (
                    <div
                      key={word.id}
                      className={`flex cursor-pointer items-center justify-between rounded border p-2 transition-colors ${
                        isSelected
                          ? 'bg-destructive/10 border-destructive'
                          : 'hover:bg-muted border-transparent'
                      }`}
                      onClick={() => toggleGroupWordSelection(word.id)}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleGroupWordSelection(word.id)}
                          className="min-h-[20px] min-w-[20px]"
                        />
                        <div className="flex-1">
                          <span className="font-medium">{word.full_word}</span>
                          <span className="text-muted-foreground ml-2 font-mono text-sm">
                            {word.mask}
                          </span>
                        </div>
                        {otherGroups.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-3 w-3 rounded-full border-yellow-500 bg-yellow-400 p-0"
                            title={`Слово также в ${otherGroups.length} других группах`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <Button
              onClick={handleRemoveWords}
              variant="destructive"
              disabled={isPending || selectedGroupWords.size === 0}
              className="min-h-[44px] w-full"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowLeft className="mr-2 h-4 w-4" />
              )}
              Удалить выбранные ({selectedGroupWords.size})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
