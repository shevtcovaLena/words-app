import { Suspense } from 'react'
import { createClient } from '@/supabase/server'
import { GroupManager } from './group-manager'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import type { Database } from '@/types/supabase'

type Group = Database['public']['Tables']['word_groups']['Row']

/**
 * Загружает список групп слов
 */
async function fetchGroups(): Promise<Group[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('word_groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Ошибка загрузки групп:', error)
    return []
  }

  return data || []
}

/**
 * Server Component для отображения списка групп
 */
export function GroupsListServer() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      }
    >
      <GroupsListContent />
    </Suspense>
  )
}

async function GroupsListContent() {
  const groups = await fetchGroups()
  return <GroupManager groups={groups} />
}
