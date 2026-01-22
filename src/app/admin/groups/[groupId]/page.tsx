import { Suspense } from 'react'
import { createClient } from '@/supabase/server'
import { GroupWordsManager } from '@/components/admin/group-words-manager'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

type Word = Database['public']['Tables']['words']['Row']
type Group = Database['public']['Tables']['word_groups']['Row']
type GroupItem = Database['public']['Tables']['word_group_items']['Row']

interface GroupPageProps {
  params: Promise<{ groupId: string }>
}

/**
 * Загружает данные для страницы управления словами в группе
 */
async function fetchGroupData(groupId: string) {
  const supabase = await createClient()

  // Загружаем группу
  const { data: group, error: groupError } = await supabase
    .from('word_groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) {
    throw new Error('Группа не найдена')
  }

  // Загружаем все слова
  const { data: allWords, error: wordsError } = await supabase
    .from('words')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (wordsError) {
    throw new Error(`Ошибка загрузки слов: ${wordsError.message}`)
  }

  // Загружаем связи слов с группами
  const { data: groupItems, error: itemsError } = await supabase
    .from('word_group_items')
    .select('*')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })

  if (itemsError) {
    throw new Error(`Ошибка загрузки связей: ${itemsError.message}`)
  }

  // Загружаем все связи для определения, в каких группах находится каждое слово
  const { data: allGroupItems, error: allItemsError } = await supabase
    .from('word_group_items')
    .select('word_id, group_id')

  if (allItemsError) {
    throw new Error(`Ошибка загрузки всех связей: ${allItemsError.message}`)
  }

  // Создаем карту: wordId -> groupIds[]
  const wordGroupsMap: Record<string, string[]> = {}
  ;(allGroupItems as Array<{ word_id: string; group_id: string }>)?.forEach(
    (item) => {
      if (!wordGroupsMap[item.word_id]) {
        wordGroupsMap[item.word_id] = []
      }
      wordGroupsMap[item.word_id].push(item.group_id)
    },
  )

  // Получаем слова, которые уже в группе
  const typedGroupItems = (groupItems || []) as GroupItem[]
  const typedAllWords = (allWords || []) as Word[]
  const wordIdsInGroup = new Set(typedGroupItems.map((item) => item.word_id))
  const groupWords = typedAllWords.filter((word) => wordIdsInGroup.has(word.id))

  return {
    group: group as Group,
    allWords: (allWords || []) as Word[],
    groupWords: groupWords as Word[],
    groupItems: (groupItems || []) as GroupItem[],
    wordGroupsMap,
  }
}

/**
 * Страница управления словами в группе
 */
export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params

  return (
    <main className="flex min-h-screen flex-col items-center p-5">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Управление группой</h1>
          <Button asChild variant="outline">
            <Link href="/admin">Назад к админке</Link>
          </Button>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          }
        >
          <GroupPageContent groupId={groupId} />
        </Suspense>
      </div>
    </main>
  )
}

async function GroupPageContent({ groupId }: { groupId: string }) {
  const { group, allWords, groupWords, groupItems, wordGroupsMap } =
    await fetchGroupData(groupId)

  return (
    <GroupWordsManager
      groupId={group.id}
      groupName={group.name}
      allWords={allWords}
      groupWords={groupWords}
      groupItems={groupItems}
      wordGroupsMap={wordGroupsMap}
    />
  )
}
