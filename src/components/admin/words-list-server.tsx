import { Suspense } from 'react'
import { createClient } from '@/supabase/server'
import { WordsList } from './words-list'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

/**
 * Server Component для загрузки слов
 * Обернут в Suspense для корректной работы с cookies()
 */
async function WordsListData() {
  const supabase = await createClient()

  const { data: words, error } = await supabase
    .from('words')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching words:', error)
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive text-sm">
            Ошибка загрузки слов: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  return <WordsList words={words || []} />
}

/**
 * Обертка с Suspense для загрузки слов
 */
export function WordsListServer() {
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
      <WordsListData />
    </Suspense>
  )
}
