'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { VirtualList } from '@/components/shared/virtual-list'
import {
  addWordsToGroup,
  removeWordsFromGroup,
  type ActionResult,
} from '@/app/admin/group-actions'
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import type { Database } from '@/types/supabase'
import WordRow from '../../entities/word/words-list-item'

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
 * Компонент для управления словами в группе
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
  const groupWordIds = useMemo(() => {
    return new Set(groupWords.map((word) => word.id))
  }, [groupWords])

  const groupItemOrderMap = useMemo(() => {
    return new Map(groupItems.map((item) => [item.word_id, item.sort_order]))
  }, [groupItems])

  const otherGroupsMap = useMemo(() => {
    const map = new Map<string, string[]>()

    for (const [wordId, groups] of Object.entries(wordGroupsMap)) {
      map.set(
        wordId,
        groups.filter((gId) => gId !== groupId),
      )
    }

    return map
  }, [wordGroupsMap, groupId])

  // Сортируем слова: сначала те, которых нет в других группах, затем остальные
  const sortedAllWords = useMemo(() => {
    const wordsWithoutGroups: Word[] = []
    const wordsWithGroups: Word[] = []

    for (const word of allWords) {
      const otherGroups = otherGroupsMap.get(word.id) || []
      if (otherGroups.length === 0) {
        wordsWithoutGroups.push(word)
      } else {
        wordsWithGroups.push(word)
      }
    }

    return [...wordsWithoutGroups, ...wordsWithGroups]
  }, [allWords, otherGroupsMap])

  // Слова в группе, отсортированные по sort_order
  const sortedGroupWords = useMemo(() => {
    return [...groupWords].sort((a, b) => {
      return (
        (groupItemOrderMap.get(a.id) || 0) - (groupItemOrderMap.get(b.id) || 0)
      )
    })
  }, [groupWords, groupItemOrderMap])

  async function handleAddWords() {
    if (selectedWords.size === 0) {
      return
    }

    // startTransition(async () => {
    const actionResult = await addWordsToGroup(
      groupId,
      Array.from(selectedWords),
    )
    setResult(actionResult)

    if (actionResult.success) {
      setSelectedWords(new Set())
      setTimeout(() => setResult(null), 3000)
    }
    // })
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

  const toggleWordSelection = useCallback((wordId: string) => {
    setSelectedWords((prev) => {
      const next = new Set(prev)
      if (next.has(wordId)) next.delete(wordId)
      else next.add(wordId)
      return next
    })
  }, [])

  const toggleGroupWordSelection = useCallback((wordId: string) => {
    setSelectedGroupWords((prev) => {
      const next = new Set(prev)
      if (next.has(wordId)) next.delete(wordId)
      else next.add(wordId)
      return next
    })
  }, [])

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
            <VirtualList
              items={sortedAllWords.filter(
                (word) => !groupWordIds.has(word.id),
              )}
              height={500}
              estimateSize={72}
              className="rounded-lg border p-3"
              renderItem={(word) => {
                const otherGroups = otherGroupsMap.get(word.id) || []
                return (
                  <WordRow
                    word={word}
                    isSelected={selectedWords.has(word.id)}
                    onToggle={toggleWordSelection}
                    badgeCount={otherGroups.length}
                    variant="available"
                  />
                )
              }}
            />
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
            <VirtualList
              items={sortedGroupWords}
              height={500}
              estimateSize={72}
              className="rounded-lg border p-3"
              renderItem={(word) => {
                const otherGroups = otherGroupsMap.get(word.id) || []
                return (
                  <WordRow
                    word={word}
                    isSelected={selectedGroupWords.has(word.id)}
                    onToggle={toggleGroupWordSelection}
                    badgeCount={otherGroups.length}
                    variant="group"
                  />
                )
              }}
            />
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
