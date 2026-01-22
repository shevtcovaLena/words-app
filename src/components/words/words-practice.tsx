'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { createClient } from '@/supabase/client'
import { WordPractice } from './word-practice'
import { GameComplete } from './game-complete'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { GameSession } from '@/lib/game'
import type { Database } from '@/types/supabase'

type Word = Database['public']['Tables']['words']['Row']

interface WordsPracticeProps {
  groupId?: string
}

/**
 * Загружает публичные слова из Supabase
 * Если указан groupId, загружает только слова из этой группы
 */
async function fetchWords(groupId?: string): Promise<Word[]> {
  const supabase = createClient()

  if (groupId) {
    // Загружаем слова из группы через связующую таблицу
    const { data, error } = await supabase
      .from('word_group_items')
      .select(
        `
        word_id,
        words (
          id,
          full_word,
          mask,
          level,
          is_public,
          created_at
        )
      `,
      )
      .eq('group_id', groupId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(`Ошибка загрузки слов из группы: ${error.message}`)
    }

    // Извлекаем слова из результата и фильтруем только публичные
    const words = (data || [])
      .map((item: any) => item.words)
      .filter((word: Word | null) => word && word.is_public) as Word[]

    return words
  } else {
    // Загружаем все публичные слова
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('is_public', true)
      .order('level', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Ошибка загрузки слов: ${error.message}`)
    }

    return data || []
  }
}

/**
 * Компонент для тренировки слов с игровой механикой
 */
export function WordsPractice({ groupId }: WordsPracticeProps = {}) {
  const [updateKey, setUpdateKey] = useState(0) // Для принудительного ререндера
  const [sessionKey, setSessionKey] = useState(0) // Ключ для пересоздания сессии
  const pathname = usePathname()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['words', groupId],
    queryFn: () => fetchWords(groupId),
  })

  // Сброс состояния при переходе на страницу обучения или изменении группы
  useEffect(() => {
    setSessionKey((prev) => prev + 1)
    setUpdateKey(0)
  }, [pathname, groupId])

  // Создаем игровую сессию через useMemo вместо useEffect
  // sessionKey используется для пересоздания сессии при перезапуске
  const gameSession = useMemo(() => {
    if (data && data.length > 0) {
      return new GameSession(data)
    }
    return null
    // sessionKey намеренно включен для пересоздания сессии
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sessionKey])

  function handleAnswer(isCorrect: boolean) {
    if (!gameSession) {
      return
    }

    gameSession.handleAnswer(isCorrect)
    // Принудительно обновляем компонент
    setUpdateKey((prev) => prev + 1)
  }

  function handleRestart() {
    setSessionKey((prev) => prev + 1)
    setUpdateKey(0)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ошибка загрузки</CardTitle>
          <CardDescription>Не удалось загрузить слова</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4 text-sm">{error.message}</p>
          <Button onClick={() => refetch()}>Попробовать снова</Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет слов для обучения</CardTitle>
          <CardDescription>Добавьте слова в админ-панели</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            В базе данных пока нет публичных слов для обучения. Добавьте их
            через админ-панель.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!gameSession) {
    return null
  }

  // Используем updateKey для принудительного обновления
  void updateKey

  const status = gameSession.getStatus()

  // Если игра завершена, показываем экран завершения
  if (status.isCompleted) {
    return <GameComplete gameSession={gameSession} onRestart={handleRestart} />
  }

  const currentWord = status.currentWord
  const isRetry = gameSession.retryCount > 0 && currentWord?.needsRetry

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">Прогресс</p>
              <p className="text-2xl font-bold">
                {status.completedCount} / {status.totalWords}
              </p>
              <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Ошибок</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {status.mistakes}
              </p>
            </div>
            {status.retryCount > 0 && (
              <div>
                <p className="text-muted-foreground text-sm">Повтор</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {status.retryCount}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm">Успешно</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {status.completedCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Тренировка текущего слова */}
      {currentWord && (
        <WordPractice
          word={currentWord}
          onNext={handleAnswer}
          isRetry={isRetry}
        />
      )}

      {/* Кнопка перезапуска */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleRestart}>
          Начать заново
        </Button>
      </div>
    </div>
  )
}
