'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getMissingLetters } from '@/lib/words'
import { WordItem } from '@/lib/game'
import { Check, ArrowRight, RotateCcw } from 'lucide-react'

interface WordPracticeProps {
  word: WordItem
  onNext: (isCorrect: boolean) => void
  isRetry?: boolean
}

interface GapState {
  input: string
  isChecked: boolean
  isCorrect: boolean | null
}

/**
 * Компонент для тренировки одного слова (детский интерфейс)
 * Каждый пропуск заполняется и проверяется отдельно
 */
export function WordPractice({ word, onNext, isRetry }: WordPracticeProps) {
  // Используем word.id для сброса состояния при смене слова
  const [wordId, setWordId] = useState(word.id)

  // Пересчитываем missingSequences при изменении слова
  const missingSequences = useMemo(
    () => getMissingLetters(word.fullWord, word.mask),
    [word.fullWord, word.mask],
  )
  const gapsCount = missingSequences.length

  // Состояние для каждого пропуска
  const [gaps, setGaps] = useState<GapState[]>(() =>
    missingSequences.map(() => ({
      input: '',
      isChecked: false,
      isCorrect: null,
    })),
  )
  const [currentGapIndex, setCurrentGapIndex] = useState(0)
  const [allCompleted, setAllCompleted] = useState(false)
  const [hasAnyError, setHasAnyError] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Сброс состояния при смене слова (без useEffect)
  if (wordId !== word.id) {
    setWordId(word.id)
    setGaps(
      missingSequences.map(() => ({
        input: '',
        isChecked: false,
        isCorrect: null,
      })),
    )
    setCurrentGapIndex(0)
    setAllCompleted(false)
    setHasAnyError(false)
    inputRefs.current = []
  }

  // Синхронизируем gaps с missingSequences, если количество изменилось
  useEffect(() => {
    if (gaps.length !== missingSequences.length) {
      setGaps(
        missingSequences.map(() => ({
          input: '',
          isChecked: false,
          isCorrect: null,
        })),
      )
      setCurrentGapIndex(0)
      setAllCompleted(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingSequences.length, gaps.length])

  // Инициализируем массив refs
  if (inputRefs.current.length !== gapsCount) {
    inputRefs.current = Array(gapsCount).fill(null)
  }

  // Фокус на текущем инпуте
  useEffect(() => {
    if (inputRefs.current[currentGapIndex] && !allCompleted) {
      inputRefs.current[currentGapIndex]?.focus()
    }
  }, [currentGapIndex, allCompleted, wordId])

  // Проверка текущего пропуска
  function handleCheckGap() {
    const currentInput = gaps[currentGapIndex].input.toLowerCase()
    const expectedSequence = missingSequences[currentGapIndex]
    const isCorrect = currentInput === expectedSequence

    const newGaps = [...gaps]
    newGaps[currentGapIndex] = {
      ...newGaps[currentGapIndex],
      isChecked: true,
      isCorrect,
    }
    setGaps(newGaps)

    if (!isCorrect) {
      setHasAnyError(true)
    }

    // Автопереход к следующему пропуску через небольшую задержку
    const delay = isCorrect ? 500 : 1000
    setTimeout(() => {
      setCurrentGapIndex((prevIndex) => {
        const nextIndex = prevIndex + 1
        if (nextIndex >= gapsCount) {
          // Все пропуски проверены
          setAllCompleted(true)
          return prevIndex
        }
        return nextIndex
      })
    }, delay)
  }

  // Обновление ввода для текущего пропуска
  function handleInputChange(value: string) {
    const filtered = value.toUpperCase().replace(/[^А-ЯЁ]/g, '')
    const newGaps = [...gaps]
    newGaps[currentGapIndex] = {
      ...newGaps[currentGapIndex],
      input: filtered,
    }
    setGaps(newGaps)
  }

  // Обработка нажатия Enter
  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && gaps[currentGapIndex].input.trim()) {
      handleCheckGap()
    }
  }

  // Рендерим слово с инпутами внутри
  function renderWordWithInputs() {
    const elements: React.ReactNode[] = []
    let gapIndex = 0
    let i = 0

    while (i < word.mask.length) {
      const char = word.mask[i]

      if (char === '_') {
        const currentGap = gaps[gapIndex]
        const isCurrentGap = gapIndex === currentGapIndex && !allCompleted
        const expectedSequence = missingSequences[gapIndex]

        // Защита от выхода за пределы массива
        if (!currentGap || !expectedSequence) {
          gapIndex++
          i++
          continue
        }

        elements.push(
          <motion.span
            key={`gap-${gapIndex}`}
            layout
            className="mx-0.5 inline-flex items-center justify-center"
          >
            {currentGap.isChecked ? (
              // Показываем результат проверки
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`font-bold ${
                  currentGap.isCorrect
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {currentGap.isCorrect
                  ? currentGap.input
                  : expectedSequence.toUpperCase()}
              </motion.span>
            ) : isCurrentGap ? (
              // Инпут для текущего пропуска
              <input
                key={`input-gap-${gapIndex}-${wordId}`}
                ref={(el) => {
                  inputRefs.current[gapIndex] = el
                }}
                type="text"
                value={currentGap.input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 w-12 rounded-xl border-4 border-yellow-400 bg-yellow-50 text-center text-2xl font-bold transition-all focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300 focus:outline-none md:h-16 md:w-16 md:text-4xl dark:bg-yellow-900/20"
                autoFocus={isCurrentGap}
              />
            ) : (
              // Будущий пропуск - показываем пустое место
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-4 border-dashed border-gray-300 text-2xl text-gray-400 md:h-16 md:w-16 dark:border-gray-600">
                ?
              </span>
            )}
          </motion.span>,
        )
        gapIndex++
        i++
      } else if (char === ' ') {
        // Пробел между словами
        elements.push(
          <span key={`space-${i}`} className="inline-block w-4 md:w-6" />,
        )
        i++
      } else {
        // Обычный символ
        elements.push(
          <span key={`char-${i}`} className="inline-block">
            {char}
          </span>,
        )
        i++
      }
    }

    return elements
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="space-y-8 p-6">
        {/* Индикатор повтора */}
        <AnimatePresence>
          {isRetry && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center gap-2 text-orange-500"
            >
              <RotateCcw className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Прогресс пропусков */}
        {gapsCount > 1 && (
          <div className="flex justify-center gap-2">
            {gaps.map((gap, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: index === currentGapIndex ? 1.2 : 1,
                  backgroundColor: gap.isChecked
                    ? gap.isCorrect
                      ? '#22c55e'
                      : '#ef4444'
                    : index === currentGapIndex
                      ? '#eab308'
                      : '#d1d5db',
                }}
                className="h-4 w-4 rounded-full transition-all"
              />
            ))}
          </div>
        )}

        {/* Слово с инпутами */}
        <motion.div
          layout
          className="flex min-h-[100px] flex-wrap items-center justify-center gap-1 text-4xl font-bold md:text-5xl"
        >
          {renderWordWithInputs()}
        </motion.div>

        {/* Результат после проверки текущего пропуска */}
        <AnimatePresence mode="wait">
          {currentGapIndex < gaps.length &&
            gaps[currentGapIndex]?.isChecked &&
            !allCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex justify-center"
              >
                {gaps[currentGapIndex].isCorrect ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    className="text-4xl"
                  >
                    👍
                  </motion.span>
                ) : (
                  <motion.span
                    initial={{ x: 0 }}
                    animate={{ x: [-5, 5, -5, 5, 0] }}
                    className="text-4xl"
                  >
                    😕
                  </motion.span>
                )}
              </motion.div>
            )}
        </AnimatePresence>

        {/* Кнопка проверки или перехода */}
        <div className="flex justify-center">
          {!allCompleted &&
          currentGapIndex < gaps.length &&
          !gaps[currentGapIndex]?.isChecked ? (
            <Button
              onClick={handleCheckGap}
              disabled={!gaps[currentGapIndex]?.input.trim()}
              size="lg"
              className="h-20 w-20 rounded-full p-0"
            >
              <Check className="h-10 w-10" />
            </Button>
          ) : allCompleted || gaps.every((gap) => gap.isChecked) ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Итоговый результат */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`rounded-2xl p-6 ${
                  !hasAnyError
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}
              >
                <span className="text-5xl">{!hasAnyError ? '🎉' : '👏'}</span>
              </motion.div>

              <Button
                onClick={() => {
                  const allCorrect = gaps.every((gap) => gap.isCorrect === true)
                  onNext(allCorrect)
                }}
                size="lg"
                className="h-20 w-20 rounded-full bg-blue-500 p-0 hover:bg-blue-600"
              >
                <ArrowRight className="h-10 w-10" />
              </Button>
            </motion.div>
          ) : (
            // Ожидание автоперехода к следующему пропуску
            <div className="h-20 w-20" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
