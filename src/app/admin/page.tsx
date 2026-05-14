import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { AddWordForm } from '@/components/features/add-word-form'
import { WordsListServer } from '@/components/widgets/admin/words-list-server'
import { GroupsListServer } from '@/components/widgets/admin/groups-list-server'
import { EnvVarWarningAdmin } from '@/components/env-var-warning-admin'
import { ArrowLeft } from 'lucide-react'

/**
 * Страница администратора для добавления слов и управления группами
 */
export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-5">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <Button asChild variant="link" className="self-start p-0">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Админ-панель</h1>
        </div>

        <EnvVarWarningAdmin />

        <Tabs defaultValue="words" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="words" className="min-h-[44px]">
              Слова
            </TabsTrigger>
            <TabsTrigger value="groups" className="min-h-[44px]">
              Группы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="words" className="space-y-6">
            <AddWordForm />
            <WordsListServer />
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <GroupsListServer />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
