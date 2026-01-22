import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { GroupsList } from '@/components/groups-list'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-12 p-5">
        <nav className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
          <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
            <div className="flex items-center gap-5 font-semibold">
              <Link href={'/'}>Words Learning App</Link>
            </div>
            <ThemeSwitcher />
          </div>
        </nav>

        <div className="flex max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Words Learning App
            </h1>
            <p className="text-muted-foreground max-w-[600px] text-lg sm:text-xl">
              Изучайте словарные слова, заполняя пропущенные буквы. Приложение
              для детей с интерактивным обучением.
            </p>
          </div>

          <Suspense
            fallback={
              <Card className="w-full max-w-md">
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </CardContent>
              </Card>
            }
          >
            <GroupsList />
          </Suspense>
        </div>

        <footer className="text-muted-foreground mx-auto flex w-full items-center justify-center gap-8 border-t py-8 text-center text-xs">
          <p>Words Learning App - Обучение словарным словам</p>
        </footer>
      </div>
    </main>
  )
}
