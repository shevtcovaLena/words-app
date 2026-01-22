import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { hasEnvVars } from '@/utils/env'

/**
 * Компонент для отображения предупреждения о настройке переменных окружения
 */
export function EnvVarWarningAdmin() {
  if (hasEnvVars) {
    return null
  }

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <CardHeader>
        <CardTitle className="text-yellow-800 dark:text-yellow-400">
          Настройка переменных окружения
        </CardTitle>
        <CardDescription className="text-yellow-700 dark:text-yellow-300">
          Необходимо настроить Supabase для работы приложения
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-yellow-800 dark:text-yellow-400">
          Создайте файл{' '}
          <code className="rounded bg-yellow-100 px-1 py-0.5 dark:bg-yellow-900/40">
            .env.local
          </code>{' '}
          в корне проекта и добавьте:
        </p>
        <pre className="rounded-md bg-yellow-100 p-3 text-xs dark:bg-yellow-900/40">
          <code>
            {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key`}
          </code>
        </pre>
        <p className="mt-4 text-sm text-yellow-800 dark:text-yellow-400">
          Получить эти значения можно в{' '}
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noreferrer"
            className="underline hover:no-underline"
          >
            настройках API вашего Supabase проекта
          </a>
        </p>
      </CardContent>
    </Card>
  )
}
