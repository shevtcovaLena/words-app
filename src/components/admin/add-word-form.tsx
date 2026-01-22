'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addWord, type ActionResult } from '@/app/admin/actions'
import { WordMaskEditor } from './word-mask-editor'
import { PhotoUpload } from './photo-upload'

/**
 * Форма для добавления нового слова с визуальным редактором маски
 */
export function AddWordForm() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)
  const [fullWord, setFullWord] = useState('')
  const [mask, setMask] = useState('')
  const [level, setLevel] = useState('1')
  const [isPublic, setIsPublic] = useState(true)

  // Batch режим
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [batchWords, setBatchWords] = useState('')
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const [batchWordsList, setBatchWordsList] = useState<string[]>([])
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [currentBatchWord, setCurrentBatchWord] = useState('')
  const [currentBatchMask, setCurrentBatchMask] = useState('')

  const formRef = useRef<HTMLFormElement>(null)

  /**
   * Сброс формы
   */
  function resetForm() {
    setFullWord('')
    setMask('')
    setLevel('1')
    setIsPublic(true)
    setResult(null)
    formRef.current?.reset()
  }

  /**
   * Обработка изменения маски из WordMaskEditor
   */
  function handleMaskChange(newMask: string) {
    setMask(newMask)
  }

  /**
   * Обработка изменения полного слова
   */
  function handleFullWordChange(value: string) {
    setFullWord(value)
    // Сбрасываем маску при изменении слова, чтобы WordMaskEditor создал новую
    setMask('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!fullWord.trim()) {
      setResult({ success: false, error: 'Введите полное слово' })
      return
    }

    if (!mask || !mask.includes('_')) {
      setResult({
        success: false,
        error: 'Отметьте хотя бы один пропуск в слове',
      })
      return
    }

    const formData = new FormData()
    formData.append('full_word', fullWord.trim())
    formData.append('mask', mask)
    formData.append('level', level)
    formData.append('is_public', isPublic ? 'on' : '')

    startTransition(async () => {
      const actionResult = await addWord(formData)
      setResult(actionResult)

      if (actionResult.success) {
        // Сброс формы при успехе
        resetForm()
        // Очистка сообщения через 3 секунды
        setTimeout(() => setResult(null), 3000)
      }
    })
  }

  /**
   * Обработка batch-режима
   */
  function handleBatchStart() {
    const words = batchWords
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w.length > 0)

    if (words.length === 0) {
      setResult({ success: false, error: 'Введите хотя бы одно слово' })
      return
    }

    setBatchWordsList(words)
    setCurrentBatchIndex(0)
    setCurrentBatchWord(words[0])
    setCurrentBatchMask('')
    setIsBatchDialogOpen(true)
  }

  /**
   * Сохранение текущего слова в batch-режиме
   */
  async function handleBatchSave() {
    if (!currentBatchMask || !currentBatchMask.includes('_')) {
      setResult({
        success: false,
        error: 'Отметьте хотя бы один пропуск в слове',
      })
      return
    }

    const formData = new FormData()
    formData.append('full_word', currentBatchWord.trim())
    formData.append('mask', currentBatchMask)
    formData.append('level', level)
    formData.append('is_public', isPublic ? 'on' : '')

    const actionResult = await addWord(formData)

    if (!actionResult.success) {
      setResult(actionResult)
      return
    }

    // Переход к следующему слову
    const nextIndex = currentBatchIndex + 1
    if (nextIndex < batchWordsList.length) {
      setCurrentBatchIndex(nextIndex)
      setCurrentBatchWord(batchWordsList[nextIndex])
      setCurrentBatchMask('')
      setResult({
        success: true,
        message: `Слово "${currentBatchWord}" добавлено. Следующее: ${batchWordsList[nextIndex]}`,
      })
    } else {
      // Все слова добавлены
      setIsBatchDialogOpen(false)
      setBatchWords('')
      setBatchWordsList([])
      setResult({
        success: true,
        message: `Все ${batchWordsList.length} слов успешно добавлены!`,
      })
      setTimeout(() => setResult(null), 5000)
    }
  }

  /**
   * Пропуск текущего слова в batch-режиме
   */
  function handleBatchSkip() {
    const nextIndex = currentBatchIndex + 1
    if (nextIndex < batchWordsList.length) {
      setCurrentBatchIndex(nextIndex)
      setCurrentBatchWord(batchWordsList[nextIndex])
      setCurrentBatchMask('')
    } else {
      setIsBatchDialogOpen(false)
      setBatchWords('')
      setBatchWordsList([])
    }
  }

  /**
   * Обработка распознанных слов из OCR
   */
  function handleWordsExtracted(words: string[]) {
    // Заполняем textarea для batch-режима распознанными словами
    setBatchWords(words.join('\n'))
    setResult({
      success: true,
      message: `Распознано ${words.length} слов. Перейдите в раздел "Добавить несколько слов" для разметки пропусков.`,
    })
    setTimeout(() => setResult(null), 5000)
  }

  return (
    <>
      {/* Загрузка фото с OCR */}
      <PhotoUpload
        onWordsExtracted={handleWordsExtracted}
        disabled={isPending}
      />

      <Card>
        <CardHeader>
          <CardTitle>Добавить слово</CardTitle>
          <CardDescription>
            Введите полное слово и отметьте пропуски кликами по буквам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_word">Полное слово *</Label>
              <Input
                id="full_word"
                type="text"
                placeholder="например: молоко"
                required
                minLength={2}
                value={fullWord}
                onChange={(e) => handleFullWordChange(e.target.value)}
                className="min-h-[44px] text-lg"
                disabled={isPending}
              />
            </div>

            {fullWord.trim() && (
              <div className="space-y-3">
                <Label>Отметьте пропуски:</Label>
                <WordMaskEditor
                  key={fullWord.trim()}
                  word={fullWord.trim()}
                  initialMask={mask}
                  onChange={handleMaskChange}
                />
              </div>
            )}

            {/* Скрытое поле mask для формы */}
            <input type="hidden" name="mask" value={mask} />

            <div className="space-y-2">
              <Label htmlFor="level">Уровень сложности</Label>
              <Input
                id="level"
                name="level"
                type="number"
                min="1"
                max="5"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="min-h-[44px]"
                disabled={isPending}
              />
              <p className="text-muted-foreground text-xs">
                От 1 (легкий) до 5 (сложный)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
                disabled={isPending}
              />
              <Label
                htmlFor="is_public"
                className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Публичное слово (доступно для обучения)
              </Label>
            </div>

            {result && (
              <div
                className={`rounded-md p-3 text-sm ${
                  result.success
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {result.success ? result.message : result.error}
              </div>
            )}

            <Button
              type="submit"
              className="min-h-[44px] w-full"
              disabled={isPending || !mask}
            >
              {isPending ? 'Добавление...' : 'Добавить слово'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Batch режим */}
      <Card>
        <CardHeader>
          <CardTitle>Добавить несколько слов</CardTitle>
          <CardDescription>
            Введите слова по одному на строку, затем разметьте пропуски для
            каждого
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch_words">Список слов (одно на строку)</Label>
            <Textarea
              id="batch_words"
              placeholder="кот&#10;дом&#10;молоко"
              value={batchWords}
              onChange={(e) => setBatchWords(e.target.value)}
              rows={5}
              className="min-h-[120px] font-mono"
              disabled={isPending || isBatchDialogOpen}
            />
          </div>

          <Button
            onClick={handleBatchStart}
            className="min-h-[44px] w-full"
            disabled={isPending || isBatchDialogOpen || !batchWords.trim()}
          >
            Разметить пропуски
          </Button>
        </CardContent>
      </Card>

      {/* Модальное окно для batch-режима */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Разметка пропусков ({currentBatchIndex + 1} /{' '}
              {batchWordsList.length})
            </DialogTitle>
            <DialogDescription>
              Отметьте пропуски для слова: <strong>{currentBatchWord}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <WordMaskEditor
              key={`${currentBatchWord}-${currentBatchIndex}`}
              word={currentBatchWord}
              initialMask={currentBatchMask}
              onChange={setCurrentBatchMask}
            />

            <div className="flex gap-3">
              <Button
                onClick={handleBatchSave}
                className="min-h-[44px] flex-1"
                disabled={!currentBatchMask || !currentBatchMask.includes('_')}
              >
                Сохранить и продолжить
              </Button>
              <Button
                onClick={handleBatchSkip}
                variant="outline"
                className="min-h-[44px]"
              >
                Пропустить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
