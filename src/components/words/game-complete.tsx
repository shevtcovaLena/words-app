'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, RotateCcw, Home, Star } from 'lucide-react'
import Link from 'next/link'
import { GameSession } from '@/lib/game'

interface GameCompleteProps {
  gameSession: GameSession
  onRestart: () => void
}

/**
 * Компонент экрана завершения игры (детский интерфейс)
 */
export function GameComplete({ gameSession, onRestart }: GameCompleteProps) {
  const stats = gameSession.getStatus()
  const isPerfect = stats.mistakes === 0

  // Генерируем звезды на основе результата
  const starsCount = isPerfect ? 3 : stats.mistakes <= 2 ? 2 : 1

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <Card className="w-full overflow-hidden">
        <CardContent className="space-y-8 p-8">
          {/* Анимированный трофей */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center"
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: 2,
                repeatDelay: 1,
              }}
              className={`rounded-full p-6 ${
                isPerfect
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              <Trophy
                className={`h-16 w-16 ${
                  isPerfect ? 'text-yellow-500' : 'text-green-500'
                }`}
              />
            </motion.div>
          </motion.div>

          {/* Звезды */}
          <div className="flex justify-center gap-4">
            {[1, 2, 3].map((star) => (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: star <= starsCount ? 1 : 0.5,
                  rotate: 0,
                  opacity: star <= starsCount ? 1 : 0.3,
                }}
                transition={{
                  delay: 0.3 + star * 0.2,
                  type: 'spring',
                  stiffness: 300,
                }}
              >
                <Star
                  className={`h-12 w-12 ${
                    star <= starsCount
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </motion.div>
            ))}
          </div>

          {/* Эмоджи и сообщение */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-2 text-center"
          >
            <motion.p
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl"
            >
              {isPerfect ? '🎉' : stats.mistakes <= 2 ? '👏' : '👍'}
            </motion.p>
            <p className="text-3xl font-bold">
              {isPerfect ? 'Отлично!' : 'Молодец!'}
            </p>
          </motion.div>

          {/* Статистика (упрощенная) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-muted rounded-2xl p-4 text-center">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {stats.totalWords}
              </p>
              <p className="text-muted-foreground text-sm">слов</p>
            </div>
            <div className="bg-muted rounded-2xl p-4 text-center">
              <p
                className={`text-4xl font-bold ${
                  stats.mistakes === 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-500'
                }`}
              >
                {stats.mistakes}
              </p>
              <p className="text-muted-foreground text-sm">ошибок</p>
            </div>
          </motion.div>

          {/* Кнопки действий */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center gap-6"
          >
            <Button
              onClick={onRestart}
              size="lg"
              className="h-20 w-20 rounded-full bg-green-500 p-0 hover:bg-green-600"
            >
              <RotateCcw className="h-10 w-10" />
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-20 w-20 rounded-full p-0"
            >
              <Link href="/">
                <Home className="h-10 w-10" />
              </Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
