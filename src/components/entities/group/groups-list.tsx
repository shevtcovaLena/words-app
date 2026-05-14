import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Database } from '@/types/supabase'

type Group = Database['public']['Tables']['word_groups']['Row']

const COUNT_CHUNK = 40
const COUNT_RETRIES = 3

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function isRetriableNetworkError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('fetch failed') ||
    m.includes('econnreset') ||
    m.includes('etimedout') ||
    m.includes('terminated') ||
    m.includes('network') ||
    m.includes('socket')
  )
}

/**
 * Подсчёт строк word_group_items по group_id (чанки + ретраи — один длинный .in() часто рвётся по сети).
 */
async function fetchWordCountsByGroupIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupIds: string[],
): Promise<Map<string, number>> {
  const countsMap = new Map<string, number>()
  if (groupIds.length === 0) {
    return countsMap
  }

  let anyChunkFailed = false
  let lastFailMessage = ''

  for (let i = 0; i < groupIds.length; i += COUNT_CHUNK) {
    const chunk = groupIds.slice(i, i + COUNT_CHUNK)
    let rows: Array<{ group_id: string }> | null = null
    let lastMessage = ''

    for (let attempt = 1; attempt <= COUNT_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('word_group_items')
        .select('group_id')
        .in('group_id', chunk)

      if (!error) {
        rows = (data || []) as Array<{ group_id: string }>
        break
      }

      lastMessage = error.message
      const canRetry =
        attempt < COUNT_RETRIES && isRetriableNetworkError(error.message)
      if (canRetry) {
        await sleep(350 * attempt)
        continue
      }
      break
    }

    if (rows === null) {
      anyChunkFailed = true
      lastFailMessage = lastMessage
      continue
    }

    for (const item of rows) {
      countsMap.set(item.group_id, (countsMap.get(item.group_id) || 0) + 1)
    }
  }

  if (anyChunkFailed) {
    console.warn(
      '[groups-list] Не удалось загрузить часть данных для счётчика слов в группах (часть бейджей может быть занижена).',
      lastFailMessage,
    )
  }

  return countsMap
}

/**
 * Загружает список групп слов с количеством слов в каждой
 */
async function fetchGroups(): Promise<(Group & { wordsCount: number })[]> {
  noStore()
  const supabase = await createClient()

  // Загружаем группы
  const { data: groups, error: groupsError } = await supabase
    .from('word_groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (groupsError) {
    console.warn('Ошибка загрузки групп:', groupsError.message)
    return []
  }

  if (!groups || groups.length === 0) {
    return []
  }

  const typedGroups = groups as Group[]
  const groupIds = typedGroups.map((g) => g.id)
  const countsMap = await fetchWordCountsByGroupIds(supabase, groupIds)

  return typedGroups.map((group) => ({
    ...group,
    wordsCount: countsMap.get(group.id) || 0,
  }))
}

/**
 * Server Component списка групп для главной страницы
 */
export async function GroupsList() {
  const groups = await fetchGroups()

  if (groups.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Выберите группу слов</h2>
        <p className="text-muted-foreground">
          Изучайте слова из готовых подборок или все слова сразу
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id} className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  {group.description && (
                    <CardDescription className="mt-1">
                      {group.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="secondary" className="ml-2">
                  {group.wordsCount} {group.wordsCount === 1 ? 'слово' : 'слов'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="min-h-[44px] w-full" size="lg">
                <Link href={`/words?group=${group.id}`}>Начать обучение</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Карточка "Все слова" */}
        <Card className="border-primary/20 transition-shadow hover:shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">Все слова</CardTitle>
                <CardDescription>Изучайте все доступные слова</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="outline"
              className="min-h-[44px] w-full"
              size="lg"
            >
              <Link href="/words">Начать обучение</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
