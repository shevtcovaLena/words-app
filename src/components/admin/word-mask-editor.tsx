'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WordMaskEditorProps {
  word: string
  initialMask?: string
  onChange: (mask: string) => void
}

/**
 * Парсит маску в массив gaps
 */
function parseMaskToGaps(word: string, mask: string): boolean[] {
  const maskGaps: boolean[] = []
  let wordIndex = 0
  let maskIndex = 0

  while (wordIndex < word.length && maskIndex < mask.length) {
    if (word[wordIndex] === ' ') {
      // Пробелы пропускаем
      wordIndex++
      if (mask[maskIndex] === ' ') {
        maskIndex++
      }
      continue
    }

    if (mask[maskIndex] === '_') {
      maskGaps[wordIndex] = true
      wordIndex++
      maskIndex++
    } else if (mask[maskIndex] === word[wordIndex]) {
      maskGaps[wordIndex] = false
      wordIndex++
      maskIndex++
    } else if (mask[maskIndex] === ' ') {
      maskIndex++
    } else {
      // Несовпадение - пропускаем в маске
      maskIndex++
    }
  }

  // Заполняем оставшиеся позиции false
  while (wordIndex < word.length) {
    maskGaps[wordIndex] = false
    wordIndex++
  }

  return maskGaps
}

/**
 * Формирует маску из состояния gaps
 */
function getMaskFromGaps(word: string, gapsArray: boolean[]): string {
  let mask = ''
  for (let i = 0; i < word.length; i++) {
    if (word[i] === ' ') {
      mask += ' '
    } else if (gapsArray[i]) {
      mask += '_'
    } else {
      mask += word[i]
    }
  }
  return mask
}

/**
 * Компонент для визуального редактирования маски слова
 * Позволяет выбирать пропуски кликами по буквам и редактировать маску вручную
 */
export function WordMaskEditor({
  word,
  initialMask,
  onChange,
}: WordMaskEditorProps) {
  // Вычисляем начальное состояние на основе пропсов
  const initialGaps = useMemo(() => {
    if (!word) return []
    if (initialMask) {
      return parseMaskToGaps(word, initialMask)
    }
    return Array(word.length).fill(false)
  }, [word, initialMask])

  const initialManualMask = useMemo(() => {
    return initialMask || word || ''
  }, [word, initialMask])

  // Состояние: массив boolean (true = пропуск, false = буква)
  const [gaps, setGaps] = useState<boolean[]>(initialGaps)

  // Состояние для ручного редактирования маски
  const [manualMask, setManualMask] = useState<string>(initialManualMask)

  // Состояние для режима выделения диапазона
  const [selectionStart, setSelectionStart] = useState<number | null>(null)

  // Мемоизируем функцию для формирования маски
  const getMaskFromGapsMemo = useCallback(
    (gapsArray: boolean[]) => getMaskFromGaps(word, gapsArray),
    [word],
  )

  // Синхронизируем состояние при изменении пропсов
  useEffect(() => {
    if (!word) {
      if (gaps.length > 0 || manualMask !== '') {
        setGaps([])
        setManualMask('')
        onChange('')
      }
      return
    }

    const newGaps = initialMask
      ? parseMaskToGaps(word, initialMask)
      : Array(word.length).fill(false)
    const newManualMask = initialMask || word

    // Обновляем только если значения изменились
    if (JSON.stringify(gaps) !== JSON.stringify(newGaps)) {
      setGaps(newGaps)
    }
    if (manualMask !== newManualMask) {
      setManualMask(newManualMask)
    }
    if (!initialMask && onChange) {
      onChange(word)
    }
    setSelectionStart(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, initialMask]) // onChange намеренно исключен, чтобы избежать лишних вызовов

  // Синхронизация manualMask с gaps при изменении через кнопки
  useEffect(() => {
    const maskFromGaps = getMaskFromGapsMemo(gaps)
    if (maskFromGaps !== manualMask) {
      setManualMask(maskFromGaps)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaps]) // manualMask и getMaskFromGapsMemo намеренно исключены

  /**
   * Обработка клика по букве - выделение диапазона или переключение
   */
  function handleLetterClick(index: number) {
    if (word[index] === ' ') {
      return
    }

    if (selectionStart === null) {
      // Начинаем выделение
      setSelectionStart(index)
    } else if (selectionStart === index) {
      // Клик по той же букве - просто переключаем
      const newGaps = [...gaps]
      newGaps[index] = !newGaps[index]
      setGaps(newGaps)
      setSelectionStart(null)

      const newMask = getMaskFromGapsMemo(newGaps)
      setManualMask(newMask)
      onChange(newMask)
    } else {
      // Завершаем выделение диапазона
      const start = Math.min(selectionStart, index)
      const end = Math.max(selectionStart, index)
      const newGaps = [...gaps]

      // Определяем, что делать с диапазоном
      const allSelected = newGaps
        .slice(start, end + 1)
        .filter((_, i) => word[start + i] !== ' ')
        .every((gap) => gap === true)
      const newValue = !allSelected

      // Применяем к диапазону
      for (let i = start; i <= end; i++) {
        if (word[i] !== ' ') {
          newGaps[i] = newValue
        }
      }

      setGaps(newGaps)
      setSelectionStart(null)

      // Обновляем маску
      const newMask = getMaskFromGapsMemo(newGaps)
      setManualMask(newMask)
      onChange(newMask)
    }
  }

  /**
   * Обработка ручного редактирования маски
   */
  function handleManualMaskChange(value: string) {
    setManualMask(value)

    // Парсим маску обратно в gaps
    try {
      const newGaps = parseMaskToGaps(word, value)
      setGaps(newGaps)
      onChange(value)
    } catch (error) {
      // Игнорируем ошибки парсинга при вводе
    }
  }

  /**
   * Синхронизация manualMask с gaps при изменении через кнопки
   */
  useEffect(() => {
    const maskFromGaps = getMaskFromGapsMemo(gaps)
    if (maskFromGaps !== manualMask) {
      setManualMask(maskFromGaps)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gaps]) // manualMask и getMaskFromGapsMemo намеренно исключены для избежания циклов

  /**
   * Получает текущую маску
   */
  function getMask(): string {
    return getMaskFromGapsMemo(gaps)
  }

  return (
    <div className="space-y-4">
      {/* Кнопки букв */}
      <div className="space-y-2">
        <Label>
          Кликните по буквам для выделения пропусков (можно выделить несколько
          подряд)
        </Label>
        <div className="flex flex-wrap justify-center gap-2">
          {word.split('').map((char, index) => {
            const isGap = gaps[index]
            const isSpace = char === ' '
            // Показываем начальную букву выделения
            const isSelectionStart = selectionStart === index

            if (isSpace) {
              return <div key={`space-${index}`} className="w-2" />
            }

            return (
              <motion.div
                key={`char-${index}`}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  onClick={() => handleLetterClick(index)}
                  variant={isGap ? 'default' : 'outline'}
                  size="lg"
                  className={`min-h-[44px] min-w-[44px] text-xl font-bold transition-all ${
                    isGap
                      ? 'border-yellow-500 bg-yellow-400 text-black hover:bg-yellow-500'
                      : isSelectionStart
                        ? 'border-blue-500 bg-blue-200 hover:bg-blue-300 dark:bg-blue-800'
                        : 'bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                  } `}
                >
                  {isGap ? '_' : char.toUpperCase()}
                </Button>
              </motion.div>
            )
          })}
        </div>
        {selectionStart !== null && (
          <p className="text-muted-foreground text-center text-sm">
            Выберите конечную букву для выделения диапазона
          </p>
        )}
      </div>

      {/* Ручное редактирование маски */}
      <div className="space-y-2">
        <Label htmlFor="manual-mask">Или отредактируйте маску вручную:</Label>
        <Input
          id="manual-mask"
          type="text"
          value={manualMask}
          onChange={(e) => handleManualMaskChange(e.target.value)}
          placeholder={word}
          className="min-h-[44px] font-mono text-lg"
        />
        <p className="text-muted-foreground text-xs">
          Используйте символ _ для пропусков. Например: &quot;ру_ский&quot; для
          &quot;русский&quot;
        </p>
      </div>

      {/* Preview маски */}
      <div className="bg-muted rounded-lg p-3 text-center">
        <span className="text-muted-foreground text-sm">Маска:</span>
        <span className="ml-2 font-mono text-lg font-bold">{getMask()}</span>
      </div>
    </div>
  )
}
