import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { AddWordForm } from '@/components/admin/add-word-form'
import { WordsListServer } from '@/components/admin/words-list-server'
import { GroupsListServer } from '@/components/admin/groups-list-server'
import { EnvVarWarningAdmin } from '@/components/env-var-warning-admin'

/**
 * Страница администратора для добавления слов и управления группами
 * TODO: Добавить проверку аутентификации через middleware
 */
export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-5">
      <div className="flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Админ-панель</h1>
          <Button asChild variant="outline">
            <Link href="/">На главную</Link>
          </Button>
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
