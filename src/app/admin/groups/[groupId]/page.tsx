import { Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/supabase/server'
import { GroupWordsManager } from '@/components/widgets/admin/group-words-manager'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
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
  noStore()
  const supabase = await createClient()

  const [groupRes, wordsRes, itemsRes] = await Promise.all([
    supabase.from('word_groups').select('*').eq('id', groupId).single(),
    supabase
      .from('words')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('word_group_items')
      .select('*')
      .eq('group_id', groupId)
      .order('sort_order', { ascending: true }),
  ])

  if (groupRes.error) {
    throw new Error('Группа не найдена')
  }
  const group = groupRes.data
  if (!group) {
    throw new Error('Группа не найдена')
  }

  if (wordsRes.error) {
    throw new Error(`Ошибка загрузки слов: ${wordsRes.error.message}`)
  }

  if (itemsRes.error) {
    throw new Error(`Ошибка загрузки связей: ${itemsRes.error.message}`)
  }

  const typedAllWords = (wordsRes.data || []) as Word[]
  const typedGroupItems = (itemsRes.data || []) as GroupItem[]
  const wordIdsInGroup = new Set(typedGroupItems.map((item) => item.word_id))
  const groupWords = typedAllWords.filter((word) => wordIdsInGroup.has(word.id))

  return {
    group: group as Group,
    allWords: typedAllWords,
    groupWords: groupWords as Word[],
    groupItems: typedGroupItems,
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
        <Button asChild variant="link" className="self-start p-0">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            Назад к админке
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Управление группой</h1>
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
  const { group, allWords, groupWords, groupItems } =
    await fetchGroupData(groupId)

  return (
    <GroupWordsManager
      groupId={group.id}
      groupName={group.name}
      groupDescription={group.description}
      allWords={allWords}
      groupWords={groupWords}
      groupItems={groupItems}
    />
  )
}
