'use client'

import Link from 'next/link'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { useUser } from '@/contexts/user-context'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/logout-button'

export function Header() {
  const { isAuthenticated } = useUser()

  return (
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
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Вход
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
