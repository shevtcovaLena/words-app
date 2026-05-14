'use client'

import { useState, useTransition, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { VirtualList } from '@/components/shared/virtual-list'
import {
  addWordsToGroup,
  removeWordsFromGroup,
  updateGroup,
  type ActionResult,
} from '@/app/admin/group-actions'
import { ArrowRight, ArrowLeft, Loader2, Search } from 'lucide-react'
import type { Database } from '@/types/supabase'
import WordRow from '../../entities/word/words-list-item'

type Word = Database['public']['Tables']['words']['Row']
type GroupItem = Database['public']['Tables']['word_group_items']['Row']

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

function wordMatchesQuery(word: Word, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const full = (word.full_word || '').toLowerCase()
  const mask = (word.mask || '').toLowerCase()
  return full.startsWith(q) || mask.startsWith(q)
}

interface GroupWordsManagerProps {
  groupId: string
  groupName: string
  groupDescription: string | null
  allWords: Word[]
  groupWords: Word[]
  groupItems: GroupItem[]
}

/**
 * Компонент для управления словами в группе
 */
export function GroupWordsManager({
  groupId,
  groupName,
  groupDescription,
  allWords,
  groupWords,
  groupItems,
}: GroupWordsManagerProps) {
  const router = useRouter()
  const [isListPending, startListTransition] = useTransition()
  const [isMetaPending, startMetaTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)
  const [metaResult, setMetaResult] = useState<ActionResult | null>(null)
  const [availableSearch, setAvailableSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const debouncedAvailableSearch = useDebouncedValue(
    availableSearch.trim(),
    300,
  )
  const debouncedGroupSearch = useDebouncedValue(groupSearch.trim(), 300)
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [selectedGroupWords, setSelectedGroupWords] = useState<Set<string>>(
    new Set(),
  )
  const [localGroupName, setLocalGroupName] = useState('')
  const [localGroupDescription, setLocalGroupDescription] = useState('')

  const groupWordIds = useMemo(() => {
    return new Set(groupWords.map((word) => word.id))
  }, [groupWords])

  const groupItemOrderMap = useMemo(() => {
    return new Map(groupItems.map((item) => [item.word_id, item.sort_order]))
  }, [groupItems])

  const sortedGroupWords = useMemo(() => {
    return [...groupWords].sort((a, b) => {
      return (
        (groupItemOrderMap.get(a.id) || 0) - (groupItemOrderMap.get(b.id) || 0)
      )
    })
  }, [groupWords, groupItemOrderMap])

  const availableWords = useMemo(
    () => allWords.filter((word) => !groupWordIds.has(word.id)),
    [allWords, groupWordIds],
  )

  const filteredAvailableWords = useMemo(
    () =>
      availableWords.filter((word) =>
        wordMatchesQuery(word, debouncedAvailableSearch),
      ),
    [availableWords, debouncedAvailableSearch],
  )

  const filteredGroupWords = useMemo(
    () =>
      sortedGroupWords.filter((word) =>
        wordMatchesQuery(word, debouncedGroupSearch),
      ),
    [sortedGroupWords, debouncedGroupSearch],
  )

  async function handleSaveGroupMeta(e: React.FormEvent) {
    e.preventDefault()

    const finalName = (localGroupName || groupName).trim()
    const finalDesc = (localGroupDescription || (groupDescription ?? '')).trim()

    if (!finalName) {
      setMetaResult({ success: false, error: 'Введите название группы' })
      return
    }

    const formData = new FormData()
    formData.append('name', finalName)
    formData.append('description', finalDesc)

    startMetaTransition(async () => {
      const result = await updateGroup(groupId, formData)
      setMetaResult(result)

      if (result.success) {
        setLocalGroupName('')
        setLocalGroupDescription('')
        router.refresh()
        setTimeout(() => setMetaResult(null), 3000)
      }
    })
  }

  async function handleAddWords() {
    if (selectedWords.size === 0) {
      return
    }

    startListTransition(async () => {
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

    startListTransition(async () => {
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
    setSelectedWords(new Set(filteredAvailableWords.map((word) => word.id)))
  }

  function selectAllInGroup() {
    setSelectedGroupWords(new Set(filteredGroupWords.map((word) => word.id)))
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
        <form
          onSubmit={handleSaveGroupMeta}
          className="space-y-4 rounded-lg border p-4"
        >
          <h3 className="text-base font-semibold">
            Название и описание группы
          </h3>
          <div className="space-y-2">
            <Label htmlFor="group_meta_name">Название *</Label>
            <Input
              id="group_meta_name"
              value={localGroupName || groupName} // пропс как fallback
              onChange={(e) => setLocalGroupName(e.target.value)}
              minLength={2}
              required
              className="min-h-[44px]"
              disabled={isMetaPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group_meta_description">Описание</Label>
            <Textarea
              id="group_meta_description"
              value={localGroupDescription || (groupDescription ?? '')}
              onChange={(e) => setLocalGroupDescription(e.target.value)}
              rows={2}
              className="min-h-[72px]"
              disabled={isMetaPending}
            />
          </div>
          {metaResult && (
            <div
              className={`rounded-md p-3 text-sm ${
                metaResult.success
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {metaResult.success ? metaResult.message : metaResult.error}
            </div>
          )}
          <Button
            type="submit"
            disabled={isMetaPending}
            className="min-h-[44px]"
          >
            {isMetaPending ? 'Сохранение...' : 'Сохранить название и описание'}
          </Button>
        </form>

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                Все слова ({filteredAvailableWords.length}
                {debouncedAvailableSearch ? ` из ${availableWords.length}` : ''}
                )
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllAvailable}
                disabled={isListPending || filteredAvailableWords.length === 0}
              >
                Выбрать все доступные
              </Button>
            </div>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="С начала слова или маски…"
                value={availableSearch}
                onChange={(e) => setAvailableSearch(e.target.value)}
                className="min-h-[44px] pl-9"
                disabled={isListPending}
                aria-label="Поиск среди всех слов"
              />
            </div>
            <VirtualList
              items={filteredAvailableWords}
              height={500}
              estimateSize={72}
              className="rounded-lg border p-3"
              renderItem={(word) => (
                <WordRow
                  word={word}
                  isSelected={selectedWords.has(word.id)}
                  onToggle={toggleWordSelection}
                  badgeCount={0}
                  variant="available"
                />
              )}
            />
            <Button
              onClick={handleAddWords}
              disabled={isListPending || selectedWords.size === 0}
              className="min-h-[44px] w-full"
            >
              {isListPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Добавить выбранные ({selectedWords.size})
            </Button>
          </div>

          {/* Список слов в группе */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                Слова в группе ({filteredGroupWords.length}
                {debouncedGroupSearch ? ` из ${sortedGroupWords.length}` : ''})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllInGroup}
                disabled={isListPending || filteredGroupWords.length === 0}
              >
                Выбрать все
              </Button>
            </div>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="С начала слова или маски…"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="min-h-[44px] pl-9"
                disabled={isListPending}
                aria-label="Поиск среди слов в группе"
              />
            </div>
            <VirtualList
              items={filteredGroupWords}
              height={500}
              estimateSize={72}
              className="rounded-lg border p-3"
              renderItem={(word) => (
                <WordRow
                  word={word}
                  isSelected={selectedGroupWords.has(word.id)}
                  onToggle={toggleGroupWordSelection}
                  badgeCount={0}
                  variant="group"
                />
              )}
            />
            <Button
              onClick={handleRemoveWords}
              variant="destructive"
              disabled={isListPending || selectedGroupWords.size === 0}
              className="min-h-[44px] w-full"
            >
              {isListPending ? (
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
