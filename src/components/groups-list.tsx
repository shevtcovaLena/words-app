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

/**
 * Загружает список групп слов с количеством слов в каждой
 */
async function fetchGroups(): Promise<(Group & { wordsCount: number })[]> {
  const supabase = await createClient()

  // Загружаем группы
  const { data: groups, error: groupsError } = await supabase
    .from('word_groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (groupsError) {
    console.error('Ошибка загрузки групп:', groupsError)
    return []
  }

  if (!groups || groups.length === 0) {
    return []
  }

  // Загружаем количество слов в каждой группе
  const typedGroups = groups as Group[]
  const groupIds = typedGroups.map((g) => g.id)
  const { data: counts, error: countsError } = await supabase
    .from('word_group_items')
    .select('group_id')
    .in('group_id', groupIds)

  if (countsError) {
    console.error('Ошибка загрузки количества слов:', countsError)
    return typedGroups.map((g) => ({ ...g, wordsCount: 0 }))
  }

  // Подсчитываем слова для каждой группы
  const countsMap = new Map<string, number>()
  ;(counts as Array<{ group_id: string }>)?.forEach((item) => {
    countsMap.set(item.group_id, (countsMap.get(item.group_id) || 0) + 1)
  })

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
