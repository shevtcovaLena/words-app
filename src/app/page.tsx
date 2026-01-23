import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { GroupsList } from '@/components/groups-list'
import { Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-12 p-5">
        <nav className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
          <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Link href={'/'} className="flex items-center gap-2 text-lg">
                <span className="text-2xl">📚</span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Словарик
                </span>
              </Link>
            </div>
            <ThemeSwitcher />
          </div>
        </nav>

        <div className="flex max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3">
              <span className="animate-bounce text-5xl">✨</span>
              <h1 className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
                Словарик
              </h1>
              <span className="animation-delay-300 animate-bounce text-5xl">
                🎯
              </span>
            </div>
            <p className="text-muted-foreground max-w-[600px] text-lg sm:text-xl">
              Учи словарные слова играючи! Заполняй пропущенные буквы и
              становись мастером грамотности 🚀
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

        <footer className="text-muted-foreground mx-auto flex w-full items-center justify-center gap-2 border-t py-8 text-center text-xs">
          <Sparkles className="h-4 w-4" />
          <p>СЛОВАРЬиКо — учись с удовольствием!</p>
          <Sparkles className="h-4 w-4" />
        </footer>
      </div>
    </main>
  )
}
