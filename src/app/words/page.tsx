'use client'

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { WordsPractice } from '@/components/words/words-practice'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function WordsPageContent() {
  const searchParams = useSearchParams()
  const groupId = searchParams.get('group') || undefined

  return (
    <main className="flex min-h-screen flex-col items-center p-5">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Обучение словам</h1>
          <Button asChild variant="outline">
            <Link href="/">Назад на главную</Link>
          </Button>
        </div>

        <WordsPractice groupId={groupId} />
      </div>
    </main>
  )
}

export default function WordsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center p-5">
          <div className="flex w-full max-w-4xl flex-col gap-6">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          </div>
        </main>
      }
    >
      <WordsPageContent />
    </Suspense>
  )
}
