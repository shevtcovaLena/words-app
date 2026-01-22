import { Button } from '@/components/ui/button'
import Link from 'next/link'

/**
 * Страница регистрации (заглушка для админки)
 * TODO: Реализовать форму регистрации для администраторов
 */
export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Регистрация</h1>
        <p className="text-muted-foreground">
          Форма регистрации будет реализована позже для администраторов
        </p>
        <Button asChild variant="outline">
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </div>
  )
}
